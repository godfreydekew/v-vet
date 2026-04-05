import uuid
from datetime import date, datetime, timezone
from typing import Literal

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

Species = Literal["cattle", "sheep", "goat", "poultry", "pig", "other"]
Gender = Literal["male", "female", "unknown"]
HealthStatus = Literal["healthy", "sick", "recovering", "deceased"]
LifecycleStatus = Literal[
    "active",
    "sold",
    "deceased",
    "transferred",
    "slaughtered",
    "missing",
    "other",
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all livestock schemas
# ---------------------------------------------------------------------------


class LivestockBase(SQLModel):
    name: str | None = Field(default=None, max_length=100)
    tag_number: str | None = Field(default=None, max_length=50)
    species: Species
    breed: str | None = Field(default=None, max_length=100)
    gender: Gender | None = None
    weight_kg: float | None = Field(default=None)
    date_of_birth: date | None = None
    acquired_date: date | None = None
    health_status: HealthStatus = "healthy"
    lifecycle_status: LifecycleStatus = "active"
    notes: str | None = Field(default=None)
    image_url: str | None = Field(default=None)


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------


class LivestockCreate(LivestockBase):
    farm_id: uuid.UUID


class LivestockUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=100)
    tag_number: str | None = Field(default=None, max_length=50)
    species: Species | None = None
    breed: str | None = Field(default=None, max_length=100)
    gender: Gender | None = None
    weight_kg: float | None = None
    date_of_birth: date | None = None
    acquired_date: date | None = None
    health_status: HealthStatus | None = None
    lifecycle_status: LifecycleStatus | None = None
    notes: str | None = None
    image_url: str | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------


class Livestock(LivestockBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    farm_id: uuid.UUID = Field(foreign_key="farm.id")
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    species: str  # type: ignore[assignment]
    gender: str | None = None  # type: ignore[assignment]
    health_status: str = "healthy"  # type: ignore[assignment]
    lifecycle_status: str = "active"  # type: ignore[assignment]
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


class LivestockPublic(LivestockBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None


class LivestocksPublic(SQLModel):
    data: list[LivestockPublic]
    count: int
