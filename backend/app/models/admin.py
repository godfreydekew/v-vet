import uuid
from datetime import datetime
from typing import Literal

from sqlmodel import SQLModel

FarmerStatus = Literal["onboarding", "active"]


class AdminFarmerRow(SQLModel):
    """One farmer as shown on the admin Farmers page and dashboard."""

    user_id: uuid.UUID | None = None
    whatsapp_user_id: uuid.UUID | None = None
    full_name: str | None = None
    phone_number: str | None = None
    email: str | None = None
    district: str | None = None
    address: str | None = None
    preferred_language: str | None = None
    status: FarmerStatus
    has_web_account: bool
    registered_at: datetime | None = None

    # Messages the farmer sent to V-Vet on WhatsApp (assistant replies not counted).
    message_count: int = 0
    messages_last_7_days: int = 0
    last_message_at: datetime | None = None

    farm_count: int = 0
    # Only animals still on the farm (lifecycle_status "active").
    animal_count: int = 0
    sick_count: int = 0


class AdminFarmersPublic(SQLModel):
    data: list[AdminFarmerRow]
    count: int
