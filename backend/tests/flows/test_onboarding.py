"""The onboarding flow reads its form through OnboardingForm. No database, OpenAI or WhatsApp."""

from unittest.mock import MagicMock

import pytest

from app.flows import onboarding
from app.flows.onboarding import FORM_INVALID_MESSAGE, OnboardingFlow
from app.models.whatsapp import WhatsAppUser


@pytest.fixture
def completed(monkeypatch: pytest.MonkeyPatch) -> list[WhatsAppUser]:
    finished: list[WhatsAppUser] = []

    def fake_complete_onboarding(*, session, user):  # noqa: ARG001
        finished.append(user)
        user.is_fully_onboarded = True
        return user

    monkeypatch.setattr("app.crud.complete_onboarding", fake_complete_onboarding)
    monkeypatch.setattr(onboarding, "send_main_menu", lambda **kwargs: True)
    return finished


def _guest() -> WhatsAppUser:
    return WhatsAppUser(phone="263771234567", hashed_password="x", animal_count=5)


def test_valid_form_saves_details_and_completes_onboarding(completed) -> None:
    user = _guest()
    session = MagicMock()

    reply = OnboardingFlow().handle(
        data={
            "full_name": " Tendai Moyo ",
            "district": "Gweru Rural",
            "preferred_language": "shona",
            "main_goal": "Health tracking",
            "animal_count": "12",
        },
        user=user,
        session=session,
    )

    assert reply == ""
    assert completed == [user]
    assert (user.full_name, user.district, user.preferred_language) == ("Tendai Moyo", "Gweru Rural", "shona")
    assert user.main_goal == "Health tracking"
    assert user.animal_count == 12
    session.commit.assert_called_once()


def test_empty_animal_count_keeps_the_existing_value(completed) -> None:  # noqa: ARG001
    user = _guest()

    OnboardingFlow().handle(
        data={
            "full_name": "Tendai",
            "district": "Lupane",
            "preferred_language": "english",
            "main_goal": "Record keeping",
            "animal_count": "",
        },
        user=user,
        session=MagicMock(),
    )

    assert user.animal_count == 5


def test_invalid_form_is_not_saved(completed) -> None:
    user = _guest()
    session = MagicMock()

    reply = OnboardingFlow().handle(
        data={"full_name": "", "district": "Lupane", "preferred_language": "english", "main_goal": "x"},
        user=user,
        session=session,
    )

    assert reply == FORM_INVALID_MESSAGE
    assert completed == []
    assert user.full_name is None
    session.commit.assert_not_called()
