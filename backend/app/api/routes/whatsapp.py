import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlmodel import Session

from app.core.config import settings
from app.core.db import engine
from app.services.whatsapp.client import send_whatsapp_message
from app.services.whatsapp.pipeline import WhatsAppConversationService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["whatsapp"], prefix="/whatsapp")

_conversation_service = WhatsAppConversationService()


@router.get("/webhook", status_code=200, response_class=PlainTextResponse)
def verify_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
) -> str:
    if hub_mode == "subscribe" and hub_verify_token == settings.VERIFY_TOKEN:
        return hub_challenge
    raise HTTPException(status_code=400, detail="Webhook verification failed")


@router.post("/webhook", status_code=200)
def receive_webhook(payload: dict, background_tasks: BackgroundTasks) -> dict:
    try:
        entry = payload["entry"][0]["changes"][0]["value"]
        message_obj = entry["messages"][0]
        phone: str = message_obj["from"]
    except (KeyError, IndexError):
        return {"status": "ok"}

    background_tasks.add_task(_process_message, phone, message_obj)
    return {"status": "ok"}


def _process_message(phone: str, message_obj: dict) -> None:
    with Session(engine) as session:
        _conversation_service.process_message(
            session=session,
            phone=phone,
            message_obj=message_obj,
        )


@router.post("/send_message", status_code=200)
def send_message(phone_number: str, message: str) -> dict:
    response = send_whatsapp_message(phone=phone_number, text=message)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"status": "sent"}
