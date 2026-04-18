import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlmodel import Session

from app.core.config import settings
from app.core.db import engine
from app.crud import (
    create_whatsapp_user,
    get_conversation_history,
    get_whatsapp_user_by_phone,
    save_whatsapp_message,
)
from app.models.whatsapp import WhatsAppMessageCreate, WhatsAppUser, WhatsAppUserCreate
from app.services.whatsapp import (
    detect_language_change,
    extract_message_body,
    generate_ai_response,
    get_welcome_message,
    handle_language_change,
    handle_onboarding,
    send_whatsapp_message,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["whatsapp"], prefix="/whatsapp")


# ---------------------------------------------------------------------------
# Webhook verification (Meta handshake)
# ---------------------------------------------------------------------------


@router.get("/webhook", status_code=200, response_class=PlainTextResponse)
def verify_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
) -> str:
    if hub_mode == "subscribe" and hub_verify_token == settings.VERIFY_TOKEN:
        return hub_challenge
    raise HTTPException(status_code=400, detail="Webhook verification failed")


# ---------------------------------------------------------------------------
# Incoming message handler
# ---------------------------------------------------------------------------


@router.post("/webhook", status_code=200)
def receive_webhook(payload: dict, background_tasks: BackgroundTasks) -> dict:
    """
    Acknowledge Meta immediately, then process the message in the background.

    Meta retries if it doesn't get a 200 within ~5 s — doing audio download,
    transcription, and AI generation inline causes those retries and results
    in the same message being processed multiple times.
    """
    try:
        entry = payload["entry"][0]["changes"][0]["value"]
        message_obj = entry["messages"][0]
        phone: str = message_obj["from"]
    except (KeyError, IndexError):
        # Status updates, reactions, etc. — nothing to process.
        return {"status": "ok"}

    background_tasks.add_task(_process_message, phone, message_obj)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Background processor
# ---------------------------------------------------------------------------


def _process_message(phone: str, message_obj: dict) -> None:
    """
    Full message pipeline running after the webhook has already returned 200.

    Opens its own DB session — the request session is closed by the time
    this runs.
    """
    message_body = extract_message_body(message_obj)
    if message_body is None:
        return

    with Session(engine) as session:
        user = get_whatsapp_user_by_phone(session=session, phone=phone)

        if user is None:
            user = create_whatsapp_user(
                session=session,
                user_in=WhatsAppUserCreate(phone=phone),
            )
            save_whatsapp_message(
                session=session,
                user=user,
                msg_in=WhatsAppMessageCreate(phone=phone, role="farmer", content=message_body),
            )
            reply = get_welcome_message()
            _send_and_persist(session=session, user=user, phone=phone, reply=reply)
            return

        save_whatsapp_message(
            session=session,
            user=user,
            msg_in=WhatsAppMessageCreate(phone=phone, role="farmer", content=message_body),
        )

        new_language = detect_language_change(message_body)
        if new_language:
            reply = handle_language_change(user=user, language=new_language, session=session)
            _send_and_persist(session=session, user=user, phone=phone, reply=reply)
            return

        if not user.is_fully_onboarded:
            reply = handle_onboarding(user=user, message_body=message_body, session=session)
        else:
            history = get_conversation_history(session=session, phone=phone, limit=20)
            reply = generate_ai_response(message=message_body, history=history, user=user)

        _send_and_persist(session=session, user=user, phone=phone, reply=reply)


def _send_and_persist(*, session: Session, user: WhatsAppUser, phone: str, reply: str) -> None:
    save_whatsapp_message(
        session=session,
        user=user,
        msg_in=WhatsAppMessageCreate(phone=phone, role="assistant", content=reply),
    )
    response = send_whatsapp_message(phone=phone, text=reply)
    if response.status_code != 200:
        logger.warning("[WhatsApp] Send failed %s: %s", response.status_code, response.text)


# ---------------------------------------------------------------------------
# Manual send (admin / testing)
# ---------------------------------------------------------------------------


@router.post("/send_message", status_code=200)
def send_message(phone_number: str, message: str) -> dict:
    response = send_whatsapp_message(phone=phone_number, text=message)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"status": "sent"}
