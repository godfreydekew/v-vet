"""The farmer agent's message handling, with the model, the context and WhatsApp replaced by fakes."""

from types import SimpleNamespace

import pytest

from app.assistant.farmer import agent
from app.models.whatsapp import IncomingMessage, WhatsAppUser

PHONE = "263771234567"


@pytest.fixture
def fakes(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    recorded = SimpleNamespace(saved=[], sent=[], model_calls=[], reply="Hello Tendai!", error=None)

    def fake_generate_with_tools(*, system_prompt, messages, tools, run_tool):  # noqa: ARG001
        recorded.model_calls.append({"system_prompt": system_prompt, "messages": messages})
        if recorded.error is not None:
            raise recorded.error
        return recorded.reply

    history = [
        SimpleNamespace(role="assistant", content="Welcome!"),
        SimpleNamespace(role="farmer", content="hi"),
    ]
    monkeypatch.setattr(agent, "generate_with_tools", fake_generate_with_tools)
    monkeypatch.setattr(agent, "build_farmer_context", lambda **kwargs: "# Herd\nBessie")
    monkeypatch.setattr(agent, "get_conversation_history", lambda **kwargs: history)
    monkeypatch.setattr(
        agent, "save_message", lambda *, session, user, role, content: recorded.saved.append((role, content))  # noqa: ARG005
    )
    monkeypatch.setattr(
        agent, "send_text", lambda *, session, user, text: recorded.sent.append(text)  # noqa: ARG005
    )
    return recorded


def _handle(text: str) -> None:
    user = WhatsAppUser(phone=PHONE, hashed_password="x", is_fully_onboarded=True)
    message = IncomingMessage(message_id="wamid.1", phone=PHONE, message_type="text", text=text, button_id=None)
    agent.handle_farmer_message(session=None, user=user, message=message)


def test_message_is_saved_answered_and_sent(fakes) -> None:
    _handle("hi")

    assert fakes.saved == [("farmer", "hi")]
    assert fakes.sent == ["Hello Tendai!"]
    call = fakes.model_calls[0]
    assert call["system_prompt"].startswith(agent.FARMER_INSTRUCTIONS)
    assert call["system_prompt"].endswith("# Herd\nBessie")
    assert call["messages"] == [
        {"role": "assistant", "content": "Welcome!"},
        {"role": "user", "content": "hi"},
    ]


def test_empty_reply_sends_nothing(fakes) -> None:
    fakes.reply = ""

    _handle("I want to register my cow")

    assert fakes.sent == []


def test_model_failure_sends_an_apology(fakes) -> None:
    fakes.error = RuntimeError("OpenAI is down")

    _handle("hi")

    assert fakes.sent == [agent.FAILED_MESSAGE]


def test_prompt_contains_the_fact_sheet() -> None:
    assert "{fact_sheet}" not in agent.FARMER_INSTRUCTIONS
    assert "## Cost" in agent.FARMER_INSTRUCTIONS
