import base64
import logging
from typing import Any
import requests
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

from app.core.config import settings
from app.services.whatsapp.client import download_media

logger = logging.getLogger(__name__)


def decrypt_whatsapp_media(
    encrypted_bytes: bytes,
    enc_key_b64: str,
    iv_b64: str,
) -> bytes | None:
    """Decrypt media downloaded from WhatsApp Flow encrypted CDN link using AES-256-CBC."""
    try:
        key = base64.b64decode(enc_key_b64)
        iv = base64.b64decode(iv_b64)

        cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        padded_plaintext = decryptor.update(encrypted_bytes) + decryptor.finalize()

        unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
        plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
        return plaintext
    except Exception as err:
        logger.warning("[WhatsAppFlowMedia] Failed to decrypt media: %s", err)
        return None


def fetch_media_url_by_id(media_id: str) -> str | None:
    """Query Meta Graph API to get temporary media download URL from media ID."""
    if not settings.WHATSAPP_ACCESS_TOKEN:
        logger.warning("[WhatsAppFlowMedia] WHATSAPP_ACCESS_TOKEN not set.")
        return None

    url = f"https://graph.facebook.com/v21.0/{media_id}"
    headers = {"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("url")
        logger.warning("[WhatsAppFlowMedia] Media ID lookup failed %s: %s", resp.status_code, resp.text)
    except Exception as err:
        logger.exception("[WhatsAppFlowMedia] Error fetching media URL for ID %s: %s", media_id, err)
    return None


def download_whatsapp_flow_media(photo_data: Any) -> tuple[bytes, str, str] | None:
    """
    Parses WhatsApp Flow PhotoPicker submission output and returns (image_bytes, content_type, filename).
    Handles direct URLs, Meta Media IDs, and encrypted CDN flow payloads.
    """
    if not photo_data:
        return None

    # Handle lists from PhotoPicker
    item = photo_data[0] if isinstance(photo_data, list) and photo_data else photo_data

    media_id: str | None = None
    cdn_url: str | None = None
    enc_meta: dict[str, Any] | None = None

    if isinstance(item, dict):
        cdn_url = item.get("cdn_url") or item.get("url")
        media_id = item.get("id") or item.get("file_id") or item.get("media_id")
        enc_meta = item.get("encryption_metadata") or item.get("encryption_key")
    elif isinstance(item, str):
        if item.startswith("http://") or item.startswith("https://"):
            cdn_url = item
        else:
            media_id = item

    # Scenario 1: Encrypted CDN download
    if cdn_url and enc_meta and isinstance(enc_meta, dict):
        raw_enc_bytes = download_media(cdn_url)
        if raw_enc_bytes:
            enc_key = enc_meta.get("encryption_key") or enc_meta.get("enc_key")
            iv = enc_meta.get("iv")
            if enc_key and iv:
                decrypted = decrypt_whatsapp_media(raw_enc_bytes, enc_key, iv)
                if decrypted:
                    return decrypted, "image/jpeg", "whatsapp_flow.jpg"

    # Scenario 2: Unencrypted CDN URL or standard media URL
    if cdn_url:
        raw_bytes = download_media(cdn_url)
        if raw_bytes:
            return raw_bytes, "image/jpeg", "whatsapp_flow.jpg"

    # Scenario 3: Media ID lookup
    if media_id:
        url = fetch_media_url_by_id(media_id)
        if url:
            raw_bytes = download_media(url)
            if raw_bytes:
                return raw_bytes, "image/jpeg", f"{media_id}.jpg"

    logger.warning("[WhatsAppFlowMedia] Unable to extract or download media from payload: %s", photo_data)
    return None
