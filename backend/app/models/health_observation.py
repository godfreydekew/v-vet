import uuid
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


AppetiteLevel = Literal["normal", "reduced", "poor", "absent"]
ActivityLevel = Literal["normal", "lethargic", "restless", "aggressive"]
MilkProduction = Literal["normal", "decreased", "stopped", "not_applicable"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all health observation schemas
# ---------------------------------------------------------------------------

class HealthObservationBase(SQLModel):
    body_temp_celsius: float | None = Field(default=None)
    heart_rate_bpm: int | None = Field(default=None)
    respiratory_rate: int | None = Field(default=None)
    appetite_level: AppetiteLevel | None = None
    activity_level: ActivityLevel | None = None
    symptoms: str | None = Field(default=None)
    symptom_duration_days: int | None = Field(default=None)
    milk_production: MilkProduction | None = None
    notes: str | None = Field(default=None)


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------

class HealthObservationCreate(HealthObservationBase):
    livestock_id: uuid.UUID
    logged_by: uuid.UUID


class HealthObservationUpdate(SQLModel):
    body_temp_celsius: float | None = None
    heart_rate_bpm: int | None = None
    respiratory_rate: int | None = None
    appetite_level: AppetiteLevel | None = None
    activity_level: ActivityLevel | None = None
    symptoms: str | None = None
    symptom_duration_days: int | None = None
    milk_production: MilkProduction | None = None
    notes: str | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------

class HealthObservation(HealthObservationBase, table=True):
    __tablename__ = "health_observation"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    livestock_id: uuid.UUID = Field(foreign_key="livestock.id")
    logged_by: uuid.UUID = Field(foreign_key="user.id")
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    appetite_level: str | None = None
    activity_level: str | None = None
    milk_production: str | None = None
    observed_at: datetime = Field(
        default_factory=_utcnow,
        sa_type=DateTime(timezone=True),
    )


# ---------------------------------------------------------------------------
# Read schemas (output)
# ---------------------------------------------------------------------------

class HealthObservationPublic(HealthObservationBase):
    id: uuid.UUID
    livestock_id: uuid.UUID
    logged_by: uuid.UUID
    observed_at: datetime


class HealthObservationsPublic(SQLModel):
    data: list[HealthObservationPublic]
    count: int
