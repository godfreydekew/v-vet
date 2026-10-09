"""Recording a birth through the farmer agent's tool, against a real database.

Each test runs inside a transaction that is rolled back afterwards, so no rows are left behind.
WhatsApp sends are replaced with fakes.
"""

import uuid
from collections.abc import Generator
from types import SimpleNamespace

import pytest
from sqlmodel import Session, select

from app.assistant.farmer import tools
from app.assistant.farmer.context import build_farmer_context
from app.core.config import settings
from app.core.db import engine
from app.crud import get_or_create_default_farm
from app.flows import FLOW_REGISTRY, record_birth
from app.models import Livestock, LivestockParentage, User
from app.models.conversation_state import ConversationState
from app.models.whatsapp import WhatsAppUser

OK_RESPONSE = SimpleNamespace(status_code=200, text="")


@pytest.fixture
def session() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    db_session = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield db_session
    db_session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def sent_forms(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    screens: list[str] = []

    def fake_send_flow_message(*, phone, flow_id, flow_token, body, cta, screen):  # noqa: ARG001
        screens.append(screen)
        return OK_RESPONSE

    monkeypatch.setattr(settings, "FLOW_ID_RECORD_BIRTH", "birth-form")
    monkeypatch.setattr(settings, "FLOW_ID_REGISTER_ANIMAL", "register-form")
    monkeypatch.setattr(record_birth, "send_interactive_animal_list", lambda **kwargs: True)
    monkeypatch.setattr(record_birth, "send_flow_message", fake_send_flow_message)
    monkeypatch.setattr(record_birth, "send_whatsapp_message", lambda **kwargs: OK_RESPONSE)
    return screens


@pytest.fixture
def farmer(session: Session) -> WhatsAppUser:
    web_user = User(email=None, hashed_password="x", full_name="Tendai", district="Harare")
    session.add(web_user)
    session.commit()
    whatsapp_user = WhatsAppUser(
        phone="2637" + uuid.uuid4().hex[:8],
        hashed_password="x",
        district="Harare",
        is_fully_onboarded=True,
        linked_user_id=web_user.id,
    )
    session.add(whatsapp_user)
    session.commit()
    session.refresh(whatsapp_user)
    return whatsapp_user


def _add_cow(session: Session, farmer: WhatsAppUser, gender: str) -> Livestock:
    farm = get_or_create_default_farm(session=session, user_id=farmer.linked_user_id)
    cow = Livestock(farm_id=farm.id, name="Daisy", tag_number="HAR-ABC-22-0001", gender=gender)
    session.add(cow)
    session.commit()
    session.refresh(cow)
    return cow


def _states(session: Session, farmer: WhatsAppUser) -> list[ConversationState]:
    return list(
        session.exec(
            select(ConversationState).where(ConversationState.whatsapp_user_id == farmer.id)
        ).all()
    )


def test_each_step_is_tracked_until_the_calf_is_registered(session, farmer, sent_forms) -> None:
    daisy = _add_cow(session, farmer, gender="female")
    flow = FLOW_REGISTRY["record_birth"]

    assert tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "record_birth"})[
        "status"
    ] == "started"
    [state] = _states(session, farmer)
    assert (state.flow, state.step, state.status) == ("record_birth", "pick_mother", "active")
    assert "Recording a birth: V-Vet sent the farmer a way to choose the mother cow" in build_farmer_context(
        session=session, user=farmer
    )

    assert flow.handle_dam_selection(animal_id=str(daisy.id), phone=farmer.phone, user=farmer, session=session)
    [state] = _states(session, farmer)
    assert state.step == "calving_details"
    assert state.data == {"mother_id": str(daisy.id), "mother_name": "Daisy"}
    assert sent_forms == ["RECORD_BIRTH"]
    assert "Recording a birth for Daisy: V-Vet sent the birth details form" in build_farmer_context(
        session=session, user=farmer
    )

    flow.handle(
        data={"survived": "yes", "colostrum": "yes", "mastitis": "no", "date_of_birth": "2026-10-07"},
        user=farmer,
        session=session,
    )
    [state] = _states(session, farmer)
    assert state.step == "calf_details"
    assert state.data["survived"] is True
    assert state.data["date_of_birth"] == "2026-10-07"
    assert sent_forms == ["RECORD_BIRTH", "REGISTER_ANIMAL"]
    assert "waiting for the farmer to submit the calf's registration form" in build_farmer_context(
        session=session, user=farmer
    )

    reply = flow.handle(
        data={"name": "Tiny", "breed": "", "gender": "female", "weight_kg": "30"},
        user=farmer,
        session=session,
    )
    assert "Birth recorded" in reply
    [state] = _states(session, farmer)
    assert (state.step, state.status) == ("done", "completed")
    calf = session.get(Livestock, uuid.UUID(state.data["calf_id"]))
    assert calf is not None and calf.name == "Tiny"
    link = session.exec(select(LivestockParentage).where(LivestockParentage.child_id == calf.id)).one()
    assert link.mother_id == daisy.id
    assert "Nothing in progress." in build_farmer_context(session=session, user=farmer)


def test_no_mother_cows_means_no_birth_in_progress(session, farmer, sent_forms) -> None:  # noqa: ARG001
    _add_cow(session, farmer, gender="male")

    assert FLOW_REGISTRY["record_birth"].start(phone=farmer.phone, user=farmer, session=session)

    assert _states(session, farmer) == []


def test_calf_form_with_optional_fields_left_out_still_registers_the_calf(session, farmer, sent_forms) -> None:
    """WhatsApp leaves out fields the farmer didn't fill in, e.g. breed."""
    daisy = _add_cow(session, farmer, gender="female")
    flow = FLOW_REGISTRY["record_birth"]
    flow.start(phone=farmer.phone, user=farmer, session=session)
    flow.handle_dam_selection(animal_id=str(daisy.id), phone=farmer.phone, user=farmer, session=session)
    flow.handle(data={"survived": "yes", "date_of_birth": "2026-10-08"}, user=farmer, session=session)

    reply = flow.handle(
        data={"name": "Shum", "gender": "male", "date_of_birth": "2026-10-08", "weight_kg": "50"},
        user=farmer,
        session=session,
    )

    assert "Birth recorded" in reply
    assert sent_forms == ["RECORD_BIRTH", "REGISTER_ANIMAL"]
    [state] = _states(session, farmer)
    assert (state.step, state.status) == ("done", "completed")


def test_starting_a_new_birth_replaces_an_unfinished_one(session, farmer, sent_forms) -> None:  # noqa: ARG001
    """A calf-shaped form after restarting must not be taken as the old birth's calf."""
    daisy = _add_cow(session, farmer, gender="female")
    flow = FLOW_REGISTRY["record_birth"]
    flow.start(phone=farmer.phone, user=farmer, session=session)
    flow.handle_dam_selection(animal_id=str(daisy.id), phone=farmer.phone, user=farmer, session=session)
    flow.handle(data={"survived": "yes", "date_of_birth": "2026-10-01"}, user=farmer, session=session)

    flow.start(phone=farmer.phone, user=farmer, session=session)
    reply = flow.handle(data={"name": "Shum", "gender": "male"}, user=farmer, session=session)

    assert "Birth recorded" not in reply
    states = _states(session, farmer)
    assert sorted((state.status, state.step) for state in states) == [
        ("abandoned", "calf_details"),
        ("active", "pick_mother"),
    ]
    assert session.exec(select(Livestock).where(Livestock.name == "Shum")).all() == []
