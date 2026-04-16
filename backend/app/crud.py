import uuid
from typing import Any

from sqlmodel import Session, col, select

from app.core.security import get_password_hash, verify_password
from app.ai.gemma import analyze_livestock_image
from app.models import (
    Farm,
    FarmBase,
    FarmUpdate,
    Livestock,
    LivestockCreate,
    LivestockImage,
    LivestockImageCreate,
    LivestockImagePublic,
    LivestockPublic,
    LivestockUpdate,
    User,
    UserCreate,
    UserUpdate,
)
from app.models.whatsapp import (
    WhatsAppMessage,
    WhatsAppMessageCreate,
    WhatsAppUser,
    WhatsAppUserCreate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


# ---------------------------------------------------------------------------
# Farm
# ---------------------------------------------------------------------------


def create_farm(*, session: Session, farm_in: FarmBase, farmer_id: uuid.UUID) -> Farm:
    farm = Farm.model_validate(farm_in, update={"farmer_id": farmer_id})
    session.add(farm)
    session.commit()
    session.refresh(farm)
    return farm


def update_farm(*, session: Session, db_farm: Farm, farm_in: FarmUpdate) -> Farm:
    farm_data = farm_in.model_dump(exclude_unset=True)
    db_farm.sqlmodel_update(farm_data)
    session.add(db_farm)
    session.commit()
    session.refresh(db_farm)
    return db_farm


# ---------------------------------------------------------------------------
# Livestock
# ---------------------------------------------------------------------------


def create_livestock(*, session: Session, livestock_in: LivestockCreate) -> Livestock:
    livestock = Livestock.model_validate(livestock_in)
    session.add(livestock)
    session.commit()
    session.refresh(livestock)
    return livestock


def update_livestock(
    *, session: Session, db_livestock: Livestock, livestock_in: LivestockUpdate
) -> Livestock:
    data = livestock_in.model_dump(exclude_unset=True)
    image_url = data.pop("image_url", None) if "image_url" in data else None
    image_url_is_set = "image_url" in livestock_in.model_fields_set
    db_livestock.sqlmodel_update(data)
    session.add(db_livestock)

    if image_url_is_set:
        _upsert_primary_livestock_image(
            session=session,
            livestock_id=db_livestock.id,
            image_url=image_url,
        )

    session.commit()
    session.refresh(db_livestock)
    return db_livestock


def list_livestock_images(
    *, session: Session, livestock_id: uuid.UUID
) -> list[LivestockImage]:
    return session.exec(
        select(LivestockImage)
        .where(LivestockImage.livestock_id == livestock_id)
        .order_by(col(LivestockImage.is_primary).desc(), col(LivestockImage.created_at))
    ).all()


def get_livestock_image_by_url(
    *, session: Session, livestock_id: uuid.UUID, image_url: str
) -> LivestockImage | None:
    return session.exec(
        select(LivestockImage).where(
            LivestockImage.livestock_id == livestock_id,
            LivestockImage.image_url == image_url,
        )
    ).first()


def create_livestock_image(
    *,
    session: Session,
    livestock_id: uuid.UUID,
    image_in: LivestockImageCreate,
) -> LivestockImage:
    if image_in.is_primary:
        images = session.exec(
            select(LivestockImage).where(LivestockImage.livestock_id == livestock_id)
        ).all()
        for img in images:
            img.is_primary = False
            session.add(img)

    image = LivestockImage.model_validate(image_in, update={"livestock_id": livestock_id})
    session.add(image)
    session.commit()
    session.refresh(image)
    return image


def delete_livestock_image(
    *, session: Session, livestock_id: uuid.UUID, image_id: uuid.UUID
) -> bool:
    image = session.exec(
        select(LivestockImage).where(
            LivestockImage.id == image_id,
            LivestockImage.livestock_id == livestock_id,
        )
    ).first()
    if not image:
        return False
    session.delete(image)
    session.commit()
    return True


def analyze_and_store_livestock_image(
    *,
    session: Session,
    livestock: Livestock,
    image: LivestockImage,
) -> LivestockImage:
    if image.ai_analysis:
        return image

    analysis = analyze_livestock_image(
        image_url=image.image_url,
        livestock_name=livestock.name,
        tag_number=livestock.tag_number,
        breed=livestock.breed,
        health_status=livestock.health_status,
        lifecycle_status=livestock.lifecycle_status,
    )
    image.ai_analysis = analysis
    session.add(image)
    session.commit()
    session.refresh(image)
    return image


def serialize_livestock(*, session: Session, livestock: Livestock) -> LivestockPublic:
    images = list_livestock_images(session=session, livestock_id=livestock.id)
    image_public = [LivestockImagePublic.model_validate(img) for img in images]
    primary = next((img for img in images if img.is_primary), None)
    primary = primary or (images[0] if images else None)
    return LivestockPublic.model_validate(
        livestock,
        update={
            "image_url": primary.image_url if primary else None,
            "images": image_public,
        },
    )


def serialize_livestock_list(
    *, session: Session, livestock_items: list[Livestock]
) -> list[LivestockPublic]:
    if not livestock_items:
        return []
    ids = [item.id for item in livestock_items]
    images = session.exec(
        select(LivestockImage)
        .where(LivestockImage.livestock_id.in_(ids))
        .order_by(col(LivestockImage.is_primary).desc(), col(LivestockImage.created_at))
    ).all()

    by_livestock: dict[uuid.UUID, list[LivestockImage]] = {livestock_id: [] for livestock_id in ids}
    for img in images:
        by_livestock.setdefault(img.livestock_id, []).append(img)

    result: list[LivestockPublic] = []
    for item in livestock_items:
        item_images = by_livestock.get(item.id, [])
        image_public = [LivestockImagePublic.model_validate(img) for img in item_images]
        primary = next((img for img in item_images if img.is_primary), None)
        primary = primary or (item_images[0] if item_images else None)
        result.append(
            LivestockPublic.model_validate(
                item,
                update={
                    "image_url": primary.image_url if primary else None,
                    "images": image_public,
                },
            )
        )
    return result


def _upsert_primary_livestock_image(
    *, session: Session, livestock_id: uuid.UUID, image_url: str | None
) -> None:
    images = session.exec(
        select(LivestockImage)
        .where(LivestockImage.livestock_id == livestock_id)
        .order_by(col(LivestockImage.is_primary).desc(), col(LivestockImage.created_at))
    ).all()
    primary = next((img for img in images if img.is_primary), None)
    primary = primary or (images[0] if images else None)

    if image_url is None:
        if primary:
            session.delete(primary)
        return

    if primary:
        primary.image_url = image_url
        session.add(primary)
        return

    session.add(
        LivestockImage.model_validate(
            LivestockImageCreate(image_url=image_url, ai_analysis=None, is_primary=True),
            update={"livestock_id": livestock_id},
        )
    )


# ---------------------------------------------------------------------------
# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user


def get_all_active_users(*, session: Session) -> list[User]:
    """Get all active users in the system."""
    statement = select(User).where(User.is_active == True)
    return session.exec(statement).all()


# ---------------------------------------------------------------------------
# WhatsApp
# ---------------------------------------------------------------------------


def get_whatsapp_user_by_phone(*, session: Session, phone: str) -> WhatsAppUser | None:
    return session.exec(
        select(WhatsAppUser).where(WhatsAppUser.phone == phone)
    ).first()


def create_whatsapp_user(
    *, session: Session, user_in: WhatsAppUserCreate
) -> WhatsAppUser:
    """
    Register a new WhatsApp farmer.
    The phone number is hashed and stored as the password — it serves as
    both identifier and credential for this channel.
    """
    user = WhatsAppUser.model_validate(
        user_in,
        update={"hashed_password": get_password_hash(user_in.phone)},
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def save_whatsapp_message(
    *, session: Session, user: WhatsAppUser, msg_in: WhatsAppMessageCreate
) -> WhatsAppMessage:
    """Persist a single inbound or outbound WhatsApp message."""
    message = WhatsAppMessage.model_validate(
        msg_in, update={"user_id": user.id}
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def get_conversation_history(
    *, session: Session, phone: str, limit: int = 10
) -> list[WhatsAppMessage]:
    """
    Return the last `limit` messages for a phone number in chronological order
    (oldest first), ready to be fed as context to the AI.
    """
    rows = session.exec(
        select(WhatsAppMessage)
        .where(WhatsAppMessage.phone == phone)
        .order_by(col(WhatsAppMessage.created_at).desc())
        .limit(limit)
    ).all()
    return list(reversed(rows))
