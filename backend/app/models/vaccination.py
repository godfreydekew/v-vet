import uuid
from datetime import date, datetime, timezone
from typing import Literal

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

AdministeredBy = Literal["farmer", "vet", "other"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all vaccination schemas
# ---------------------------------------------------------------------------


class VaccinationBase(SQLModel):
    vaccine_name: str = Field(max_length=150)
    date_given: date
    administered_by: AdministeredBy
    next_due_date: date | None = None
    notes: str | None = Field(default=None)


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------


class VaccinationCreate(VaccinationBase):
    livestock_id: uuid.UUID
    logged_by: uuid.UUID


class VaccinationUpdate(SQLModel):
    vaccine_name: str | None = Field(default=None, max_length=150)
    date_given: date | None = None
    administered_by: AdministeredBy | None = None
    next_due_date: date | None = None
    notes: str | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------


class Vaccination(VaccinationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    livestock_id: uuid.UUID = Field(foreign_key="livestock.id")
    logged_by: uuid.UUID = Field(foreign_key="user.id")
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    administered_by: str  # type: ignore[assignment]
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )


# ---------------------------------------------------------------------------
# Read schemas (output)
# ---------------------------------------------------------------------------


class VaccinationPublic(VaccinationBase):
    id: uuid.UUID
    livestock_id: uuid.UUID
    logged_by: uuid.UUID
    created_at: datetime


class VaccinationsPublic(SQLModel):
    data: list[VaccinationPublic]
    count: int
