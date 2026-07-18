from abc import ABC, abstractmethod

from sqlmodel import Session

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
    """

    flow_id: str

    @abstractmethod
    def start(self, phone: str) -> bool:
        """Send the WhatsApp Flow form to the farmer.
        Returns True if the form was sent successfully, False otherwise.
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
