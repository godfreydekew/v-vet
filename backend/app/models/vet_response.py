import uuid
from datetime import date, datetime, timezone
from typing import Literal

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

ResponseType = Literal["accept", "accept_supplement", "rediagnose"]
ConfidenceLevel = Literal["low", "medium", "high"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Base — shared columns across all vet response schemas
# ---------------------------------------------------------------------------


class VetResponseBase(SQLModel):
    response_type: ResponseType
    diagnosis: str | None = Field(default=None)
    treatment_recommendation: str | None = Field(default=None)
    drug_name: str | None = Field(default=None, max_length=150)
    dosage: str | None = Field(default=None, max_length=100)
    confidence_level: ConfidenceLevel = "high"
    follow_up_required: bool = False
    follow_up_date: date | None = None
    vet_notes: str | None = Field(default=None)


# ---------------------------------------------------------------------------
# Write schemas (input)
# ---------------------------------------------------------------------------


class VetResponseCreate(VetResponseBase):
    vet_request_id: uuid.UUID
    vet_id: uuid.UUID


class VetResponseUpdate(SQLModel):
    response_type: ResponseType | None = None
    diagnosis: str | None = None
    treatment_recommendation: str | None = None
    drug_name: str | None = Field(default=None, max_length=150)
    dosage: str | None = Field(default=None, max_length=100)
    confidence_level: ConfidenceLevel | None = None
    follow_up_required: bool | None = None
    follow_up_date: date | None = None
    vet_notes: str | None = None


# ---------------------------------------------------------------------------
# Database table model
# ---------------------------------------------------------------------------


class VetResponse(VetResponseBase, table=True):
    __tablename__ = "vet_response"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    vet_request_id: uuid.UUID = Field(foreign_key="vet_request.id", unique=True)
    vet_id: uuid.UUID = Field(foreign_key="user.id")
    # Literal → str: SQLAlchemy doesn't understand Literal types.
    response_type: str  # type: ignore[assignment]
    confidence_level: str = "high"  # type: ignore[assignment]
    responded_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )


# ---------------------------------------------------------------------------
# Read schemas (output)
# ---------------------------------------------------------------------------


class VetResponsePublic(VetResponseBase):
    id: uuid.UUID
    vet_request_id: uuid.UUID
    vet_id: uuid.UUID
    responded_at: datetime
