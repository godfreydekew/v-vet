"""Which agent the router picks for each message."""

from types import SimpleNamespace

import pytest

from app.assistant import router
from app.models.whatsapp import IncomingMessage, WhatsAppUser

PHONE = "263771234567"
OK_RESPONSE = SimpleNamespace(status_code=200, text="")


@pytest.fixture
def handled(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    calls: list[str] = []
    monkeypatch.setattr(router, "handle_guest_message", lambda **kwargs: calls.append("guest"))
    monkeypatch.setattr(router, "handle_farmer_message", lambda **kwargs: calls.append("farmer"))
    monkeypatch.setattr(router, "mark_whatsapp_message_as_read", lambda message_id: OK_RESPONSE)
    return calls


def _farmer() -> WhatsAppUser:
    return WhatsAppUser(phone=PHONE, hashed_password="x", is_fully_onboarded=True)


def _text(text: str) -> IncomingMessage:
    return IncomingMessage(message_id="wamid.1", phone=PHONE, message_type="text", text=text, button_id=None)


def test_guests_go_to_the_guest_agent(handled) -> None:
    assert router.route_message(session=None, user=None, message=_text("hi"))
    assert handled == ["guest"]


def test_farmer_text_goes_to_the_farmer_agent(handled) -> None:
    assert router.route_message(session=None, user=_farmer(), message=_text("hi"))
    assert handled == ["farmer"]


def test_farmer_taps_stay_in_the_pipeline(handled) -> None:
    tap = IncomingMessage(
        message_id="wamid.2", phone=PHONE, message_type="interactive", text=None, button_id="register_animal"
    )

    assert router.route_message(session=None, user=_farmer(), message=tap) is False
    assert handled == []

