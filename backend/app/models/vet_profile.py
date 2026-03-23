import uuid
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

AvailabilityStatus = Literal["available", "busy", "unavailable"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all vet profile schemas
# ---------------------------------------------------------------------------


class VetProfileBase(SQLModel):
    licence_number: str | None = Field(default=None, max_length=100)
    specialisations: str | None = Field(default=None, max_length=255)
    years_experience: int | None = Field(default=None)
    availability_status: AvailabilityStatus = "available"


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------


class VetProfileCreate(VetProfileBase):
    user_id: uuid.UUID


class VetProfileUpdate(SQLModel):
    licence_number: str | None = Field(default=None, max_length=100)
    specialisations: str | None = Field(default=None, max_length=255)
    years_experience: int | None = None
    availability_status: AvailabilityStatus | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------


class VetProfile(VetProfileBase, table=True):
    __tablename__ = "vet_profile"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", unique=True)
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    availability_status: str = "available"  # type: ignore[assignment]
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )


# ---------------------------------------------------------------------------
# Read schemas (output)
# ---------------------------------------------------------------------------


class VetProfilePublic(VetProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None
