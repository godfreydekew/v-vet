import logging
import uuid
from datetime import datetime, timezone

from sqlmodel import Session

from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_flow_message, send_whatsapp_message

logger = logging.getLogger(__name__)

_SEX_LABELS = {"female": "Female", "male": "Male", "unknown": "Unknown"}


class RecordBirthFlow(BaseFlow):
    """
    Records a calving event: select the dam (mother), capture survival,
    calf sex, colostrum intake, dam mastitis signs, and date of birth in one
    combined WhatsApp Flow form, then create the calf record and link it to
    the dam via livestock_parentage.
    """

    flow_id = "record_birth"

    SMALL_HERD_THRESHOLD = 10

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        from app.core.config import settings
        from app.crud import get_livestock_for_user
        from app.flows.animal_list import MAX_ANIMALS

        if not user.linked_user_id:
            return False

        dam_count = len(
            get_livestock_for_user(
                session=session, user_id=user.linked_user_id, limit=MAX_ANIMALS, gender="female"
            )
        )
        if dam_count == 0:
            return False

        if dam_count >= self.SMALL_HERD_THRESHOLD:
            if not settings.FLOW_ID_IDENTIFY_ANIMAL:
                logger.warning(
                    "[RecordBirthFlow] FLOW_ID_IDENTIFY_ANIMAL not configured — falling back to text prompt."
                )
                response = send_whatsapp_message(
                    phone=phone,
                    text=(
                        "Congratulations on the new birth! 🐄🎉\n\n"
                        "You have quite a few cows registered — which mother cow gave birth? "
                        "Please reply with her name or tag number."
                    ),
                )
                return response.status_code == 200

            response = send_flow_message(
                phone=phone,
                flow_id=settings.FLOW_ID_IDENTIFY_ANIMAL,
                flow_token=self.flow_id,
                body="Congratulations on the new birth! 🐄🎉\n\nLet's find out which cow it was.",
                cta="Continue",
                screen="IDENTIFY_ANIMAL",
            )
            return response.status_code == 200

        return self.send_dam_list(phone=phone, user=user, session=session)

    def send_dam_list(self, *, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(phone=phone, user=user, session=session, intent="birth")

    def show_more(self, *, offset: int, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(
            phone=phone, user=user, session=session, intent="birth", offset=offset
        )

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        """
        Both the identify_animal and record_birth Flows share this flow_id
        (mirrors RecordDeathFlow) — dispatch on payload shape.
        """
        if "survived" in data:
            return self._handle_calving_submission(data=data, user=user, session=session)
        return self._handle_identify_flow_submission(data=data, user=user, session=session)

    def _handle_identify_flow_submission(self, *, data: dict, user: WhatsAppUser, session: Session) -> str:
        if not user.linked_user_id:
            return "Sorry, something went wrong. Please send 'menu' and try again."

        show_list = bool(data.get("show_list"))
        name_or_tag = (data.get("name_or_tag") or "").strip()

        if show_list or not name_or_tag:
            sent = self.send_dam_list(phone=user.phone, user=user, session=session)
            return "" if sent else (
                "Sorry, something went wrong sending your cow list. Please send 'menu' and try again."
            )

        from app.services.animal_lookup import LookupStatus, resolve_animal

        lookup = resolve_animal(
            session=session, user_id=user.linked_user_id, query=name_or_tag, gender="female"
        )

        if lookup.status == LookupStatus.MULTIPLE_MATCHES:
            names = ", ".join(a.name or a.tag_number or "unnamed" for a in lookup.candidates)
            return (
                f"I found a few cows matching '{name_or_tag}': {names}. "
                "Please reply with the exact name or tag number."
            )

        if lookup.animal is None:
            sent = self.send_dam_list(phone=user.phone, user=user, session=session)
            if sent:
                return f"I couldn't find a registered cow matching '{name_or_tag}' — here's your full list instead."
            return f"Sorry, I couldn't find a registered cow matching '{name_or_tag}'. Please try again."

        sent = self.pin_and_ask_calving_details(
            livestock_id=lookup.animal.id, phone=user.phone, user=user, session=session
        )
        return "" if sent else "Sorry, something went wrong. Please send 'menu' and try again."

    def handle_dam_selection(
        self, *, animal_id: str, phone: str, user: WhatsAppUser, session: Session
    ) -> bool:
        """Process the farmer tapping a cow in the list sent by start() / show_more()."""
        try:
            parsed_id = uuid.UUID(animal_id)
        except ValueError:
            return False
        return self.pin_and_ask_calving_details(
            livestock_id=parsed_id, phone=phone, user=user, session=session
        )

    def pin_and_ask_calving_details(
        self, *, livestock_id: uuid.UUID, phone: str, user: WhatsAppUser, session: Session
    ) -> bool:
        from app.core.config import settings
        from app.crud import get_livestock_by_id_for_user

        dam = (
            get_livestock_by_id_for_user(
                session=session, user_id=user.linked_user_id, livestock_id=livestock_id
            )
            if user.linked_user_id
            else None
        )
        if dam is None or dam.gender != "female":
            return False

        user.active_birth_dam_id = dam.id
        session.add(user)
        session.commit()

        if not settings.FLOW_ID_RECORD_BIRTH:
            logger.warning("[RecordBirthFlow] FLOW_ID_RECORD_BIRTH not configured — cannot send calving form.")
            return False

        dam_name = dam.name or dam.tag_number or "the mother cow"
        response = send_flow_message(
            phone=phone,
            flow_id=settings.FLOW_ID_RECORD_BIRTH,
            flow_token=self.flow_id,
            body=f"Great news about {dam_name}! 🐄🎉\n\nLet's capture a few details about the birth.",
            cta="Continue",
            screen="RECORD_BIRTH",
        )
        return response.status_code == 200

    def _handle_calving_submission(self, *, data: dict, user: WhatsAppUser, session: Session) -> str:
        if user.active_birth_dam_id is None or not user.linked_user_id:
            return "Sorry, something went wrong. Please send 'menu' and try again."

        from app.crud import get_livestock_by_id_for_user

        dam = get_livestock_by_id_for_user(
            session=session, user_id=user.linked_user_id, livestock_id=user.active_birth_dam_id
        )
        if dam is None:
            user.active_birth_dam_id = None
            session.add(user)
            session.commit()
            return "Sorry, something went wrong finding that cow. Please send 'menu' and try again."

        survived = data.get("survived") == "yes"
        calf_gender = data.get("calf_sex") or "unknown"
        colostrum = data.get("colostrum")
        mastitis = data.get("mastitis")

        today = datetime.now(timezone.utc).date()
        raw_date = (data.get("date_of_birth") or "").strip()
        try:
            dob = datetime.strptime(raw_date, "%Y-%m-%d").date()
        except ValueError:
            dob = today
        if dob > today:
            dob = today

        from app.crud import create_livestock_from_whatsapp

        calf = create_livestock_from_whatsapp(
            session=session,
            user_id=user.linked_user_id,
            district=user.district or "",
            species=dam.species,
            gender=calf_gender,
            date_of_birth=dob,
        )

        if not survived:
            calf.lifecycle_status = "deceased"
            calf.health_status = "deceased"
            calf.date_of_death = dob
            calf.cause_of_death = "Stillbirth"
            session.add(calf)

        from app.models.livestock_parentage import LivestockParentage

        session.add(LivestockParentage(child_id=calf.id, mother_id=dam.id))

        user.active_birth_dam_id = None
        session.add(user)
        session.commit()

        return self._build_confirmation(
            dam=dam, calf=calf, survived=survived, calf_gender=calf_gender,
            colostrum=colostrum, mastitis=mastitis,
        )

    @staticmethod
    def _build_confirmation(
        *,
        dam: Livestock,
        calf: Livestock,
        survived: bool,
        calf_gender: str,
        colostrum: str | None,
        mastitis: str | None,
    ) -> str:
        dam_name = dam.name or dam.tag_number or "the mother"

        if survived:
            summary = (
                f"✅ Birth recorded! 🎉\n\n"
                f"- Calf Tag: {calf.tag_number}\n"
                f"- Mother: {dam_name}\n"
                f"- Sex: {_SEX_LABELS.get(calf_gender, calf_gender)}"
            )
        else:
            summary = (
                f"We're so sorry — this has been recorded. 💙\n\n"
                f"- Calf Tag: {calf.tag_number}\n"
                f"- Mother: {dam_name}"
            )

        warnings = []
        if survived and colostrum == "no":
            warnings.append(
                "⚠️ *CRITICAL CALF ALERT*: Colostrum was missed in the first hour. "
                "The calf lacks maternal antibodies and is at high risk of fatal infection. "
                "Try feeding colostrum or warm milk immediately and contact a vet."
            )
        if mastitis == "yes":
            warnings.append(
                "⚠️ *DAM HEALTH ALERT*: Mastitis suspected. Clean the udder with warm water, "
                "strip milk manually, and contact a vet to prevent starvation of the calf."
            )

        if warnings:
            summary += "\n\n" + "\n\n".join(warnings)

        return summary
