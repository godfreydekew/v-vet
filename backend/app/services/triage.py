from dataclasses import dataclass
from typing import Literal

UrgencyLevel = Literal["Emergency", "Urgent", "Prompt Review", "Routine"]

DANGER_FLAG_LABELS = {
    "cannot_stand": "Cannot stand or get up",
    "breathing_difficulty": "Breathing very fast or struggling to breathe",
    "seizures_unconscious": "Having fits, seizures, or unconscious",
    "heavy_bleeding": "Heavy or uncontrolled bleeding",
    "calving_emergency": "Difficulty giving birth",
    "multiple_sudden_deaths": "Multiple animals sick or sudden deaths",
    "severe_bloat": "Severe swelling on left side of abdomen",
}


@dataclass
class TriageResult:
    urgency_level: UrgencyLevel
    requires_vet: bool
    danger_flags: list[str]
    summary_text: str
    recommendation_text: str


def evaluate_triage(
    *,
    symptoms: str | None = None,
    danger_flags: list[str] | None = None,
    symptom_duration_days: int | None = None,
    trend: str | None = None,
    recent_calving: bool = False,
) -> TriageResult:
    """Evaluates symptoms, danger screen inputs, and situational context to produce a triage result.

    Implements the simplified V-Vet prototype decision logic. symptom_duration_days must
    already be a whole number of days — converting phrases like "a week" or "a month"
    into a day count is the calling agent's job, not this function's.
    """
    flags = [f.strip().lower() for f in (danger_flags or []) if f.strip()]
    sym_lower = (symptoms or "").lower()

    # Detect additional danger keywords from natural language text
    if "cannot stand" in sym_lower or "cant stand" in sym_lower or "unable to stand" in sym_lower or "downer" in sym_lower:
        if "cannot_stand" not in flags:
            flags.append("cannot_stand")
    if "struggling to breathe" in sym_lower or "can't breathe" in sym_lower or "open mouth breathing" in sym_lower:
        if "breathing_difficulty" not in flags:
            flags.append("breathing_difficulty")
    if "seizure" in sym_lower or "fit" in sym_lower or "unconscious" in sym_lower or "passed out" in sym_lower:
        if "seizures_unconscious" not in flags:
            flags.append("seizures_unconscious")
    if "bleeding" in sym_lower or "blood gushing" in sym_lower:
        if "heavy_bleeding" not in flags:
            flags.append("heavy_bleeding")

    # 1. EMERGENCY evaluation
    if flags:
        urgency = "Emergency"
        requires_vet = True
        flag_names = ", ".join([DANGER_FLAG_LABELS.get(f, f) for f in flags])
        rec = (
            f"🚨 *CRITICAL ALERT*: Your animal shows critical danger signs ({flag_names}). "
            "Please seek immediate emergency help from a local veterinary officer or animal health worker right now. "
            "Keep the animal in a safe, quiet, shaded area and do not force it to walk."
        )
        return TriageResult(
            urgency_level=urgency,
            requires_vet=requires_vet,
            danger_flags=flags,
            summary_text=f"Emergency: Critical danger flags identified ({flag_names}).",
            recommendation_text=rec,
        )

    # 2. URGENT evaluation
    is_worsening = trend and trend.lower() in ("worsening", "worse")
    not_eating_weak = "not eating" in sym_lower or "weak" in sym_lower or "reduced appetite" in sym_lower

    if (is_worsening and not_eating_weak) or recent_calving or "fever" in sym_lower or "diarrhea" in sym_lower or "diarrhoea" in sym_lower:
        urgency = "Urgent"
        requires_vet = True
        rec = (
            "⚠️ *URGENT CARE RECOMMENDED*: Based on the symptoms described, this condition is deteriorating or requires timely veterinary assessment. "
            "Please contact a local veterinary officer as soon as possible. "
            "Ensure the animal has access to fresh water, shade, and rest while waiting for assessment."
        )
        return TriageResult(
            urgency_level=urgency,
            requires_vet=requires_vet,
            danger_flags=flags,
            summary_text="Urgent: Worsening symptoms or high risk factors detected.",
            recommendation_text=rec,
        )

    # 3. PROMPT REVIEW evaluation (e.g. sick 3+ days, or lameness/swelling)
    if (symptom_duration_days is not None and symptom_duration_days >= 3) or "lame" in sym_lower or "limping" in sym_lower or "swelling" in sym_lower:
        urgency = "Prompt Review"
        requires_vet = False
        rec = (
            "📋 *PROMPT MONITORING*: The animal is currently stable but requires close monitoring. "
            "Keep an eye on its eating, drinking, and movement over the next 24-48 hours. "
            "If the condition worsens or does not improve, please consult a veterinary officer."
        )
        return TriageResult(
            urgency_level=urgency,
            requires_vet=requires_vet,
            danger_flags=flags,
            summary_text="Prompt Review: Stable condition, monitor closely.",
            recommendation_text=rec,
        )

    # 4. ROUTINE evaluation
    urgency = "Routine"
    requires_vet = False
    rec = (
        "✅ *ROUTINE CARE*: No immediate danger flags detected. "
        "Continue providing routine feed, water, and shelter. "
        "Log any new changes if symptoms develop."
    )
    return TriageResult(
        urgency_level=urgency,
        requires_vet=requires_vet,
        danger_flags=flags,
        summary_text="Routine: Normal / low risk observation.",
        recommendation_text=rec,
    )
