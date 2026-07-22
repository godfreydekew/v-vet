import pytest
from app.services.triage import evaluate_triage

def test_triage_emergency_cannot_stand():
    result = evaluate_triage(
        symptoms="Cow is lying down and cannot get up",
        danger_flags=["cannot_stand"],
    )
    assert result.urgency_level == "Emergency"
    assert result.requires_vet is True
    assert "cannot_stand" in result.danger_flags
    assert "CRITICAL ALERT" in result.recommendation_text
    assert "emergency" in result.recommendation_text.lower()


def test_triage_urgent_worsening_not_eating():
    result = evaluate_triage(
        symptoms="Not eating and seems weak",
        trend="worsening",
        symptom_duration_days=2,
    )
    assert result.urgency_level == "Urgent"
    assert result.requires_vet is True
    assert "URGENT CARE RECOMMENDED" in result.recommendation_text


def test_triage_routine():
    result = evaluate_triage(
        symptoms="Looks normal, just checking up",
        trend="stable",
    )
    assert result.urgency_level == "Routine"
    assert result.requires_vet is False
    assert "ROUTINE CARE" in result.recommendation_text
