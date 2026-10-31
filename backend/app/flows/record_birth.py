import logging
import uuid
from datetime import date as date_cls

from sqlmodel import Session

from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.conversation_state import ConversationState
from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_flow_message, send_whatsapp_message

logger = logging.getLogger(__name__)

_SEX_LABELS = {"female": "Female", "male": "Male", "unknown": "Unknown"}

# Steps stored in conversation_state.
STEP_PICK_MOTHER = "pick_mother"
STEP_CALVING_DETAILS = "calving_details"
STEP_CALF_DETAILS = "calf_details"
STEP_DONE = "done"


class RecordBirthFlow(BaseFlow):
    """
    Records a calving event in two steps:
    1. record_birth Flow — survival, colostrum intake, dam mastitis signs.
       Dam-focused, time-sensitive facts.
    2. register_animal Flow, reused as-is (same published Flow ID, launched
       with this flow's own flow_token so the submission routes here instead
       of to RegisterAnimalFlow) — the calf's own details: name,
       breed, gender, weight. A calf is just a new animal, linked to a dam.

    Each step is also recorded in conversation_state
    (pick_mother → calving_details → calf_details → done) so the farmer agent
    knows where the farmer is.
    """

    flow_id = "record_birth"

    def start(self, phone: str, user: WhatsAppUser, session: Session, message: str | None = None) -> bool:
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
            # Nothing to record a birth against, so no birth is in progress.
            return self._send_no_mother_cows_message(phone=phone)

        # The list shows 9 cows at a time, with a "Show more animals" row for the rest.
        sent = self.send_dam_list(phone=phone, user=user, session=session, message=message)
        if sent:
            self.start_tracking(session=session, user=user, step=STEP_PICK_MOTHER)
        return sent

    def _send_no_mother_cows_message(self, *, phone: str) -> bool:
        response = send_whatsapp_message(
            phone=phone,
            text=(
                "You don't have any female cattle registered yet, so there's no mother cow to "
                "record a birth against. 🐄\n\n"
                "Please register the mother cow first (menu → Register Animal, and set her gender "
                "to female), then try Record Birth again."
            ),
        )
        return response.status_code == 200

    def send_dam_list(self, *, phone: str, user: WhatsAppUser, session: Session, message: str | None = None) -> bool:
        return send_interactive_animal_list(
            phone=phone, user=user, session=session, intent="birth", message=message
        )

    def show_more(self, *, offset: int, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(
            phone=phone, user=user, session=session, intent="birth", offset=offset
        )

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        """
        Two Flows share this flow_id (record_birth, and register_animal reused
        for calf details).

        The birth-details form always sends "survived". The calf form is recognised
        by where the farmer is, not by its fields: WhatsApp leaves out optional fields
        the farmer didn't fill in, so the calf form may arrive with any field missing.
        """
        if "survived" in data:
            return self._handle_calving_submission(data=data, user=user, session=session)
        state = self.active_state(session=session, user=user)
        if state is not None and state.step == STEP_CALF_DETAILS:
            return self._handle_calf_registration_submission(data=data, state=state, user=user, session=session)
        return "Sorry, something went wrong. Please send 'menu' and try again."

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
        if response.status_code != 200:
            return False

        self.record_step(
            session=session,
            user=user,
            step=STEP_CALVING_DETAILS,
            data={"mother_id": str(dam.id), "mother_name": dam_name},
        )
        return True

    def _handle_calving_submission(self, *, data: dict, user: WhatsAppUser, session: Session) -> str:
        """Step 1 submitted — save the answers in the farmer's state and send the calf's registration form."""
        state = self.active_state(session=session, user=user)
        if state is None or not state.data.get("mother_id"):
            return "Sorry, something went wrong. Please send 'menu' and try again."

        from app.core.config import settings

        survived = data.get("survived") == "yes"
        self.record_step(
            session=session,
            user=user,
            step=STEP_CALF_DETAILS,
            data={
                "survived": survived,
                "colostrum": data.get("colostrum"),
                "mastitis": data.get("mastitis"),
            },
        )

        if not settings.FLOW_ID_REGISTER_ANIMAL:
            logger.warning(
                "[RecordBirthFlow] FLOW_ID_REGISTER_ANIMAL not configured — cannot send calf details form."
            )
            return "Sorry, something went wrong. Please send 'menu' and try again."

        if survived:
            transition_body = "Almost done! Now let's register the calf. 🐄"
        else:
            transition_body = (
                "We're recording this so you have accurate records of what's been lost — "
                "this matters for tracking your herd's statistics. Let's log a few details about the calf."
            )

        response = send_flow_message(
            phone=user.phone,
            flow_id=settings.FLOW_ID_REGISTER_ANIMAL,
            flow_token=self.flow_id,
            body=transition_body,
            cta="Register Calf",
            screen="REGISTER_ANIMAL",
        )
        return "" if response.status_code == 200 else (
            "Sorry, something went wrong sending the calf details form. Please send 'menu' and try again."
        )

    def _handle_calf_registration_submission(
        self, *, data: dict, state: ConversationState, user: WhatsAppUser, session: Session
    ) -> str:
        """Step 2 (reused register_animal form) submitted — create the calf and link it to the dam."""
        if not user.linked_user_id or not state.data.get("mother_id"):
            return "Sorry, something went wrong. Please send 'menu' and try again."

        from app.crud import get_livestock_by_id_for_user

        dam = get_livestock_by_id_for_user(
            session=session, user_id=user.linked_user_id, livestock_id=uuid.UUID(state.data["mother_id"])
        )
        if dam is None:
            self.record_step(session=session, user=user, step=STEP_CALF_DETAILS, close_as="failed")
            return "Sorry, something went wrong finding that cow. Please send 'menu' and try again."

        survived = bool(state.data.get("survived"))
        colostrum = state.data.get("colostrum")
        mastitis = state.data.get("mastitis")
        dob = self._parse_date_of_birth(data.get("date_of_birth"), phone=user.phone)

        calf_name = (data.get("name") or "").strip() or None
        calf_gender = data.get("gender") or "unknown"
        calf_breed = (data.get("breed") or "").strip() or None
        weight_raw = data.get("weight_kg")
        try:
            weight_kg = float(weight_raw) if weight_raw not in (None, "") else None
        except (TypeError, ValueError):
            weight_kg = None

        from app.crud import create_livestock_from_whatsapp

        calf = create_livestock_from_whatsapp(
            session=session,
            user_id=user.linked_user_id,
            district=user.district or "",
            name=calf_name,
            gender=calf_gender,
            breed=calf_breed,
            weight_kg=weight_kg,
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
        session.commit()

        self.record_step(
            session=session,
            user=user,
            step=STEP_DONE,
            data={"calf_id": str(calf.id)},
            close_as="completed",
        )

        return self._build_confirmation(
            dam=dam, calf=calf, survived=survived, calf_gender=calf_gender,
            colostrum=colostrum, mastitis=mastitis,
        )

    def describe(self, state: ConversationState) -> str:
        mother_name = state.data.get("mother_name", "the mother cow")
        if state.step == STEP_CALVING_DETAILS:
            return (
                f"Recording a birth for {mother_name}: V-Vet sent the birth details form "
                "(did the calf survive, colostrum, mastitis) and the farmer hasn't submitted it yet."
            )
        if state.step == STEP_CALF_DETAILS:
            return (
                f"Recording a birth for {mother_name}: the birth details are saved; waiting for "
                "the farmer to submit the calf's registration form."
            )
        return (
            "Recording a birth: V-Vet sent the farmer a way to choose the mother cow, "
            "and they haven't chosen yet."
        )

    @staticmethod
    def _parse_date_of_birth(raw_date: str | None, *, phone: str) -> date_cls | None:
        """Parse the calf form's date (YYYY-MM-DD). Missing or invalid dates are logged and left empty."""
        raw_date = (raw_date or "").strip()
        if not raw_date:
            logger.error("[RecordBirthFlow] No calf date of birth submitted for %s", phone)
            return None
        try:
            return date_cls.fromisoformat(raw_date)
        except ValueError:
            logger.error(
                "[RecordBirthFlow] Invalid calf date of birth %r submitted for %s", raw_date, phone
            )
            return None

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
                "✅ Birth recorded! 🎉\n\n"
                + (f"- Name: {calf.name}\n" if calf.name else "")
                + f"- Calf Tag: {calf.tag_number}\n"
                f"- Mother: {dam_name}\n"
                f"- Sex: {_SEX_LABELS.get(calf_gender, calf_gender)}"
            )
        else:
            summary = (
                "💙 We're so sorry — the calf passed away. This has been recorded for your records.\n\n"
                + (f"- Name: {calf.name}\n" if calf.name else "")
                + f"- Calf Tag: {calf.tag_number}\n"
                f"- Mother: {dam_name}"
            )

        calf_name = calf.name or calf.tag_number or "the calf"

        warnings = []
        if survived and colostrum == "no":
            warnings.append(
                f"⚠️ *CRITICAL CALF ALERT*: Colostrum was missed for {calf_name} in the first hour. "
                "The calf lacks maternal antibodies and is at high risk of fatal infection. "
                "Try feeding colostrum or warm milk immediately and contact a vet."
            )
        if mastitis == "yes":
            warnings.append(
                f"⚠️ *DAM HEALTH ALERT*: Mastitis suspected in {dam_name}. Clean the udder with warm water, "
                "strip milk manually, and contact a vet to prevent starvation of the calf."
            )

        if warnings:
            summary += "\n\n" + "\n\n".join(warnings)

        return summary
