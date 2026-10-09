"""Recording a death through the farmer agent's tool, against a real database.

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
from app.flows import FLOW_REGISTRY, record_death
from app.models import Livestock, User
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


@pytest.fixture(autouse=True)
def fakes(monkeypatch: pytest.MonkeyPatch) -> None:
    # Without a pick-date form configured, the flow asks with Today/Yesterday buttons.
    monkeypatch.setattr(settings, "FLOW_ID_PICK_DATE", None)
    monkeypatch.setattr(record_death, "send_interactive_animal_list", lambda **kwargs: True)
    monkeypatch.setattr(record_death, "send_list_message", lambda **kwargs: OK_RESPONSE)
    monkeypatch.setattr(record_death, "send_reply_buttons", lambda **kwargs: OK_RESPONSE)


@pytest.fixture
def farmer_and_cow(session: Session) -> tuple[WhatsAppUser, Livestock]:
    web_user = User(email=None, hashed_password="x", full_name="Tendai", district="Harare")
    session.add(web_user)
    session.commit()
    farmer = WhatsAppUser(
        phone="2637" + uuid.uuid4().hex[:8],
        hashed_password="x",
        district="Harare",
        is_fully_onboarded=True,
        linked_user_id=web_user.id,
    )
    session.add(farmer)
    farm = get_or_create_default_farm(session=session, user_id=web_user.id)
    cow = Livestock(farm_id=farm.id, name="Bessie", tag_number="HAR-ABC-24-0001", gender="female")
    session.add(cow)
    session.commit()
    session.refresh(farmer)
    session.refresh(cow)
    return farmer, cow


def _states(session: Session, farmer: WhatsAppUser) -> list[ConversationState]:
    return list(
        session.exec(
            select(ConversationState).where(ConversationState.whatsapp_user_id == farmer.id)
        ).all()
    )


def test_each_step_is_tracked_until_the_death_is_recorded(session, farmer_and_cow) -> None:
    farmer, cow = farmer_and_cow
    flow = FLOW_REGISTRY["record_death"]

    result = tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "record_death"})
    assert result["status"] == "started"
    [state] = _states(session, farmer)
    assert (state.flow, state.step, state.status) == ("record_death", "pick_animal", "active")
    assert "Recording a death: V-Vet sent the farmer a way to choose" in build_farmer_context(session=session, user=farmer)

    assert flow.handle_animal_selection(animal_id=str(cow.id), phone=farmer.phone, user=farmer, session=session)
    [state] = _states(session, farmer)
    assert state.step == "pick_cause"
    assert state.data == {"animal_id": str(cow.id), "animal_name": "Bessie", "cause": None}
    assert "Recording a death for Bessie: waiting for the farmer to choose the cause" in build_farmer_context(
        session=session, user=farmer
    )

    assert flow.handle_cause_selection(row_id="death_cause_disease", phone=farmer.phone, user=farmer, session=session)
    [state] = _states(session, farmer)
    assert state.step == "pick_date"
    assert state.data["cause"] == "disease"
    assert "(cause: Disease / Illness)" in build_farmer_context(session=session, user=farmer)

    reply = flow.handle_date_selection(row_id="death_date_today", user=farmer, session=session)
    assert reply is not None and "Bessie has been marked as deceased" in reply
    [state] = _states(session, farmer)
    assert (state.step, state.status) == ("done", "completed")
    assert "date_of_death" in state.data
    session.refresh(cow)
    assert cow.lifecycle_status == "deceased"
    assert cow.cause_of_death == "disease"
    assert "Nothing in progress." in build_farmer_context(session=session, user=farmer)


def test_starting_another_flow_abandons_the_death_record(session, farmer_and_cow, monkeypatch) -> None:
    farmer, cow = farmer_and_cow
    monkeypatch.setattr(settings, "FLOW_ID_REGISTER_ANIMAL", "test-flow-id")
    monkeypatch.setattr("app.flows.register_animal.send_flow_message", lambda **kwargs: OK_RESPONSE)

    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "record_death"})
    FLOW_REGISTRY["record_death"].handle_animal_selection(
        animal_id=str(cow.id), phone=farmer.phone, user=farmer, session=session
    )
    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "register_animal"})

    states = {state.flow: state for state in _states(session, farmer)}
    assert (states["record_death"].status, states["record_death"].step) == ("abandoned", "pick_cause")
    assert states["register_animal"].status == "active"


def test_cause_tap_from_an_abandoned_death_record_is_ignored(session, farmer_and_cow, monkeypatch) -> None:
    farmer, cow = farmer_and_cow
    monkeypatch.setattr(settings, "FLOW_ID_REGISTER_ANIMAL", "test-flow-id")
    monkeypatch.setattr("app.flows.register_animal.send_flow_message", lambda **kwargs: OK_RESPONSE)
    flow = FLOW_REGISTRY["record_death"]
    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "record_death"})
    flow.handle_animal_selection(animal_id=str(cow.id), phone=farmer.phone, user=farmer, session=session)
    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "register_animal"})

    assert flow.handle_cause_selection(row_id="death_cause_disease", phone=farmer.phone, user=farmer, session=session) is False
    session.refresh(cow)
    assert cow.lifecycle_status == "active"


def test_choosing_another_animal_clears_the_chosen_cause(session, farmer_and_cow) -> None:
    farmer, cow = farmer_and_cow
    flow = FLOW_REGISTRY["record_death"]
    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "record_death"})
    flow.handle_animal_selection(animal_id=str(cow.id), phone=farmer.phone, user=farmer, session=session)
    flow.handle_cause_selection(row_id="death_cause_injury", phone=farmer.phone, user=farmer, session=session)

    flow.handle_animal_selection(animal_id=str(cow.id), phone=farmer.phone, user=farmer, session=session)

    [state] = _states(session, farmer)
    assert state.step == "pick_cause"
    assert state.data["cause"] is None
    # Without a cause, a date tap can't finish the record.
    assert flow.handle_date_selection(row_id="death_date_today", user=farmer, session=session) is None

