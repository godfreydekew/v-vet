from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from app.core.config import settings
from app.core.openai import client as openai_client
import requests

router = APIRouter(tags=["whatsapp"], prefix="/whatsapp")

SYSTEM_PROMPT = (
    "You are VVet Live, a helpful WhatsApp assistant for cattle farmers and veterinary support. "
    "Answer questions about cows, cattle, livestock health, feeding, breeding, behavior, injuries, symptoms, "
    "images, and day-to-day farm care. Keep replies practical, clear, and concise. "
    "If the user greets you, respond with a brief friendly greeting and ask what they need help with. "
    "If the question is unclear, ask a focused follow-up question. "
    "Do not invent facts. If something may need a veterinarian, say so plainly."
)


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
def receive_webhook(payload: dict) -> dict:
    user_message = payload.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [{}])[0].get("text", {}).get("body", "")
    if user_message:
        print("Received message from user:", user_message)
        try:
            ai_response = generate_response_with_ai(user_message)
            print("Generated AI response:", ai_response)
            # Here you would extract the sender's phone number from the payload to send the response back
            sender_phone_number = payload.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [{}])[0].get("from", "")
            if sender_phone_number:
                send_message_to_user(sender_phone_number, ai_response)
        except Exception as e:
            print(f"Error processing webhook: {e}")
    print("Received WhatsApp webhook:", payload)
    return {"status": "ok"}
    

# Send message to user using WhatsApp API
@router.post("/send_message", status_code=200)
def send_message(phone_number: str, message: str) -> None:
    response = send_message_to_user(phone_number, message)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    
    
def send_message_to_user(phone_number: str, message: str):
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

def generate_response_with_ai(user_message: str) -> str:
    # Call OpenAI responses API

    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=150,
    )

    ai_message = response.choices[0].message.content.strip()
    return ai_message