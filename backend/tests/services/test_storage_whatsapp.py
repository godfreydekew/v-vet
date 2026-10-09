from unittest.mock import MagicMock, patch

from app.services.storage import upload_livestock_image_bytes
from app.services.whatsapp_flow_media import download_whatsapp_flow_media


def test_upload_livestock_image_bytes_success():
    mock_s3 = MagicMock()

    with patch("app.services.storage.get_s3_client", return_value=mock_s3), \
         patch("app.services.storage.settings") as mock_settings:
        mock_settings.SUPERBASE_S3_BUCKET = "images"
        mock_settings.SUPABASE_URL = "https://example.supabase.co"

        url = upload_livestock_image_bytes(
            image_bytes=b"fake-image-bytes",
            filename="test.jpg",
            content_type="image/jpeg",
            livestock_id="12345",
        )

        assert url is not None
        assert "https://example.supabase.co/storage/v1/object/public/images/livestock/12345/photo_" in url
        mock_s3.put_object.assert_called_once()



def test_download_whatsapp_flow_media_direct_url():
    with patch("app.services.whatsapp_flow_media.download_media", return_value=b"image-content") as mock_dl:
        res = download_whatsapp_flow_media("https://example.com/photo.jpg")
        assert res is not None
        bytes_out, ctype, fname = res
        assert bytes_out == b"image-content"
        assert ctype == "image/jpeg"
        mock_dl.assert_called_once_with("https://example.com/photo.jpg")
