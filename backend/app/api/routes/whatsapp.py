from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from app.core.config import settings
import requests

router = APIRouter(tags=["whatsapp"], prefix="/whatsapp")


@router.get("/webhook", status_code=200, response_class=PlainTextResponse)
def verify_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
) -> str:
    verify_token = settings.VERIFY_TOKEN    
    
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return hub_challenge
    
    raise HTTPException(status_code=400, detail="Webhook verification failed")

@router.post("/webhook", status_code=200)
def receive_webhook(payload: dict) -> None:
    print("Received WhatsApp webhook:", payload)
    

# Send message to user using WhatsApp API
@router.post("/send_message", status_code=200)
def send_message(phone_number: str, message: str) -> None:
    response = send_message_to_user(phone_number, message)

    if response.status_code != 200:
        # Preserve upstream WhatsApp error details instead of masking as 500.
        raise HTTPException(status_code=response.status_code, detail=response.text)
    
    
def send_message_to_user(phone_number: str, message: str) -> requests.Response:
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="WhatsApp configuration is missing")

    url = f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    data = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": message
        }
    }
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=data, headers=headers, timeout=15)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach WhatsApp API: {exc}") from exc

    print("WhatsApp API response:", response.status_code, response.text)
    return response