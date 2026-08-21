import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LivestockParentage(SQLModel, table=True):
    """
    Family tree — one row per animal born through record_birth, linking it
    to its mother. Father id not required yet
    """

    __tablename__ = "livestock_parentage"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    child_id: uuid.UUID = Field(foreign_key="livestock.id", unique=True, index=True)
    mother_id: uuid.UUID = Field(foreign_key="livestock.id", index=True)
    father_id: uuid.UUID | None = Field(default=None, foreign_key="livestock.id", index=True)

    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )
