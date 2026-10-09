"""Reporting a sick animal through the farmer agent's tools, against a real database.

Each test runs inside a transaction that is rolled back afterwards, so no rows are left behind.
WhatsApp sends and the AI danger-sign check are replaced with fakes.
"""

import uuid
from collections.abc import Generator
from types import SimpleNamespace

import pytest
from sqlmodel import Session, select

from app.assistant.farmer import tools
from app.assistant.farmer.context import build_farmer_context
from app.core.db import engine
from app.crud import get_or_create_default_farm
from app.flows import FLOW_REGISTRY, report_sickness, report_sickness_context
from app.flows.report_sickness_context import TriageContextFlow
from app.flows.triage_context_questions import BASIC_CONTEXT_QUESTIONS
from app.models import HealthObservation, Livestock, User
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
def danger_flags(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    flags: list[str] = []
    monkeypatch.setattr("app.assistant.farmer.danger_flags.detect_danger_flags", lambda symptoms: list(flags))  # noqa: ARG005
    monkeypatch.setattr(report_sickness, "send_interactive_animal_list", lambda **kwargs: True)
    monkeypatch.setattr(report_sickness, "send_whatsapp_message", lambda **kwargs: OK_RESPONSE)
    for name in ("send_list_message", "send_reply_buttons", "send_whatsapp_message"):
        monkeypatch.setattr(report_sickness_context, name, lambda **kwargs: OK_RESPONSE)
    return flags


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


def _answer_every_question(session: Session, farmer: WhatsAppUser) -> str:
    """Tap the first option on each follow-up question (and Done on the multi-select one)."""
    triage = TriageContextFlow()
    completed = None
    for question in BASIC_CONTEXT_QUESTIONS:
        taps = [f"ctx_{question.id}::{question.options[0].id}"]
        if question.multi_select:
            taps.append(f"ctx_{question.id}::__done__")
        for tap in taps:
            _, completed = triage.handle_answer(row_id=tap, phone=farmer.phone, user=farmer, session=session)
    assert completed is not None
    return triage.complete_and_record(triage_session=completed, user=farmer, session=session)


def _pick_and_describe(session: Session, farmer: WhatsAppUser, cow: Livestock, symptoms: str) -> dict:
    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "report_sickness"})
    FLOW_REGISTRY["report_sickness"].handle_selection(str(cow.id), farmer, session)
    return tools.run_tool(session=session, user=farmer, name="submit_symptoms", arguments={"symptoms": symptoms})


def test_each_step_is_tracked_until_the_report_is_recorded(session, farmer_and_cow, danger_flags) -> None:  # noqa: ARG001
    farmer, cow = farmer_and_cow

    assert tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "report_sickness"})[
        "status"
    ] == "started"
    [state] = _states(session, farmer)
    assert (state.flow, state.step) == ("report_sickness", "pick_animal")
    assert "V-Vet asked the farmer which animal is sick" in build_farmer_context(session=session, user=farmer)

    FLOW_REGISTRY["report_sickness"].handle_selection(str(cow.id), farmer, session)
    [state] = _states(session, farmer)
    assert state.step == "describe_symptoms"
    assert state.data == {"animal_id": str(cow.id), "animal_name": "Bessie"}
    assert "waiting for their description" in build_farmer_context(session=session, user=farmer)

    result = tools.run_tool(
        session=session, user=farmer, name="submit_symptoms", arguments={"symptoms": "not eating, weak"}
    )
    assert result == {"status": "submitted", "ends_turn": True}
    [state] = _states(session, farmer)
    assert state.step == "questions"
    assert state.data["problem_description"] == "not eating, weak"
    assert "answering V-Vet's follow-up questions" in build_farmer_context(session=session, user=farmer)

    reply = _answer_every_question(session, farmer)
    assert "Bessie" in reply
    [state] = _states(session, farmer)
    assert (state.step, state.status) == ("done", "completed")
    assert state.data["urgency_level"]
    observation = session.get(HealthObservation, uuid.UUID(state.data["observation_id"]))
    assert observation is not None and observation.symptoms == "not eating, weak"
    assert "Nothing in progress." in build_farmer_context(session=session, user=farmer)


def test_danger_sign_skips_the_questions(session, farmer_and_cow, danger_flags) -> None:
    farmer, cow = farmer_and_cow
    danger_flags.append("cannot_stand")

    result = _pick_and_describe(session, farmer, cow, "she can't stand up")

    assert result["status"] == "submitted"
    [state] = _states(session, farmer)
    assert (state.step, state.status) == ("done", "completed")
    assert state.data["urgency_level"] == "Emergency"


def test_symptoms_are_refused_before_an_animal_is_chosen(session, farmer_and_cow, danger_flags) -> None:  # noqa: ARG001
    farmer, _ = farmer_and_cow
    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "report_sickness"})

    result = tools.run_tool(session=session, user=farmer, name="submit_symptoms", arguments={"symptoms": "coughing"})

    assert result["status"] == "error"
    [state] = _states(session, farmer)
    assert state.step == "pick_animal"
