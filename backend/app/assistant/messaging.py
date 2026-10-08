import logging

from sqlmodel import Session

from app.crud import save_whatsapp_message
from app.models.whatsapp import WhatsAppMessageCreate, WhatsAppMessageRole, WhatsAppUser
from app.services.whatsapp.client import send_reply_buttons, send_whatsapp_message

logger = logging.getLogger(__name__)

# WhatsApp rejects button message bodies longer than this.
_BUTTON_MESSAGE_BODY_LIMIT = 1024


def save_message(
    *, session: Session, user: WhatsAppUser, role: WhatsAppMessageRole, content: str
) -> None:
    save_whatsapp_message(
        session=session,
        user=user,
        msg_in=WhatsAppMessageCreate(phone=user.phone, role=role, content=content),
    )


def send_text(*, session: Session, user: WhatsAppUser, text: str) -> None:
    """Save and send a plain text reply."""
    save_message(session=session, user=user, role="assistant", content=text)
    response = send_whatsapp_message(phone=user.phone, text=text)
    if response.status_code != 200:
        logger.warning("[Messaging] Send failed %s: %s", response.status_code, response.text)


def send_buttons(
    *, session: Session, user: WhatsAppUser, text: str, buttons: list[dict[str, str]]
) -> None:
    """Save and send a message with up to 3 reply buttons, each {"id": ..., "title": ...}.

    Falls back to plain text if WhatsApp rejects the button message.
    """
    body = text[:_BUTTON_MESSAGE_BODY_LIMIT]
    save_message(session=session, user=user, role="assistant", content=body)
    response = send_reply_buttons(phone=user.phone, body=body, buttons=buttons)
    if response.status_code == 200:
        return

    logger.warning(
        "[Messaging] Button message failed %s: %s, sending plain text",
        response.status_code,
        response.text,
    )
    fallback = send_whatsapp_message(phone=user.phone, text=body)
    if fallback.status_code != 200:
        logger.warning("[Messaging] Send failed %s: %s", fallback.status_code, fallback.text)
