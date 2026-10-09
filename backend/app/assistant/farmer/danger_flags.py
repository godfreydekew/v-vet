from typing import Literal

from pydantic import BaseModel, Field

from app.assistant.client import generate_structured

DangerFlag = Literal[
    "cannot_stand",
    "breathing_difficulty",
    "seizures_unconscious",
    "heavy_bleeding",
    "calving_emergency",
    "multiple_sudden_deaths",
    "severe_bloat",
]

_INSTRUCTIONS = (
    "You are a veterinary triage classifier for livestock in sub-Saharan Africa. "
    "Read the farmer's description of their animal's symptoms (any phrasing, any "
    "level of detail, possibly informal) and identify which of the fixed danger "
    "signs are actually present. Farmers describe the same danger sign many "
    "different ways (e.g. 'she can't get up', 'down and won't rise', 'struggling "
    "for air', 'gasping'), so match on meaning, not exact wording. Err toward "
    "flagging when uncertain: missing a real danger sign is worse than flagging "
    "one that turns out mild. Only report a flag the farmer's own words genuinely "
    "describe; do not invent signs they didn't mention."
)


class DangerFlags(BaseModel):
    danger_flags: list[DangerFlag] = Field(
        description="Danger signs actually described. Empty list if none apply."
    )


def detect_danger_flags(*, symptoms: str) -> list[str]:
    """The danger signs present in the farmer's description, e.g. ["cannot_stand"]."""
    if not symptoms.strip():
        return []

    result = generate_structured(
        system_prompt=_INSTRUCTIONS,
        messages=[{"role": "user", "content": symptoms}],
        output_type=DangerFlags,
    )
    return list(result.danger_flags)
