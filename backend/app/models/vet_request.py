import uuid
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

RequestStatus = Literal["pending", "assigned", "in_review", "completed", "cancelled"]
UrgencyLevel = Literal["low", "medium", "high", "emergency"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all vet request schemas
# ---------------------------------------------------------------------------


class VetRequestBase(SQLModel):
    urgency: UrgencyLevel = "medium"
    farmer_notes: str | None = Field(default=None)


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------


class VetRequestCreate(VetRequestBase):
    livestock_id: uuid.UUID
    farm_id: uuid.UUID
    farmer_id: uuid.UUID


class VetRequestSubmit(SQLModel):
    """Body accepted from the farmer when submitting a new vet request."""

    livestock_id: uuid.UUID
    vet_id: uuid.UUID
    urgency: UrgencyLevel = "medium"
    farmer_notes: str | None = None


class VetRequestUpdate(SQLModel):
    status: RequestStatus | None = None
    urgency: UrgencyLevel | None = None
    farmer_notes: str | None = None
    vet_id: uuid.UUID | None = None
    assigned_at: datetime | None = None
    completed_at: datetime | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------


class VetRequest(VetRequestBase, table=True):
    __tablename__ = "vet_request"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    livestock_id: uuid.UUID = Field(foreign_key="livestock.id")
    farm_id: uuid.UUID = Field(foreign_key="farm.id")
    farmer_id: uuid.UUID = Field(foreign_key="user.id")
    vet_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    status: str = "pending"
    urgency: str = "medium"  # type: ignore[assignment]
    submitted_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )
    assigned_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    completed_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )


# ---------------------------------------------------------------------------
# Read schemas (output)
# ---------------------------------------------------------------------------


class VetRequestPublic(VetRequestBase):
    id: uuid.UUID
    livestock_id: uuid.UUID
    farm_id: uuid.UUID
    farmer_id: uuid.UUID
    vet_id: uuid.UUID | None = None
    status: RequestStatus
    submitted_at: datetime
    assigned_at: datetime | None = None
    completed_at: datetime | None = None
    updated_at: datetime | None = None


class VetRequestsPublic(SQLModel):
    data: list[VetRequestPublic]
    count: int
