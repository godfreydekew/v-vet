"""generate_structured passes messages to OpenAI and returns the parsed object."""

from types import SimpleNamespace

import pytest

from app.assistant import client
from app.assistant.guest.schemas import GuestReply


class FakeResponses:
    def __init__(self, output_parsed: GuestReply | None) -> None:
        self.output_parsed = output_parsed
        self.calls: list[dict] = []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(output_parsed=self.output_parsed)


def _use_fake(monkeypatch: pytest.MonkeyPatch, output_parsed: GuestReply | None) -> FakeResponses:
    fake_responses = FakeResponses(output_parsed)
    monkeypatch.setattr(client, "_client", SimpleNamespace(responses=fake_responses))
    return fake_responses


def test_messages_are_sent_and_parsed_answer_returned(monkeypatch) -> None:
    answer = GuestReply(intent="greeting", language="english", reply="Hello!")
    fake_responses = _use_fake(monkeypatch, answer)

    result = client.generate_structured(
        system_prompt="Be kind.",
        messages=[
            {"role": "developer", "content": "First message."},
            {"role": "user", "content": "Hi"},
        ],
        output_type=GuestReply,
    )

    assert result == answer
    call = fake_responses.calls[0]
    assert call["instructions"] == "Be kind."
    assert call["text_format"] is GuestReply
    assert call["input"] == [
        {"role": "developer", "content": "First message."},
        {"role": "user", "content": "Hi"},
    ]


def test_no_parsed_output_raises(monkeypatch) -> None:
    _use_fake(monkeypatch, None)

    with pytest.raises(client.AIResponseError):
        client.generate_structured(
            system_prompt="Be kind.",
            messages=[{"role": "user", "content": "Hi"}],
            output_type=GuestReply,
        )


# ---------------------------------------------------------------------------
# generate_with_tools
# ---------------------------------------------------------------------------


class FakeToolResponses:
    """Answers with a tool call first, then with text once the tool's result comes back."""

    def __init__(self) -> None:
        self.calls: list[dict] = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if len(self.calls) == 1:
            tool_call = SimpleNamespace(
                type="function_call", name="send_menu", arguments='{"message": "Hi"}', call_id="call-1"
            )
            return SimpleNamespace(id="resp-1", output=[tool_call], output_text="")
        return SimpleNamespace(id="resp-2", output=[], output_text="  Here is the menu.  ")


def test_generate_with_tools_runs_tools_then_returns_reply(monkeypatch) -> None:
    fake_responses = FakeToolResponses()
    monkeypatch.setattr(client, "_client", SimpleNamespace(responses=fake_responses))
    tool_runs: list[tuple[str, dict]] = []

    def run_tool(name, arguments):
        tool_runs.append((name, arguments))
        return {"status": "sent"}

    reply = client.generate_with_tools(
        system_prompt="Be kind.",
        messages=[{"role": "user", "content": "hello"}],
        tools=[],
        run_tool=run_tool,
    )

    assert reply == "Here is the menu."
    assert tool_runs == [("send_menu", {"message": "Hi"})]
    second_call = fake_responses.calls[1]
    assert second_call["previous_response_id"] == "resp-1"
    assert second_call["instructions"] == "Be kind."
    assert second_call["input"] == [
        {"type": "function_call_output", "call_id": "call-1", "output": '{"status": "sent"}'}
    ]


def test_generate_with_tools_without_tool_calls_returns_text(monkeypatch) -> None:
    fake_responses = FakeToolResponses()
    fake_responses.calls.append({})  # skip the tool-call answer
    monkeypatch.setattr(client, "_client", SimpleNamespace(responses=fake_responses))

    reply = client.generate_with_tools(
        system_prompt="Be kind.",
        messages=[{"role": "user", "content": "hello"}],
        tools=[],
        run_tool=lambda name, arguments: {},
    )

    assert reply == "Here is the menu."


def test_generate_with_tools_stops_when_a_tool_ends_the_turn(monkeypatch) -> None:
    fake_responses = FakeToolResponses()
    monkeypatch.setattr(client, "_client", SimpleNamespace(responses=fake_responses))

    reply = client.generate_with_tools(
        system_prompt="Be kind.",
        messages=[{"role": "user", "content": "I want to register my cow"}],
        tools=[],
        run_tool=lambda name, arguments: {"status": "started", "ends_turn": True},
    )

    assert reply == ""
    # Only the first call: the tool result is not sent back to the model.
    assert len(fake_responses.calls) == 1
