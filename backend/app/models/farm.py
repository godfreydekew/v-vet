import uuid
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

FarmType = Literal["livestock", "dairy", "poultry", "mixed", "crop"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all farm schemas
# ---------------------------------------------------------------------------


class FarmBase(SQLModel):
    name: str = Field(max_length=150)
    farm_type: FarmType
    address: str | None = Field(default=None)
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    size_hectares: float | None = Field(default=None)
    description: str | None = Field(default=None)
    is_active: bool = True


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------


class FarmCreate(FarmBase):
    farmer_id: uuid.UUID


class FarmUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=150)
    farm_type: FarmType | None = None
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    size_hectares: float | None = None
    description: str | None = None
    is_active: bool | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------


class Farm(FarmBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    farmer_id: uuid.UUID = Field(foreign_key="user.id")
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    farm_type: str  # type: ignore[assignment]
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


class FarmPublic(FarmBase):
    id: uuid.UUID
    farmer_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None


class FarmsPublic(SQLModel):
    data: list[FarmPublic]
    count: int
