import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LivestockImageBase(SQLModel):
    image_url: str = Field(max_length=1024)
    ai_analysis: str | None = Field(default=None)
    is_primary: bool = Field(default=False)


class LivestockImageCreate(LivestockImageBase):
    pass


class LivestockImageUpdate(SQLModel):
    image_url: str | None = Field(default=None, max_length=1024)
    ai_analysis: str | None = None
    is_primary: bool | None = None


class LivestockImage(LivestockImageBase, table=True):
    __tablename__ = "livestock_image"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    livestock_id: uuid.UUID = Field(foreign_key="livestock.id")
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True)),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
    )
    is_primary: bool = Field(default=False, sa_column=Column(Boolean, nullable=False))


class LivestockImagePublic(LivestockImageBase):
    id: uuid.UUID
    livestock_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None


class LivestockImagesPublic(SQLModel):
    data: list[LivestockImagePublic]
    count: int
