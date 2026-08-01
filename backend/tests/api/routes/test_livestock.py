import uuid
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import Farm, Livestock, HealthObservation, Treatment, Vaccination, VetRequest, WhatsAppUser, User


def test_delete_livestock_cascade(client: TestClient, db: Session, normal_user_token_headers: dict[str, str]) -> None:
    # Get current user from normal user token headers
    response = client.get(f"{settings.API_V1_STR}/users/me", headers=normal_user_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    user_id = uuid.UUID(user_data["id"])

    # Update user district if not set
    user = db.get(User, user_id)
    if user and not user.district:
        user.district = "Kampala"
        db.add(user)
        db.commit()

    # Create a farm for user
    farm = Farm(
        name="Test Delete Farm",
        farmer_id=user_id,
        farm_type="dairy",
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    # Create livestock
    animal = Livestock(
        farm_id=farm.id,
        species="cattle",
        name="Bessie Test",
        tag_number="TAG-DEL-001",
    )
    db.add(animal)
    db.commit()
    db.refresh(animal)

    # Create related records
    obs = HealthObservation(livestock_id=animal.id, logged_by=user_id, symptoms="Cough")
    treat = Treatment(livestock_id=animal.id, logged_by=user_id, treatment_name="Meds", date_given="2026-08-01", administered_by="farmer")
    vax = Vaccination(livestock_id=animal.id, logged_by=user_id, vaccine_name="FMD", date_given="2026-08-01", administered_by="farmer")
    vet_req = VetRequest(livestock_id=animal.id, farm_id=farm.id, farmer_id=user_id, urgency="medium")
    wa_user = WhatsAppUser(phone="+256700999888", hashed_password="hash", active_sickness_animal_id=animal.id)

    db.add(obs)
    db.add(treat)
    db.add(vax)
    db.add(vet_req)
    db.add(wa_user)
    db.commit()

    # Call DELETE /api/v1/livestock/{id}
    del_resp = client.delete(
        f"{settings.API_V1_STR}/livestock/{animal.id}",
        headers=normal_user_token_headers,
    )
    assert del_resp.status_code == 200, del_resp.text
    assert del_resp.json()["message"] == "Animal deleted successfully"

    # Expire cached session objects to query database state afresh
    db.expire_all()

    # Verify animal deleted
    assert db.get(Livestock, animal.id) is None

    # Verify related records deleted or unlinked
    assert db.exec(select(HealthObservation).where(HealthObservation.livestock_id == animal.id)).first() is None
    assert db.exec(select(Treatment).where(Treatment.livestock_id == animal.id)).first() is None
    assert db.exec(select(Vaccination).where(Vaccination.livestock_id == animal.id)).first() is None
    assert db.exec(select(VetRequest).where(VetRequest.livestock_id == animal.id)).first() is None
    
    db.refresh(wa_user)
    assert wa_user.active_sickness_animal_id is None
