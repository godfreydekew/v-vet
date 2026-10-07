from abc import ABC, abstractmethod

from sqlmodel import Session

from app.models.conversation_state import ConversationState
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
