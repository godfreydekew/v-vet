import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class HealthObservationFollowUp(SQLModel, table=True):
    """
    A scheduled 24h/48h outcome check-in for one specific HealthObservation —
    not the animal in general, since the same animal can have multiple
    reports. description is shown in the actual WhatsApp check-in message,
    so it stays unambiguous which report is being followed up on.
    """

    __tablename__ = "health_observation_follow_up"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    health_observation_id: uuid.UUID = Field(foreign_key="health_observation.id", index=True)
    livestock_id: uuid.UUID = Field(foreign_key="livestock.id", index=True)
    whatsapp_user_id: uuid.UUID = Field(foreign_key="whatsapp_user.id", index=True)

    description: str = Field(max_length=500)
    due_at: datetime = Field(sa_column=Column(DateTime(timezone=True)))
    status: str = Field(default="pending", max_length=20)  # pending | sent | resolved
    outcome: str | None = Field(default=None, max_length=20)  # better | same | worse

    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )
    sent_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    resolved_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
