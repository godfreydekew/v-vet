import logging
import string

from sqlmodel import Session

from app.assistant.guest.reply import answer_guest
from app.assistant.guest.schemas import GuestReply
from app.assistant.messages import IncomingMessage
from app.assistant.schemas import ChatMessage
from app.crud import (
    create_whatsapp_user,
    get_conversation_history,
    save_whatsapp_message,
)
from app.models.whatsapp import (
    WhatsAppMessageCreate,
    WhatsAppMessageRole,
    WhatsAppUser,
    WhatsAppUserCreate,
)
from app.services.whatsapp.client import send_reply_buttons, send_whatsapp_message

logger = logging.getLogger(__name__)

GET_STARTED_BUTTON_ID = "guest_get_started"
_GET_STARTED_BUTTON = {"id": GET_STARTED_BUTTON_ID, "title": "Get started"}

_YES_WORDS = {"yes", "yeah", "yep", "sure", "ok", "okay", "y", "ehe", "hongu", "yebo", "👍"}

_HISTORY_LIMIT = 10

_BUTTON_MESSAGE_BODY_LIMIT = 1024

WELCOME_MESSAGE = (
    "👋 Welcome to V-Vet!\n\n"
    "I help farmers like you keep animals healthy and productive.\n\n"
    "💬 You can send me:\n"
    "- Text, audio, or photos of your animals\n"
    "- Questions about your livestock\n"
    "- Reports when animals are born, sick, or treated\n\n"
    "I'll also help you get connected with a vet when needed.\n\n"
    "Ready to start? Tap *Get started* below to set up your farm (takes seconds)."
)

UNSUPPORTED_MESSAGE = (
    "Sorry, I couldn't read that message. I can read text messages and voice notes.\n\n"
    "Tap *Get started* below to set up your farm."
)

FORM_FAILED_MESSAGE = (
    "Sorry, I couldn't open the setup form just now. Please tap *Get started* again in a minute."
)

# Fixed wording for a sick or injured animal, so the model never improvises
# health advice. Languages without an entry use the model's reply instead.
URGENT_MESSAGES = {
    "english": (
        "I'm sorry your animal is unwell. To help, I first need to set up your farm and add your livestock information into V-Vet. "
        "Tap *Get started* below, it only takes a moment.\n\n"
        "If the animal cannot stand or is struggling to breathe, contact your local vet officer now."
    ),
}


def handle_guest_message(
    *, session: Session, user: WhatsAppUser | None, message: IncomingMessage
) -> None:
    """Reply to a farmer who hasn't finished onboarding. user is None for a brand-new number."""
    is_first_message = user is None
    if user is None:
        user = create_whatsapp_user(
            session=session, user_in=WhatsAppUserCreate(phone=message.phone)
        )

    history = _load_history(session=session, phone=message.phone)
    _save_message(
        session=session,
        user=user,
        role="farmer",
        content=message.text or message.button_id or f"[{message.message_type}]",
    )

    if _wants_to_start(message):
        _start_onboarding(session=session, user=user)
        return

    if message.text is None:
        reply = WELCOME_MESSAGE if is_first_message else UNSUPPORTED_MESSAGE
        _send_with_button(session=session, user=user, text=reply)
        return

    guest_reply = _ask_model(
        phone=message.phone, text=message.text, history=history, is_first_message=is_first_message
    )
    if guest_reply is None:
        _send_with_button(session=session, user=user, text=WELCOME_MESSAGE)
        return

    if guest_reply.intent == "ready_to_register":
        _start_onboarding(session=session, user=user)
        return

    reply = _choose_reply(guest_reply=guest_reply, is_first_message=is_first_message)
    _send_with_button(session=session, user=user, text=reply)


def _wants_to_start(message: IncomingMessage) -> bool:
    if message.button_id == GET_STARTED_BUTTON_ID:
        return True
    if message.text is None:
        return False
    normalized = message.text.lower().strip(string.punctuation + string.whitespace)
    return normalized in _YES_WORDS


def _ask_model(
    *, phone: str, text: str, history: list[ChatMessage], is_first_message: bool
) -> GuestReply | None:
    # A guest must always get a reply, so any model failure falls back to the welcome message.
    try:
        guest_reply = answer_guest(
            message=text, history=history, is_first_message=is_first_message
        )
    except Exception:
        logger.exception("[Guest] Model call failed for %s", phone)
        return None

    logger.info(
        "[Guest] %s intent=%s language=%s", phone, guest_reply.intent, guest_reply.language
    )
    return guest_reply


def _choose_reply(*, guest_reply: GuestReply, is_first_message: bool) -> str:
    if guest_reply.intent == "urgent" and guest_reply.language in URGENT_MESSAGES:
        return URGENT_MESSAGES[guest_reply.language]
    # A first "hi" (or anything unclear) gets the full welcome message.
    if is_first_message and guest_reply.intent in ("greeting", "other"):
        return WELCOME_MESSAGE
    return guest_reply.reply


def _start_onboarding(*, session: Session, user: WhatsAppUser) -> None:
    from app.flows import FLOW_REGISTRY
    from app.flows.onboarding import OnboardingFlow

    flow = FLOW_REGISTRY.get(OnboardingFlow.flow_id)
    if isinstance(flow, OnboardingFlow) and flow.start(user.phone, user, session):
        _save_message(session=session, user=user, role="assistant", content="[Onboarding form sent]")
        return
    _send_with_button(session=session, user=user, text=FORM_FAILED_MESSAGE)


def _send_with_button(*, session: Session, user: WhatsAppUser, text: str) -> None:
    body = text[:_BUTTON_MESSAGE_BODY_LIMIT]
    _save_message(session=session, user=user, role="assistant", content=body)

    response = send_reply_buttons(phone=user.phone, body=body, buttons=[_GET_STARTED_BUTTON])
    if response.status_code == 200:
        return

    # Still reply if the button message is rejected, just without the button.
    logger.warning(
        "[Guest] Button message failed %s: %s, sending plain text",
        response.status_code,
        response.text,
    )
    fallback = send_whatsapp_message(phone=user.phone, text=body)
    if fallback.status_code != 200:
        logger.warning("[Guest] Send failed %s: %s", fallback.status_code, fallback.text)


def _load_history(*, session: Session, phone: str) -> list[ChatMessage]:
    past_messages = get_conversation_history(session=session, phone=phone, limit=_HISTORY_LIMIT)
    history: list[ChatMessage] = []
    for past in past_messages:
        if past.role == "farmer":
            history.append({"role": "user", "content": past.content})
        else:
            history.append({"role": "assistant", "content": past.content})
    return history


def _save_message(
    *, session: Session, user: WhatsAppUser, role: WhatsAppMessageRole, content: str
) -> None:
    save_whatsapp_message(
        session=session,
        user=user,
        msg_in=WhatsAppMessageCreate(phone=user.phone, role=role, content=content),
    )
