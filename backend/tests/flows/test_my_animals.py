"""The My Animals flow checks for animals before sending the list. No database or WhatsApp."""

import uuid
from types import SimpleNamespace

import pytest

from app.flows import my_animals
from app.flows.my_animals import NO_ANIMALS_MESSAGE, MyAnimalsFlow
from app.models.whatsapp import WhatsAppUser

PHONE = "263771234567"


@pytest.fixture
def sent(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    recorded = SimpleNamespace(menus=[], lists=[], animals=[])

    def fake_send_main_menu(*, phone, body):
        recorded.menus.append((phone, body))
        return True

    def fake_send_list(*, phone, user, session, intent):  # noqa: ARG001
        recorded.lists.append((phone, intent))
        return True

    monkeypatch.setattr(my_animals, "send_main_menu", fake_send_main_menu)
    monkeypatch.setattr(my_animals, "send_interactive_animal_list", fake_send_list)
    monkeypatch.setattr(my_animals, "get_livestock_for_user", lambda **kwargs: recorded.animals)
    return recorded


def _farmer() -> WhatsAppUser:
    return WhatsAppUser(phone=PHONE, hashed_password="x", linked_user_id=uuid.uuid4())


def test_farmer_with_animals_gets_the_list(sent) -> None:
    sent.animals = [SimpleNamespace(name="Bessie")]

    assert MyAnimalsFlow().start(phone=PHONE, user=_farmer(), session=None)

    assert sent.lists == [(PHONE, "view")]
    assert sent.menus == []


def test_farmer_without_animals_gets_the_menu_with_a_note(sent) -> None:
    assert MyAnimalsFlow().start(phone=PHONE, user=_farmer(), session=None)

    assert sent.menus == [(PHONE, NO_ANIMALS_MESSAGE)]
    assert sent.lists == []


def test_farmer_without_a_linked_account_has_no_animals(sent) -> None:  # noqa: ARG001
    user = WhatsAppUser(phone=PHONE, hashed_password="x")

    assert MyAnimalsFlow().has_animals(user=user, session=None) is False
