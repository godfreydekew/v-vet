from datetime import date
from typing import Any, Literal

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class FlowForm(SQLModel):
    @field_validator("*", mode="before")
    @classmethod
    def empty_text_to_none(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip() or None
        return value


class OnboardingForm(FlowForm):
    full_name: str
    district: str
    preferred_language: Literal["english", "shona", "ndebele"]
    main_goal: str
    animal_count: int | None = Field(default=None, ge=0)


class RegisterAnimalForm(FlowForm):
    name: str | None = None
    breed: str | None = None
    gender: Literal["male", "female", "unknown"] | None = None
    weight_kg: float | None = Field(default=None, gt=0)
    date_of_birth: date | None = None
    animal_photo: Any = None
