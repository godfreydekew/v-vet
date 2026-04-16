from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlmodel import Session

from app.api.deps import SessionDep
from app.core.config import settings
from app.crud import (
    create_whatsapp_user,
    get_conversation_history,
    get_whatsapp_user_by_phone,
    save_whatsapp_message,
)
from app.models.whatsapp import WhatsAppMessageCreate, WhatsAppUser, WhatsAppUserCreate
from app.services.whatsapp import (
    generate_ai_response,
    get_welcome_message,
    handle_onboarding,
    send_whatsapp_message,
)

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
def receive_webhook(payload: dict, session: SessionDep) -> dict:
    """
    Main entry point for all incoming WhatsApp messages.

    Pipeline:
      1. Extract phone + message body from Meta payload.
      2. Look up (or create) the WhatsAppUser row.
      3. Persist the incoming message.
      4. Route to onboarding OR AI response based on profile completeness.
      5. Persist the bot reply and send it back via Meta API.
    """
    try:
        entry = payload["entry"][0]["changes"][0]["value"]
        message_obj = entry["messages"][0]
        phone: str = message_obj["from"]
        message_body: str = message_obj["text"]["body"]
    except (KeyError, IndexError):
        return {"status": "ok"}

    user = get_whatsapp_user_by_phone(session=session, phone=phone)

    if user is None:
        user = create_whatsapp_user(
            session=session,
            user_in=WhatsAppUserCreate(phone=phone),
        )
        # Persist the triggering message before sending welcome.
        save_whatsapp_message(
            session=session,
            user=user,
            msg_in=WhatsAppMessageCreate(phone=phone, role="farmer", content=message_body),
        )
        reply = get_welcome_message()
        _send_and_persist(session=session, user=user, phone=phone, reply=reply)
        return {"status": "ok"}

    # --- 3. Persist incoming message ---
    save_whatsapp_message(
        session=session,
        user=user,
        msg_in=WhatsAppMessageCreate(phone=phone, role="farmer", content=message_body),
    )

    # --- 4. Route: onboarding or AI conversation ---
    if not user.is_fully_onboarded:
        # First message after registration goes straight into onboarding answers.
        # handle_onboarding detects the current step from null fields and saves the answer.
        reply = handle_onboarding(user=user, message_body=message_body, session=session)
    else:
        history = get_conversation_history(session=session, phone=phone, limit=20)
        reply = generate_ai_response(message=message_body, history=history, user=user)

    # --- 5. Send and persist the bot reply ---
    _send_and_persist(session=session, user=user, phone=phone, reply=reply)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------


def _send_and_persist(*, session: Session, user: WhatsAppUser, phone: str, reply: str) -> None:
    """Persist the bot reply and dispatch it via Meta API."""
    save_whatsapp_message(
        session=session,
        user=user,
        msg_in=WhatsAppMessageCreate(phone=phone, role="assistant", content=reply),
    )
    response = send_whatsapp_message(phone=phone, text=reply)
    if response.status_code != 200:
        # Log but do not raise — Meta webhook must always get a 200 back.
        print(f"[WhatsApp] Send failed {response.status_code}: {response.text}")


# ---------------------------------------------------------------------------
# Manual send (admin / testing)
# ---------------------------------------------------------------------------


@router.post("/send_message", status_code=200)
def send_message(phone_number: str, message: str) -> dict:
    response = send_whatsapp_message(phone=phone_number, text=message)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"status": "sent"}
