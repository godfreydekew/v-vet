import logging
import uuid
from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client | None:
    """
    Create and return a Supabase Python Client following official Supabase Python SDK docs:
    https://supabase.com/docs/reference/python/introduction
    """
    url = getattr(settings, "SUPABASE_URL", None)
    key = (
        getattr(settings, "SUPABASE_KEY", None)
        or getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)
        or getattr(settings, "SUPERBASE_S3_SECRET_ACCESS_KEY", None)
    )

    if not url and settings.SUPERBASE_S3_BUCKET_ENDPOINT:
        # Derive base Supabase URL: https://<project>.storage.supabase.co/storage/v1/s3 -> https://<project>.supabase.co
        endpoint = str(settings.SUPERBASE_S3_BUCKET_ENDPOINT)
        if ".storage.supabase.co" in endpoint:
            url = endpoint.split(".storage.supabase.co")[0] + ".supabase.co"
        else:
            url = endpoint

    if not url or not key:
        logger.warning("[Storage] Supabase URL or Key not configured.")
        return None

    try:
        return create_client(url, key)
    except Exception as err:
        logger.exception("[Storage] Failed to initialize Supabase Python client: %s", err)
        return None


def upload_livestock_image_bytes(
    image_bytes: bytes,
    filename: str = "photo.jpg",
    content_type: str = "image/jpeg",
    livestock_id: str | None = None,
) -> str | None:
    """
    Upload raw image bytes using official Supabase Python Storage SDK:
    supabase.storage.from_(bucket).upload(path=key, file=image_bytes, file_options=...)
    Returns the public URL from supabase.storage.from_(bucket).get_public_url(key).
    """
    client = get_supabase_client()
    if not client:
        logger.error("[Storage] Cannot upload image: Supabase client not available.")
        return None

    bucket = settings.SUPERBASE_S3_BUCKET or "images"
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    unique_suffix = uuid.uuid4().hex[:8]

    if livestock_id:
        key = f"livestock/{livestock_id}/photo_{unique_suffix}.{ext}"
    else:
        key = f"livestock/pending/photo_{uuid.uuid4().hex}.{ext}"

    try:
        client.storage.from_(bucket).upload(
            path=key,
            file=image_bytes,
            file_options={"content-type": content_type, "x-upsert": "true"},
        )
        public_url = client.storage.from_(bucket).get_public_url(key)
        logger.info("[Storage] Successfully uploaded image to Supabase Storage: %s", public_url)
        return public_url
    except Exception as err:
        logger.exception("[Storage] Supabase Storage upload failed for key %s: %s", key, err)
        return None


def delete_livestock_image_by_url(image_url: str) -> bool:
    """
    Delete a livestock image from Supabase Storage given its public URL.
    Follows official Supabase Python Storage API docs:
    https://supabase.com/docs/reference/python/storage-deletebucket
    """
    client = get_supabase_client()
    if not client:
        logger.error("[Storage] Cannot delete image: Supabase client not available.")
        return False

    bucket = settings.SUPERBASE_S3_BUCKET or "images"
    marker = f"/public/{bucket}/"
    idx = image_url.find(marker)
    if idx == -1:
        logger.warning("[Storage] Could not parse path key from URL: %s", image_url)
        return False

    key = image_url[idx + len(marker) :]

    try:
        client.storage.from_(bucket).remove([key])
        logger.info("[Storage] Successfully deleted image from Supabase Storage: %s", key)
        return True
    except Exception as err:
        logger.exception("[Storage] Supabase Storage delete failed for key %s: %s", key, err)
        return False
