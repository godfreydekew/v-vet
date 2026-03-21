import uuid
from datetime import date, datetime, timezone
from typing import Literal

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


AdministeredBy = Literal["farmer", "vet", "other"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all treatment schemas
# ---------------------------------------------------------------------------

class TreatmentBase(SQLModel):
    treatment_name: str = Field(max_length=150)
    drug_used: str | None = Field(default=None, max_length=150)
    dosage: str | None = Field(default=None, max_length=100)
    date_given: date
    administered_by: AdministeredBy
    outcome_notes: str | None = Field(default=None)


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------

class TreatmentCreate(TreatmentBase):
    livestock_id: uuid.UUID
    logged_by: uuid.UUID


class TreatmentUpdate(SQLModel):
    treatment_name: str | None = Field(default=None, max_length=150)
    drug_used: str | None = Field(default=None, max_length=150)
    dosage: str | None = Field(default=None, max_length=100)
    date_given: date | None = None
    administered_by: AdministeredBy | None = None
    outcome_notes: str | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------

class Treatment(TreatmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    livestock_id: uuid.UUID = Field(foreign_key="livestock.id")
    logged_by: uuid.UUID = Field(foreign_key="user.id")
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    administered_by: str
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),
    )


# ---------------------------------------------------------------------------
# Read schemas (output)
# ---------------------------------------------------------------------------

class TreatmentPublic(TreatmentBase):
    id: uuid.UUID
    livestock_id: uuid.UUID
    logged_by: uuid.UUID
    created_at: datetime


class TreatmentsPublic(SQLModel):
    data: list[TreatmentPublic]
    count: int
