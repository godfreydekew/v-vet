import logging

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_whatsapp_message(phone: str, text: str) -> requests.Response:
    """Send a WhatsApp text message via the Meta Cloud API."""
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise RuntimeError("WhatsApp configuration is missing in settings.")

    url = f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": text},
    }
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    return requests.post(url, json=payload, headers=headers, timeout=15)


def mark_whatsapp_message_as_read(message_id: str) -> requests.Response:
    """Mark a message as read via the Meta Cloud API."""
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise RuntimeError("WhatsApp configuration is missing in settings.")

    url = f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "status": "read",
        "message_id": message_id,
    }
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    return requests.post(url, json=payload, headers=headers, timeout=15)


def send_list_message(
    phone: str,
    body: str,
    button_label: str,
    sections: list[dict],
) -> requests.Response:
    """Send an interactive list (scrollable menu) via the Meta Cloud API."""
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise RuntimeError("WhatsApp configuration is missing in settings.")

    url = f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": body},
            "action": {
                "button": button_label,
                "sections": sections,
            },
        },
    }
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    return requests.post(url, json=payload, headers=headers, timeout=15)


def send_reply_buttons(
    phone: str,
    body: str,
    buttons: list[dict],
) -> requests.Response:
    """Send up to 3 quick-reply buttons via the Meta Cloud API.

    Each button: {"id": "unique_id", "title": "Label"}
    """
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise RuntimeError("WhatsApp configuration is missing in settings.")

    url = f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                    for b in buttons
                ]
            },
        },
    }
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    return requests.post(url, json=payload, headers=headers, timeout=15)


def download_media(url: str) -> bytes | None:
    """Download raw media bytes from a Meta-signed URL."""
    if not settings.WHATSAPP_ACCESS_TOKEN:
        return None

    headers = {"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"}
    resp = requests.get(url, headers=headers, timeout=30)
    if resp.status_code != 200:
        logger.warning("[WhatsApp] Media download failed %s: %s", resp.status_code, url)
        return None
    return resp.content
