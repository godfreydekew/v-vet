
import logging

from sqlmodel import Session

from app.assistant.farmer.agent import handle_farmer_message
from app.assistant.guest.agent import handle_guest_message
from app.models.whatsapp import IncomingMessage, WhatsAppUser
from app.services.whatsapp.client import mark_whatsapp_message_as_read

logger = logging.getLogger(__name__)


def route_message(
    *, session: Session, user: WhatsAppUser | None, message: IncomingMessage
) -> bool:
    """Handle the message if it belongs to a new path.

    Returns False when the existing pipeline should handle it instead.
    """
    if user is None or not user.is_fully_onboarded:
        # Marks the message read and shows the typing indicator while the reply is written.
        _mark_read(message.message_id)
        handle_guest_message(session=session, user=user, message=message)
        return True

    is_typed_or_spoken = message.text is not None and message.button_id is None
    if is_typed_or_spoken:
        _mark_read(message.message_id)
        handle_farmer_message(session=session, user=user, message=message)
        return True

    return False


def _mark_read(message_id: str) -> None:
    response = mark_whatsapp_message_as_read(message_id)
    if response.status_code != 200:
        logger.warning(
            "[Router] Failed to mark as read %s: %s", response.status_code, response.text
        )
