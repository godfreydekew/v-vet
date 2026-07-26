from unittest.mock import MagicMock, patch
import uuid
import pytest
from sqlmodel import Session, select

from app.services.storage import upload_livestock_image_bytes
from app.services.whatsapp_flow_media import download_whatsapp_flow_media
from app.flows.register_animal import RegisterAnimalFlow
from app.models.whatsapp import WhatsAppUser
from app.models.livestock_image import LivestockImage
from app.core.openai import _execute_farmer_tool


def test_upload_livestock_image_bytes_success():
    mock_supabase = MagicMock()
    mock_bucket = MagicMock()
    mock_supabase.storage.from_.return_value = mock_bucket
    mock_bucket.get_public_url.return_value = "https://example.supabase.co/storage/v1/object/public/images/livestock/12345/photo_test.jpg"

    with patch("app.services.storage.get_supabase_client", return_value=mock_supabase):
        url = upload_livestock_image_bytes(
            image_bytes=b"fake-image-bytes",
            filename="test.jpg",
            content_type="image/jpeg",
            livestock_id="12345",
        )

        assert url == "https://example.supabase.co/storage/v1/object/public/images/livestock/12345/photo_test.jpg"
        mock_bucket.upload.assert_called_once()
        mock_bucket.get_public_url.assert_called_once()


def test_download_whatsapp_flow_media_direct_url():
    with patch("app.services.whatsapp_flow_media.download_media", return_value=b"image-content") as mock_dl:
        res = download_whatsapp_flow_media("https://example.com/photo.jpg")
        assert res is not None
        bytes_out, ctype, fname = res
        assert bytes_out == b"image-content"
        assert ctype == "image/jpeg"
        mock_dl.assert_called_once_with("https://example.com/photo.jpg")


from app.models.user import User

def test_register_animal_flow_and_add_livestock_photo_linking(db: Session):
    unique_id = uuid.uuid4().hex[:6]
    web_user = User(
        email=f"testfarmer_{unique_id}@example.com",
        hashed_password="hash",
        full_name="Test Farmer",
        district="Kampala",
    )
    db.add(web_user)
    db.commit()
    db.refresh(web_user)

    user = WhatsAppUser(
        phone=f"+256700{unique_id}",
        hashed_password="hash",
        district="Kampala",
        is_fully_onboarded=True,
        linked_user_id=web_user.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    flow = RegisterAnimalFlow()
    fake_s3_url = "https://example.supabase.co/storage/v1/object/public/images/livestock/pending/photo_123.jpg"

    with patch("app.services.whatsapp_flow_media.download_whatsapp_flow_media", return_value=(b"data", "image/jpeg", "photo.jpg")), \
         patch("app.services.storage.upload_livestock_image_bytes", return_value=fake_s3_url):
        
        reply = flow.handle(
            data={"species": "cattle", "name": "Bessie", "animal_photo": ["https://whatsapp.com/media1"]},
            user=user,
            session=db,
        )

        db.refresh(user)
        assert user.pending_animal_photo_url == fake_s3_url

    # Execute tool call add_livestock
    res = _execute_farmer_tool(
        tool_name="add_livestock",
        arguments={"species": "cattle", "name": "Bessie", "gender": "female", "date_of_birth": "2024-01-01"},
        user=user,
        session=db,
    )

    assert res["status"] == "saved"
    db.refresh(user)
    assert user.pending_animal_photo_url is None  # cleared

    # Check LivestockImage created
    images = db.exec(select(LivestockImage)).all()
    assert len(images) > 0
    created_img = images[-1]
    assert created_img.image_url == fake_s3_url
    assert created_img.is_primary is True
