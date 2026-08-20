import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import (
    send_flow_message,
    send_list_message,
    send_reply_buttons,
    send_whatsapp_message,
)

logger = logging.getLogger(__name__)

_CAUSE_PREFIX = "death_cause_"
_DATE_PREFIX = "death_date_"

_CAUSE_OPTIONS = [
    ("disease", "Disease / Illness"),
    ("injury", "Injury / Accident"),
    ("old_age", "Old Age"),
    ("unknown", "Unknown"),
]
_CAUSE_LABELS = dict(_CAUSE_OPTIONS)


class RecordDeathFlow(BaseFlow):
    """
    Records an animal's death: select the animal, its cause of death, then
    the date it happened. All three steps are deterministic WhatsApp
    buttons/lists — no LLM involvement once the animal is identified.

    Mirrors ReportSicknessFlow's herd-size branching and pin pattern.
    active_death_animal_id / active_death_cause on WhatsAppUser carry state
    between steps — a generic flow-state mechanism would be overkill for
    two values with no reminders or follow-ups attached to this flow.
    """

    flow_id = "record_death"

    SMALL_HERD_THRESHOLD = 10

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        from app.core.config import settings
        from app.crud import get_livestock_for_user
        from app.flows.animal_list import MAX_ANIMALS

        if not user.linked_user_id:
            return False

        animal_count = len(
            get_livestock_for_user(session=session, user_id=user.linked_user_id, limit=MAX_ANIMALS)
        )
        if animal_count == 0:
            return False

        if animal_count >= self.SMALL_HERD_THRESHOLD:
            if not settings.FLOW_ID_IDENTIFY_ANIMAL:
                logger.warning(
                    "[RecordDeathFlow] FLOW_ID_IDENTIFY_ANIMAL not configured — falling back to text prompt."
                )
                response = send_whatsapp_message(
                    phone=phone,
                    text=(
                        "We are so sorry for your loss. 💙\n\n"
                        "You have quite a few animals registered — which one passed away? "
                        "Please reply with its name or tag number."
                    ),
                )
                return response.status_code == 200

            response = send_flow_message(
                phone=phone,
                flow_id=settings.FLOW_ID_IDENTIFY_ANIMAL,
                flow_token=self.flow_id,
                body="We are so sorry for your loss. 💙\n\nLet's find out which animal it was.",
                cta="Continue",
                screen="IDENTIFY_ANIMAL",
            )
            return response.status_code == 200

        return self.send_animal_list(phone=phone, user=user, session=session)

    def send_animal_list(self, *, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(phone=phone, user=user, session=session, intent="death")

    def show_more(self, *, offset: int, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(
            phone=phone, user=user, session=session, intent="death", offset=offset
        )

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        """
        Processes the identify_animal Flow submission: {name_or_tag, show_list}.
        Deterministic — no LLM involved in identifying the animal, since the
        farmer chose directly on the form instead of us having to infer
        intent from free text.
        """
        if not user.linked_user_id:
            return "Sorry, something went wrong. Please send 'menu' and try again."

        show_list = bool(data.get("show_list"))
        name_or_tag = (data.get("name_or_tag") or "").strip()

        if show_list or not name_or_tag:
            sent = self.send_animal_list(phone=user.phone, user=user, session=session)
            return "" if sent else (
                "Sorry, something went wrong sending your animal list. Please send 'menu' and try again."
            )

        from app.services.animal_lookup import LookupStatus, resolve_animal

        lookup = resolve_animal(session=session, user_id=user.linked_user_id, query=name_or_tag)

        if lookup.status == LookupStatus.MULTIPLE_MATCHES:
            names = ", ".join(a.name or a.tag_number or "unnamed" for a in lookup.candidates)
            return (
                f"I found a few animals matching '{name_or_tag}': {names}. "
                "Please reply with the exact name or tag number."
            )

        if lookup.animal is None:
            sent = self.send_animal_list(phone=user.phone, user=user, session=session)
            if sent:
                return f"I couldn't find an animal matching '{name_or_tag}' — here's your full list instead."
            return f"Sorry, I couldn't find an animal matching '{name_or_tag}'. Please try again."

        sent = self.pin_and_ask_cause(
            livestock_id=lookup.animal.id, phone=user.phone, user=user, session=session
        )
        return "" if sent else "Sorry, something went wrong. Please send 'menu' and try again."

    def handle_animal_selection(
        self, *, animal_id: str, phone: str, user: WhatsAppUser, session: Session
    ) -> bool:
        """Process the farmer tapping an animal in the list sent by start() / show_more()."""
        try:
            parsed_id = uuid.UUID(animal_id)
        except ValueError:
            return False
        return self.pin_and_ask_cause(livestock_id=parsed_id, phone=phone, user=user, session=session)

    def pin_and_ask_cause(
        self, *, livestock_id: uuid.UUID, phone: str, user: WhatsAppUser, session: Session
    ) -> bool:
        """
        Pins the animal and sends the cause-of-death options. Shared by the
        list-tap path (handle_animal_selection) and the large-herd free-text
        lookup (the record_death agent tool), so both end up in the same
        next step..
        """
        from app.crud import get_livestock_by_id_for_user

        animal = (
            get_livestock_by_id_for_user(
                session=session, user_id=user.linked_user_id, livestock_id=livestock_id
            )
            if user.linked_user_id
            else None
        )
        if animal is None:
            return False

        user.active_death_animal_id = animal.id
        user.active_death_cause = None
        session.add(user)
        session.commit()

        animal_name = animal.name or animal.tag_number or "the animal"
        rows = [{"id": f"{_CAUSE_PREFIX}{key}", "title": label} for key, label in _CAUSE_OPTIONS]
        response = send_list_message(
            phone=phone,
            body=f"We are thinking of you. What was the primary cause of death for {animal_name}?",
            button_label="Select Cause",
            sections=[{"title": "Cause of Death", "rows": rows}],
        )
        return response.status_code == 200

    def handle_cause_selection(
        self, *, row_id: str, phone: str, user: WhatsAppUser, session: Session
    ) -> bool:
        if user.active_death_animal_id is None or not row_id.startswith(_CAUSE_PREFIX):
            # No animal pinned, or a stale tap from an earlier/abandoned flow — ignore.
            return False
        cause = row_id.removeprefix(_CAUSE_PREFIX)
        if cause not in _CAUSE_LABELS:
            return False

        user.active_death_cause = cause
        session.add(user)
        session.commit()

        buttons = [
            {"id": f"{_DATE_PREFIX}today", "title": "Today"},
            {"id": f"{_DATE_PREFIX}yesterday", "title": "Yesterday"},
        ]
        response = send_reply_buttons(phone=phone, body="When did this happen?", buttons=buttons)
        return response.status_code == 200

    def handle_date_selection(
        self, *, row_id: str, user: WhatsAppUser, session: Session
    ) -> str | None:
        if user.active_death_animal_id is None or user.active_death_cause is None:
            return None
        if not row_id.startswith(_DATE_PREFIX):
            return None

        choice = row_id.removeprefix(_DATE_PREFIX)
        today = datetime.now(timezone.utc).date()
        if choice == "today":
            death_date = today
        elif choice == "yesterday":
            death_date = today - timedelta(days=1)
        else:
            return None

        from app.crud import get_livestock_by_id_for_user

        animal = (
            get_livestock_by_id_for_user(
                session=session, user_id=user.linked_user_id, livestock_id=user.active_death_animal_id
            )
            if user.linked_user_id
            else None
        )
        if animal is None:
            user.active_death_animal_id = None
            user.active_death_cause = None
            session.add(user)
            session.commit()
            return "Sorry, something went wrong finding that animal. Please send 'menu' and try again."

        animal.lifecycle_status = "deceased"
        animal.health_status = "deceased"
        animal.date_of_death = death_date
        animal.cause_of_death = user.active_death_cause
        session.add(animal)

        user.active_death_animal_id = None
        user.active_death_cause = None
        session.add(user)
        session.commit()

        animal_name = animal.name or animal.tag_number or "The animal"
        return (
            f"Recorded. {animal_name} has been marked as deceased in your herd records. "
            "We send our heartfelt thoughts. 💙"
        )
