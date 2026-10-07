import uuid
from datetime import datetime, timezone
from typing import Any, Literal

from sqlalchemy import JSON, Column, DateTime, Index, text
from sqlmodel import Field, SQLModel

# active    = the farmer is in this flow now (at most one per farmer)
# completed = the flow finished and the real record was saved
# abandoned = not finished: another flow was started, or nothing happened before expires_at
# failed    = something broke while saving (the details are in the logs)
ConversationStatus = Literal["active", "completed", "abandoned", "failed"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ConversationState(SQLModel, table=True):

    __tablename__ = "conversation_state"
    __table_args__ = (
        # A farmer can have only one active flow at a time.
        Index(
            "ix_conversation_state_one_active_per_user",
            "whatsapp_user_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    whatsapp_user_id: uuid.UUID = Field(
        foreign_key="whatsapp_user.id", index=True, ondelete="CASCADE"
    )
    flow: str = Field(max_length=50, index=True)
    step: str = Field(max_length=50)
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    status: str = Field(default="active", max_length=20)
    invalid_inputs: int = Field(default=0)
    started_at: datetime = Field(
        default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=_utcnow, sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    ended_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
