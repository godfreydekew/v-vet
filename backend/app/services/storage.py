import logging
import uuid
from typing import Any
import httpx

import boto3

from app.core.config import settings

logger = logging.getLogger(__name__)

access_key = getattr(settings, "SUPERBASE_S3_ACCESS_ID", None)
secret_key = getattr(settings, "SUPERBASE_S3_SECRET_ACCESS_KEY", None)
endpoint_url = getattr(settings, "SUPERBASE_S3_BUCKET_ENDPOINT", None)
region = getattr(settings, "SUPERBASE_S3_REGION", None) or "us-east-1"

def get_s3_client() -> Any | None:
    """
    Create and return a boto3 S3 client configured for Supabase S3 Storage.
    https://supabase.com/docs/guides/storage/s3/quickstart
    """

    if not access_key or not secret_key or not endpoint_url:
        logger.warning("[Storage] Supabase S3 credentials or endpoint not fully configured.")
        return None

    try:
        return boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
    except Exception as err:
        logger.exception("[Storage] Failed to initialize S3 client: %s", err)
        return None


def upload_livestock_image_bytes(
    image_bytes: bytes,
    filename: str = "photo.jpg",
    content_type: str = "image/jpeg",
    livestock_id: str | None = None,
) -> str | None:
    """
    Upload raw image bytes to Supabase S3 bucket using boto3 s3.put_object.
    Returns the public URL for the uploaded file.
    """
    s3_client = get_s3_client()
    if not s3_client or not endpoint_url:
        logger.error("[Storage] Cannot upload image: S3 client or endpoint not available.")
        return None

    bucket = settings.SUPERBASE_S3_BUCKET
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    unique_suffix = uuid.uuid4().hex[:8]

    if livestock_id:
        key = f"livestock/{livestock_id}/photo_{unique_suffix}.{ext}"
    else:
        key = f"livestock/pending/photo_{unique_suffix}.{ext}"

    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=image_bytes,
            ContentType=content_type,
        )

        base_url = str(endpoint_url).replace('/storage/v1/s3', '').rstrip('/')
        public_url = f"{base_url}/storage/v1/object/public/{bucket}/{key}"
        logger.info("[Storage] Successfully uploaded image to Supabase S3: %s", public_url)
        return public_url
    except Exception as err:
        logger.exception("[Storage] Supabase S3 upload failed for key %s: %s", key, err)
        return None



def delete_livestock_image_by_url(image_url: str) -> bool:
    """
    Delete a livestock image from Supabase S3 storage given its public URL.
    """
    s3_client = get_s3_client()
    if not s3_client:
        logger.error("[Storage] Cannot delete image: S3 client not available.")
        return False

    bucket = settings.SUPERBASE_S3_BUCKET
    marker = f"/{bucket}/"
    idx = image_url.find(marker)
    if idx == -1:
        logger.warning("[Storage] Could not parse path key from URL: %s", image_url)
        return False

    key = image_url[idx + len(marker) :]

    try:
        s3_client.delete_object(Bucket=bucket, Key=key)
        logger.info("[Storage] Successfully deleted image from Supabase S3: %s", key)
        return True
    except Exception as err:
        logger.exception("[Storage] Supabase S3 delete failed for key %s: %s", key, err)
        return False

def move_pending_image_to_livestock(
    pending_url: str,
    livestock_id: str | uuid.UUID,
) -> str | None:
    """
    Download pending image bytes from pending_url, upload them to livestock/{livestock_id}/,
    and delete the old pending file.
    """
    if not pending_url or "livestock/pending/" not in pending_url:
        return pending_url
    try:
        # 1. Download image bytes from the pending public URL
        response = httpx.get(pending_url, timeout=10.0)
        if response.status_code != 200:
            logger.error("[Storage] Failed to download pending image: status %s", response.status_code)
            return pending_url
        image_bytes = response.content
        content_type = response.headers.get("content-type", "image/jpeg")
        # 2. Upload to the final livestock path (livestock/{livestock_id}/...)
        new_url = upload_livestock_image_bytes(
            image_bytes=image_bytes,
            filename="photo.jpg",
            content_type=content_type,
            livestock_id=str(livestock_id),
        )
        # 3. Clean up the pending file
        if new_url:
            delete_livestock_image_by_url(pending_url)
            return new_url
        return pending_url
    except Exception as err:
        logger.exception("[Storage] Failed to transfer pending image to livestock %s: %s", livestock_id, err)
        return pending_url


