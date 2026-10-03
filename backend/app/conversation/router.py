"""Decides which part of V-Vet handles an incoming WhatsApp message.

For now there are two paths:
- farmers who haven't finished onboarding go to the guest stage (app.conversation.guest)
- onboarded farmers stay in the existing WhatsApp pipeline
"""

import logging

from sqlmodel import Session

from app.conversation.guest import handle_guest_message
from app.conversation.messages import IncomingMessage
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import mark_whatsapp_message_as_read

logger = logging.getLogger(__name__)


def route_message(
    *, session: Session, user: WhatsAppUser | None, message: IncomingMessage
) -> bool:
    """Handle the message if it belongs to a new path.

    Returns False when the existing pipeline should handle it instead.
    """
    is_guest = user is None or not user.is_fully_onboarded
    if not is_guest:
        return False

    # Marks the message read and shows the typing indicator while the reply is written.
    _mark_read(message.message_id)
    handle_guest_message(session=session, user=user, message=message)
    return True


def _mark_read(message_id: str) -> None:
    response = mark_whatsapp_message_as_read(message_id)
    if response.status_code != 200:
        logger.warning(
            "[Router] Failed to mark as read %s: %s", response.status_code, response.text
        )
