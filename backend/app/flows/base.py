from abc import ABC, abstractmethod
from typing import Any

from sqlmodel import Session

from app.models.conversation_state import ConversationState, ConversationStatus
from app.models.whatsapp import WhatsAppUser


class BaseFlow(ABC):
    """
    Base class for all WhatsApp Flow form handlers.

    A Flow is triggered when a farmer taps a menu item that launches
    a WhatsApp interactive form. The farmer fills the form and submits —
    the pipeline receives an nfm_reply and routes it here via flow_token.

    Subclasses implement:
      - flow_id   : matches the flow_token sent with the form
      - start()   : sends the interactive form to the farmer
      - handle()  : processes the submitted form data, returns a reply string
      - describe(): (optional) one line for the farmer agent about an active state row

    Flows that track the farmer's progress call start_tracking() when they start
    and record_step() at each later step.
    """

    flow_id: str

    @abstractmethod
    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        """Send the WhatsApp Flow form (or interactive list) to the farmer.
        Returns True if it was sent successfully, False otherwise.
        The pipeline falls back to the farmer agent when False is returned.
        """
        ...

    @abstractmethod
    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        """
        Process submitted form data.
        data — the parsed nfm_reply response_json dict (flow_token already stripped).
        Returns the reply text to send back to the farmer.
        """
        ...

    def describe(self, state: ConversationState) -> str:
        """One line for the farmer agent's prompt saying where the farmer is in this flow.

        Flows that keep a conversation_state row override this with something clearer.
        """
        return f"In the {self.flow_id} flow, at step '{state.step}'."

    def active_state(self, *, session: Session, user: WhatsAppUser) -> ConversationState | None:
        """The farmer's active attempt at this flow, or None if they aren't in it."""
        from app.assistant.state import get_active_state

        state = get_active_state(session=session, user=user)
        if state is None or state.flow != self.flow_id:
            return None
        return state

    def start_tracking(self, *, session: Session, user: WhatsAppUser, step: str) -> None:
        """Begin a new attempt at this flow in conversation_state, replacing any active one."""
        from app.assistant.state import start_state

        start_state(session=session, user=user, flow=self.flow_id, step=step)

    def record_step(
        self,
        *,
        session: Session,
        user: WhatsAppUser,
        step: str,
        data: dict[str, Any] | None = None,
        close_as: ConversationStatus | None = None,
    ) -> None:
        """Store the farmer's progress in this flow: the new step, plus data added to state.data.

        close_as ends the attempt ("completed" or "failed"). If this flow isn't the active
        one (e.g. a tap on an older message), a new attempt is started first.
        """
        from app.assistant.state import (
            close_state,
            get_active_state,
            start_state,
            update_state,
        )

        state = get_active_state(session=session, user=user)
        if state is None or state.flow != self.flow_id:
            state = start_state(session=session, user=user, flow=self.flow_id, step=step)

        update_state(session=session, state=state, step=step, data={**state.data, **(data or {})})
        if close_as is not None:
            close_state(session=session, state=state, status=close_as)
