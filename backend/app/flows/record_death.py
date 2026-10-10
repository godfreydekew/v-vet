import logging
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlmodel import Session

from app.core.config import settings
from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.conversation_state import ConversationState
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import (
    send_flow_message,
    send_list_message,
    send_reply_buttons,
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

# Steps stored in conversation_state.
STEP_PICK_ANIMAL = "pick_animal"
STEP_PICK_CAUSE = "pick_cause"
STEP_PICK_DATE = "pick_date"
STEP_DONE = "done"


class RecordDeathFlow(BaseFlow):
    """
    Records an animal's death: select the animal, its cause of death, then
    the date it happened.
    """

    flow_id = "record_death"

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        logger.info(f"[RecordDeathFlow] Starting record death for {user.phone}")
        # The list shows 9 animals at a time, with a "Show more animals" row for the rest.
        sent = self.send_animal_list(phone=phone, user=user, session=session)
        if sent:
            self.start_tracking(session=session, user=user, step=STEP_PICK_ANIMAL)
        return sent

    def send_animal_list(self, *, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(phone=phone, user=user, session=session, intent="death")

    def show_more(self, *, offset: int, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(
            phone=phone, user=user, session=session, intent="death", offset=offset
        )

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        """Processes the pick_date form submission: {selected_date}."""
        return self._handle_date_flow_submission(data=data, user=user, session=session)

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
        Stores the chosen animal in the farmer's state and sends the cause-of-death
        options.
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

        animal_name = animal.name or animal.tag_number or "the animal"
        # A newly chosen animal clears any cause picked for a previous one.
        self.record_step(
            session=session,
            user=user,
            step=STEP_PICK_CAUSE,
            data={"animal_id": str(animal.id), "animal_name": animal_name, "cause": None},
        )
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
        state = self.active_state(session=session, user=user)
        if state is None or not state.data.get("animal_id") or not row_id.startswith(_CAUSE_PREFIX):
            # No animal chosen yet, or a stale tap from an earlier/abandoned attempt — ignore.
            return False
        cause = row_id.removeprefix(_CAUSE_PREFIX)
        if cause not in _CAUSE_LABELS:
            return False

        self.record_step(session=session, user=user, step=STEP_PICK_DATE, data={"cause": cause})
        return self._ask_date(phone=phone)

    def _ask_date(self, *, phone: str) -> bool:
        if not settings.FLOW_ID_PICK_DATE:
            logger.warning(
                "[RecordDeathFlow] FLOW_ID_PICK_DATE not configured — falling back to Today/Yesterday buttons."
            )
            buttons = [
                {"id": f"{_DATE_PREFIX}today", "title": "Today"},
                {"id": f"{_DATE_PREFIX}yesterday", "title": "Yesterday"},
            ]
            response = send_reply_buttons(phone=phone, body="When did this happen?", buttons=buttons)
            return response.status_code == 200

        response = send_flow_message(
            phone=phone,
            flow_id=settings.FLOW_ID_PICK_DATE,
            flow_token=self.flow_id,
            body="When did this happen?",
            cta="Continue",
            screen="PICK_DATE",
        )
        return response.status_code == 200

    def handle_date_selection(
        self, *, row_id: str, user: WhatsAppUser, session: Session
    ) -> str | None:
        """Fallback path — only reached when FLOW_ID_PICK_DATE isn't configured
        and _ask_date() sent the Today/Yesterday buttons instead."""
        state = self._state_waiting_for_date(session=session, user=user)
        if state is None or not row_id.startswith(_DATE_PREFIX):
            return None

        choice = row_id.removeprefix(_DATE_PREFIX)
        today = datetime.now(timezone.utc).date()
        if choice == "today":
            death_date = today
        elif choice == "yesterday":
            death_date = today - timedelta(days=1)
        else:
            return None

        return self._finalize_death(death_date=death_date, state=state, user=user, session=session)

    def _handle_date_flow_submission(self, *, data: dict, user: WhatsAppUser, session: Session) -> str:
        state = self._state_waiting_for_date(session=session, user=user)
        if state is None:
            return "Sorry, something went wrong. Please send 'menu' and try again."

        raw_date = (data.get("selected_date") or "").strip()
        try:
            death_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
        except ValueError:
            return "Sorry, I couldn't understand that date. Please send 'menu' and try again."

        today = datetime.now(timezone.utc).date()
        if death_date > today:
            return "That date is in the future — please send 'menu' and try again with today or an earlier date."

        return self._finalize_death(death_date=death_date, state=state, user=user, session=session)

    def _state_waiting_for_date(self, *, session: Session, user: WhatsAppUser) -> ConversationState | None:
        """The farmer's death record, if both the animal and the cause are chosen."""
        state = self.active_state(session=session, user=user)
        if state is None or not state.data.get("animal_id") or not state.data.get("cause"):
            return None
        return state

    def _finalize_death(
        self, *, death_date: date, state: ConversationState, user: WhatsAppUser, session: Session
    ) -> str:
        from app.crud import get_livestock_by_id_for_user

        animal = (
            get_livestock_by_id_for_user(
                session=session,
                user_id=user.linked_user_id,
                livestock_id=uuid.UUID(state.data["animal_id"]),
            )
            if user.linked_user_id
            else None
        )
        if animal is None:
            self.record_step(session=session, user=user, step=STEP_PICK_DATE, close_as="failed")
            return "Sorry, something went wrong finding that animal. Please send 'menu' and try again."

        animal.lifecycle_status = "deceased"
        animal.health_status = "deceased"
        animal.date_of_death = death_date
        animal.cause_of_death = state.data["cause"]
        session.add(animal)
        session.commit()

        self.record_step(
            session=session,
            user=user,
            step=STEP_DONE,
            data={"date_of_death": death_date.isoformat()},
            close_as="completed",
        )

        animal_name = animal.name or animal.tag_number or "The animal"
        return (
            f"Recorded. {animal_name} has been marked as deceased in your herd records. "
            "We send our heartfelt thoughts. 💙"
        )

    def describe(self, state: ConversationState) -> str:
        animal_name = state.data.get("animal_name", "the animal")
        if state.step == STEP_PICK_CAUSE:
            return (
                f"Recording a death for {animal_name}: waiting for the farmer to choose "
                "the cause of death from the list V-Vet sent."
            )
        if state.step == STEP_PICK_DATE:
            cause = _CAUSE_LABELS.get(state.data.get("cause", ""), "unknown")
            return (
                f"Recording a death for {animal_name} (cause: {cause}): waiting for the farmer "
                "to pick the date it died."
            )
        return (
            "Recording a death: V-Vet sent the farmer a way to choose which animal died, "
            "and they haven't chosen yet."
        )
