import uuid

from sqlmodel import Session

from app import crud
from app.models import Farm, Livestock, User, WhatsAppUser
from app.models.whatsapp import WhatsAppMessage


def _random_phone() -> str:
    return "263" + str(uuid.uuid4().int)[:9]


def _find_row(rows, whatsapp_user_id):
    for row in rows:
        if row.whatsapp_user_id == whatsapp_user_id:
            return row
    return None


def test_admin_farmer_row_for_onboarded_farmer(db: Session) -> None:
    phone = _random_phone()
    web_user = User(
        full_name="Tendai Moyo",
        phone_number=phone,
        district="Gweru",
        email=None,
        hashed_password="x",
    )
    db.add(web_user)
    db.commit()
    db.refresh(web_user)

    whatsapp_user = WhatsAppUser(
        phone=phone,
        hashed_password="x",
        full_name="Tendai Moyo",
        is_fully_onboarded=True,
        linked_user_id=web_user.id,
    )
    db.add(whatsapp_user)
    db.commit()
    db.refresh(whatsapp_user)

    farm = Farm(name="Moyo Farm", farmer_id=web_user.id, farm_type="dairy")
    db.add(farm)
    db.commit()
    db.refresh(farm)

    db.add(Livestock(farm_id=farm.id))
    db.add(Livestock(farm_id=farm.id, health_status="sick"))
    db.add(Livestock(farm_id=farm.id))
    db.add(Livestock(farm_id=farm.id, lifecycle_status="sold"))
    db.add(WhatsAppMessage(user_id=whatsapp_user.id, phone=phone, role="farmer", content="hi"))
    db.add(WhatsAppMessage(user_id=whatsapp_user.id, phone=phone, role="farmer", content="cows"))
    db.add(WhatsAppMessage(user_id=whatsapp_user.id, phone=phone, role="assistant", content="hello"))
    db.commit()

    rows = crud.get_admin_farmer_rows(session=db)
    row = _find_row(rows, whatsapp_user.id)

    assert row is not None
    assert row.user_id == web_user.id
    assert row.status == "active"
    assert row.has_web_account is False
    assert row.district == "Gweru"
    assert row.registered_at == whatsapp_user.created_at
    assert row.message_count == 2
    assert row.messages_last_7_days == 2
    assert row.farm_count == 1
    assert row.animal_count == 3
    assert row.sick_count == 1


def test_admin_farmer_row_for_farmer_still_onboarding(db: Session) -> None:
    phone = _random_phone()
    whatsapp_user = WhatsAppUser(phone=phone, hashed_password="x", district="Mutare")
    db.add(whatsapp_user)
    db.commit()
    db.refresh(whatsapp_user)

    rows = crud.get_admin_farmer_rows(session=db)
    row = _find_row(rows, whatsapp_user.id)

    assert row is not None
    assert row.user_id is None
    assert row.status == "onboarding"
    assert row.phone_number == phone
    assert row.district == "Mutare"
    assert row.message_count == 0
    assert row.animal_count == 0
