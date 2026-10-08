from typing import Any, Literal

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class OnboardingForm(SQLModel):
    full_name: str
    district: str
    preferred_language: Literal["english", "shona", "ndebele"]
    main_goal: str
    animal_count: int | None = Field(default=None, ge=0)

    @field_validator("*", mode="before")
    @classmethod
    def empty_text_to_none(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip() or None
        return value
