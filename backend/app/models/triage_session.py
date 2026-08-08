import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, JSON
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TriageSession(SQLModel, table=True):
    """
    In-flight state for the deterministic "basic context" questionnaire
    (Step 2 of the triage spec — docs/V-VET triage flow and district codes.md).
    """

    __tablename__ = "triage_session"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    whatsapp_user_id: uuid.UUID = Field(foreign_key="whatsapp_user.id", index=True)
    livestock_id: uuid.UUID = Field(foreign_key="livestock.id", index=True)

    current_question_id: str | None = Field(default=None, max_length=64)
    answers: dict = Field(default_factory=dict, sa_column=Column(JSON))

    is_completed: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )
    # Set by a Postgres trigger (trg_triage_session_updated_at), not app code.
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
    )
    # Set when a follow-up reminder is sent; cleared on the next answer.
    reminded_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
    )
