import uuid
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel

WhatsAppMessageRole = Literal["farmer", "assistant"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# WhatsAppUser
# ---------------------------------------------------------------------------


class WhatsAppUserBase(SQLModel):
    phone: str = Field(max_length=20, index=True)
    full_name: str | None = Field(default=None, max_length=255)
    animal_count: int | None = Field(default=None)
    district: str | None = Field(default=None, max_length=255)
    preferred_language: str | None = Field(default=None, max_length=100)
    main_goal: str | None = Field(default=None, max_length=500)
    is_fully_onboarded: bool = Field(default=False)
    linked_user_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")


class WhatsAppUserCreate(SQLModel):
    """Used when a new phone number first messages the system."""

    phone: str = Field(max_length=20)
    full_name: str | None = Field(default=None, max_length=255)


class WhatsAppUserUpdate(SQLModel):
    """Partial update — used during onboarding to save individual answers."""

    full_name: str | None = None
    animal_count: int | None = None
    district: str | None = None
    preferred_language: str | None = None
    main_goal: str | None = None
    is_fully_onboarded: bool | None = None
    linked_user_id: uuid.UUID | None = None


class WhatsAppUser(WhatsAppUserBase, table=True):
    __tablename__ = "whatsapp_user"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    # Override base to add unique constraint on the table column.
    phone: str = Field(max_length=20, unique=True, index=True)  # type: ignore[assignment]
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )


class WhatsAppUserPublic(WhatsAppUserBase):
    id: uuid.UUID
    created_at: datetime
    linked_user_id: uuid.UUID | None = None


# ---------------------------------------------------------------------------
# WhatsAppMessage
# ---------------------------------------------------------------------------


class WhatsAppMessageBase(SQLModel):
    phone: str = Field(max_length=20)
    role: str = Field(max_length=20)  # "farmer" | "assistant"
    content: str


class WhatsAppMessageCreate(SQLModel):
    """Used in CRUD and service layer to persist a single message."""

    phone: str = Field(max_length=20)
    role: WhatsAppMessageRole
    content: str


class WhatsAppMessage(WhatsAppMessageBase, table=True):
    __tablename__ = "whatsapp_message"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="whatsapp_user.id", index=True)
    # role stored as plain str; validation happens at Create schema layer.
    role: str = Field(max_length=20)  # type: ignore[assignment]
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )


class WhatsAppMessagePublic(WhatsAppMessageBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


class WhatsAppMessagesPublic(SQLModel):
    data: list[WhatsAppMessagePublic]
    count: int
