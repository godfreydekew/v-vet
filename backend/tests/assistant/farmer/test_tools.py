"""The farmer agent's tools, with WhatsApp, the flows and message saving replaced by fakes."""

import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.assistant.farmer import tools
from app.models.whatsapp import WhatsAppUser

PHONE = "263771234567"


@pytest.fixture
def recorded(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    calls = SimpleNamespace(menus=[], saved=[], flow_starts=[], flow_start_result=True)

    def fake_send_main_menu(*, phone, body=None):
        calls.menus.append((phone, body))
        return True

    def fake_save_message(*, session, user, role, content):  # noqa: ARG001
        calls.saved.append((role, content))

    class FakeFlow:
        def start(self, phone, user, session):  # noqa: ARG002
            calls.flow_starts.append(phone)
            return calls.flow_start_result

    monkeypatch.setattr(tools, "send_main_menu", fake_send_main_menu)
    monkeypatch.setattr(tools, "save_message", fake_save_message)
    monkeypatch.setattr(
        "app.flows.FLOW_REGISTRY",
        {
            "register_animal": FakeFlow(),
            "my_animals": FakeFlow(),
            "record_death": FakeFlow(),
            "record_birth": FakeFlow(),
            "report_sickness": FakeFlow(),
        },
    )
    return calls


def _farmer() -> WhatsAppUser:
    return WhatsAppUser(phone=PHONE, hashed_password="x", is_fully_onboarded=True)


def test_send_menu_sends_and_saves(recorded) -> None:
    result = tools.run_tool(
        session=None, user=_farmer(), name="send_menu", arguments={"message": "What would you like to do?"}
    )

    assert result == {"status": "sent"}
    assert recorded.menus == [(PHONE, "What would you like to do?")]
    assert recorded.saved == [("assistant", "[Menu sent] What would you like to do?")]


def test_start_flow_starts_the_flow_like_a_menu_tap(recorded) -> None:
    result = tools.run_tool(
        session=None, user=_farmer(), name="start_flow", arguments={"flow": "register_animal"}
    )

    assert result == {"status": "started", "flow": "register_animal", "ends_turn": True}
    assert recorded.flow_starts == [PHONE]
    assert recorded.saved == [("assistant", "[Flow started: register_animal]")]


def test_start_flow_reports_a_failed_send(recorded) -> None:
    recorded.flow_start_result = False

    result = tools.run_tool(
        session=None, user=_farmer(), name="start_flow", arguments={"flow": "register_animal"}
    )

    assert result["status"] == "error"
    assert recorded.saved == []


def test_start_flow_refuses_flows_the_agent_may_not_start(recorded) -> None:
    result = tools.run_tool(
        session=None, user=_farmer(), name="start_flow", arguments={"flow": "onboarding"}
    )

    assert result["status"] == "error"
    assert recorded.flow_starts == []


def test_unknown_tool_is_an_error(recorded) -> None:  # noqa: ARG001
    result = tools.run_tool(session=None, user=_farmer(), name="delete_everything", arguments={})

    assert result["status"] == "error"


def test_start_flow_sends_the_animal_list(recorded) -> None:
    result = tools.run_tool(
        session=None, user=_farmer(), name="start_flow", arguments={"flow": "my_animals"}
    )

    assert result == {"status": "started", "flow": "my_animals", "ends_turn": True}
    assert recorded.flow_starts == [PHONE]
    assert recorded.saved == [("assistant", "[Flow started: my_animals]")]


def test_start_flow_starts_recording_a_death(recorded) -> None:
    result = tools.run_tool(
        session=None, user=_farmer(), name="start_flow", arguments={"flow": "record_death"}
    )

    assert result == {"status": "started", "flow": "record_death", "ends_turn": True}
    assert recorded.flow_starts == [PHONE]


def test_start_flow_starts_recording_a_birth(recorded) -> None:
    result = tools.run_tool(
        session=None, user=_farmer(), name="start_flow", arguments={"flow": "record_birth"}
    )

    assert result == {"status": "started", "flow": "record_birth", "ends_turn": True}
    assert recorded.flow_starts == [PHONE]


def test_start_flow_starts_reporting_sickness(recorded) -> None:
    result = tools.run_tool(
        session=None, user=_farmer(), name="start_flow", arguments={"flow": "report_sickness"}
    )

    assert result == {"status": "started", "flow": "report_sickness", "ends_turn": True}
    assert recorded.flow_starts == [PHONE]


# ---------------------------------------------------------------------------
# submit_symptoms
# ---------------------------------------------------------------------------


@pytest.fixture
def symptom_checks(monkeypatch: pytest.MonkeyPatch, recorded) -> SimpleNamespace:  # noqa: ARG001
    checks = SimpleNamespace(state=None, started=[])

    def fake_triage_start(self, *, phone, user, session, livestock_id, problem_description):  # noqa: ARG001
        checks.started.append((livestock_id, problem_description))
        return True

    monkeypatch.setattr("app.assistant.state.get_active_state", lambda **kwargs: checks.state)
    monkeypatch.setattr("app.flows.report_sickness_context.TriageContextFlow.start", fake_triage_start)
    return checks


def test_submit_symptoms_starts_the_sickness_check(symptom_checks, recorded) -> None:
    animal_id = uuid.uuid4()
    symptom_checks.state = SimpleNamespace(
        flow="report_sickness", step="describe_symptoms", data={"animal_id": str(animal_id)}
    )
    user = _farmer()

    result = tools.run_tool(
        session=None, user=user, name="submit_symptoms", arguments={"symptoms": " not eating, weak "}
    )

    assert result == {"status": "submitted", "ends_turn": True}
    assert symptom_checks.started == [(animal_id, "not eating, weak")]
    assert recorded.saved == [("assistant", "[Symptoms submitted]")]


@pytest.mark.parametrize(
    "state",
    [None, SimpleNamespace(flow="report_sickness", step="pick_animal"), SimpleNamespace(flow="record_birth", step="describe_symptoms")],
)
def test_submit_symptoms_is_refused_when_not_waiting_for_them(symptom_checks, state) -> None:
    symptom_checks.state = state

    result = tools.run_tool(
        session=None, user=_farmer(), name="submit_symptoms", arguments={"symptoms": "coughing"}
    )

    assert result["status"] == "error"
    assert symptom_checks.started == []


# ---------------------------------------------------------------------------
# set_language
# ---------------------------------------------------------------------------


def test_set_language_saves_the_farmers_language() -> None:
    user = _farmer()
    user.preferred_language = "english"
    session = MagicMock()

    result = tools.run_tool(session=session, user=user, name="set_language", arguments={"language": "shona"})

    assert result == {"status": "saved", "language": "shona"}
    assert user.preferred_language == "shona"
    session.commit.assert_called_once()


def test_set_language_refuses_unsupported_languages() -> None:
    user = _farmer()
    user.preferred_language = "english"
    session = MagicMock()

    result = tools.run_tool(session=session, user=user, name="set_language", arguments={"language": "french"})

    assert result["status"] == "error"
    assert user.preferred_language == "english"
    session.commit.assert_not_called()
