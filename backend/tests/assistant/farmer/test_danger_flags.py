"""detect_danger_flags, with the model call replaced by a fake."""

from typing import get_args

import pytest

from app.assistant.farmer import danger_flags
from app.assistant.farmer.danger_flags import (
    DangerFlag,
    DangerFlags,
    detect_danger_flags,
)
from app.services.triage import DANGER_FLAG_LABELS


def test_returns_the_flags_the_model_found(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[str] = []

    def fake_generate_structured(*, system_prompt, messages, output_type):  # noqa: ARG001
        calls.append(messages[0]["content"])
        return DangerFlags(danger_flags=["cannot_stand", "breathing_difficulty"])

    monkeypatch.setattr(danger_flags, "generate_structured", fake_generate_structured)

    assert detect_danger_flags(symptoms="she is down and gasping") == ["cannot_stand", "breathing_difficulty"]
    assert calls == ["she is down and gasping"]


def test_empty_description_skips_the_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(danger_flags, "generate_structured", lambda **kwargs: pytest.fail("model called"))

    assert detect_danger_flags(symptoms="   ") == []


def test_every_flag_has_a_label_for_farmers() -> None:
    assert set(get_args(DangerFlag)) == set(DANGER_FLAG_LABELS)
