"""Tests for the guest stage. Everything outside app.assistant is replaced with fakes,
so these tests never call OpenAI, WhatsApp or the database."""

from types import SimpleNamespace

import pytest

from app.assistant import messaging, router
from app.assistant.guest import agent as guest
from app.assistant.guest.schemas import GuestReply
from app.flows.onboarding import OnboardingFlow
from app.models.whatsapp import IncomingMessage, WhatsAppUser

PHONE = "263771234567"
OK_RESPONSE = SimpleNamespace(status_code=200, text="")


def _message(text: str | None = None, button_id: str | None = None, message_type: str = "text") -> IncomingMessage:
    return IncomingMessage(
        message_id="wamid.1", phone=PHONE, message_type=message_type, text=text, button_id=button_id
    )


@pytest.fixture
def fakes(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    """Replace every outside call the guest handler makes, and record what it did."""
    recorded = SimpleNamespace(
        button_messages=[],
        created_users=[],
        model_calls=[],
        onboarding_started=[],
        model_answer=None,
        model_error=None,
    )

    def fake_create_user(*, session, user_in):  # noqa: ARG001
        user = WhatsAppUser(phone=user_in.phone, hashed_password="x")
        recorded.created_users.append(user)
        return user

    def fake_answer_guest(*, message, history, is_first_message):  # noqa: ARG001
        recorded.model_calls.append(message)
        if recorded.model_error is not None:
            raise recorded.model_error
        return recorded.model_answer

    def fake_send_buttons(*, phone, body, buttons):  # noqa: ARG001
        recorded.button_messages.append(body)
        return OK_RESPONSE

    def fake_onboarding_start(self, phone, user, session):  # noqa: ARG001
        recorded.onboarding_started.append(phone)
        return True

    monkeypatch.setattr(guest, "create_whatsapp_user", fake_create_user)
    monkeypatch.setattr(guest, "get_conversation_history", lambda **kwargs: [])
    monkeypatch.setattr(guest, "answer_guest", fake_answer_guest)
    monkeypatch.setattr(messaging, "save_whatsapp_message", lambda **kwargs: None)
    monkeypatch.setattr(messaging, "send_reply_buttons", fake_send_buttons)
    monkeypatch.setattr(messaging, "send_whatsapp_message", lambda **kwargs: OK_RESPONSE)
    monkeypatch.setattr(OnboardingFlow, "start", fake_onboarding_start)
    monkeypatch.setattr(router, "mark_whatsapp_message_as_read", lambda message_id: OK_RESPONSE)
    return recorded


def _existing_guest() -> WhatsAppUser:
    return WhatsAppUser(phone=PHONE, hashed_password="x", is_fully_onboarded=False)


def test_first_hello_creates_user_and_sends_welcome(fakes) -> None:
    fakes.model_answer = GuestReply(intent="greeting", language="english", reply="Hi!")

    guest.handle_guest_message(session=None, user=None, message=_message("hi"))

    assert len(fakes.created_users) == 1
    assert fakes.button_messages == [guest.WELCOME_MESSAGE]


def test_first_message_with_a_question_gets_the_model_answer(fakes) -> None:
    fakes.model_answer = GuestReply(intent="cost", language="english", reply="Welcome! V-Vet is free.")

    guest.handle_guest_message(session=None, user=None, message=_message("Is this free?"))

    assert fakes.button_messages == ["Welcome! V-Vet is free."]


@pytest.mark.parametrize("text", ["yes", "Yes.", "OK!", "ehe", "Yebo", "👍"])
def test_yes_starts_onboarding_without_calling_the_model(fakes, text: str) -> None:
    guest.handle_guest_message(session=None, user=_existing_guest(), message=_message(text))

    assert fakes.onboarding_started == [PHONE]
    assert fakes.model_calls == []
    assert fakes.button_messages == []


def test_get_started_button_starts_onboarding(fakes) -> None:
    message = _message(button_id=guest.GET_STARTED_BUTTON_ID, message_type="interactive")

    guest.handle_guest_message(session=None, user=_existing_guest(), message=message)

    assert fakes.onboarding_started == [PHONE]


def test_ready_to_register_intent_starts_onboarding(fakes) -> None:
    fakes.model_answer = GuestReply(intent="ready_to_register", language="english", reply="Great!")

    guest.handle_guest_message(session=None, user=_existing_guest(), message=_message("yes please let's start"))

    assert fakes.onboarding_started == [PHONE]
    assert fakes.button_messages == []


def test_photo_gets_unsupported_reply(fakes) -> None:
    guest.handle_guest_message(
        session=None, user=_existing_guest(), message=_message(message_type="image")
    )

    assert fakes.button_messages == [guest.UNSUPPORTED_MESSAGE]
    assert fakes.model_calls == []


def test_urgent_english_message_uses_fixed_wording(fakes) -> None:
    fakes.model_answer = GuestReply(
        intent="urgent", language="english", reply="Give her some medicine."
    )

    guest.handle_guest_message(
        session=None, user=_existing_guest(), message=_message("My cow can't stand up!")
    )

    assert fakes.button_messages == [guest.URGENT_MESSAGES["english"]]


def test_model_failure_falls_back_to_welcome(fakes) -> None:
    fakes.model_error = RuntimeError("OpenAI is down")

    guest.handle_guest_message(
        session=None, user=_existing_guest(), message=_message("What is V-Vet?")
    )

    assert fakes.button_messages == [guest.WELCOME_MESSAGE]


def test_router_sends_guests_to_guest_stage(fakes) -> None:
    fakes.model_answer = GuestReply(intent="what_is_vvet", language="english", reply="V-Vet helps farmers.")

    handled = router.route_message(session=None, user=_existing_guest(), message=_message("What is V-Vet?"))

    assert handled is True
    assert fakes.button_messages == ["V-Vet helps farmers."]


def test_router_sends_onboarded_farmers_to_the_farmer_agent(fakes, monkeypatch) -> None:
    farmer_messages: list[str] = []
    monkeypatch.setattr(
        router, "handle_farmer_message", lambda *, session, user, message: farmer_messages.append(message.text)  # noqa: ARG005
    )
    onboarded = WhatsAppUser(phone=PHONE, hashed_password="x", is_fully_onboarded=True)

    handled = router.route_message(session=None, user=onboarded, message=_message("menu"))

    assert handled is True
    assert farmer_messages == ["menu"]
    assert fakes.button_messages == []
