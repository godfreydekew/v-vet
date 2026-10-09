"""The pipeline hands messages from farmers who haven't onboarded to app.assistant."""

from unittest.mock import MagicMock

from app.assistant import router
from app.services.whatsapp.pipeline import WhatsAppConversationService

PHONE = "263771234567"


def _route_and_capture(monkeypatch, message_obj: dict) -> list:
    captured = []

    def fake_route_message(*, session, user, message):  # noqa: ARG001
        captured.append(message)
        return True

    monkeypatch.setattr(
        "app.services.whatsapp.pipeline.get_whatsapp_user_by_phone", lambda **kwargs: None
    )
    monkeypatch.setattr(router, "route_message", fake_route_message)

    WhatsAppConversationService().process_message(
        session=MagicMock(), phone=PHONE, message_obj=message_obj
    )
    return captured


def test_text_from_new_number_goes_to_router(monkeypatch) -> None:
    message_obj = {"id": "wamid.1", "type": "text", "text": {"body": "Hello"}}

    captured = _route_and_capture(monkeypatch, message_obj)

    assert len(captured) == 1
    assert captured[0].text == "Hello"
    assert captured[0].button_id is None


def test_button_tap_is_passed_as_button_id(monkeypatch) -> None:
    message_obj = {
        "id": "wamid.2",
        "type": "interactive",
        "interactive": {
            "type": "button_reply",
            "button_reply": {"id": "guest_get_started", "title": "Get started"},
        },
    }

    captured = _route_and_capture(monkeypatch, message_obj)

    assert captured[0].button_id == "guest_get_started"
    assert captured[0].text is None


def test_photo_still_reaches_router(monkeypatch) -> None:
    message_obj = {"id": "wamid.3", "type": "image", "image": {"id": "media-1"}}

    captured = _route_and_capture(monkeypatch, message_obj)

    assert captured[0].message_type == "image"
    assert captured[0].text is None
