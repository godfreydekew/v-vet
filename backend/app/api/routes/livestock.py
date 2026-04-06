import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlmodel import col, func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Farm,
    HealthObservation,
    HealthObservationBase,
    HealthObservationPublic,
    HealthObservationsPublic,
    Livestock,
    LivestockCreate,
    LivestockImage,
    LivestockImageCreate,
    LivestockImagePublic,
    LivestockImagesPublic,
    LivestockPublic,
    LivestocksPublic,
    LivestockUpdate,
    Message,
    Treatment,
    TreatmentBase,
    TreatmentPublic,
    TreatmentsPublic,
    Vaccination,
    VaccinationBase,
    VaccinationPublic,
    VaccinationsPublic,
)

router = APIRouter(prefix="/livestock", tags=["livestock"])


def _get_livestock_or_404(session: Any, livestock_id: uuid.UUID) -> Livestock:
    item = session.get(Livestock, livestock_id)
    if not item:
        raise HTTPException(status_code=404, detail="Animal not found")
    return item


def _assert_livestock_owner(
    session: Any, livestock: Livestock, current_user: Any
) -> None:
    if current_user.is_superuser or current_user.is_admin:
        return
    farm = session.get(Farm, livestock.farm_id)
    if not farm or farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough privileges")


@router.get("/", response_model=LivestocksPublic)
def list_livestock(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 200,
) -> Any:
    """List livestock. Farmers see only their own; admins/superusers see all."""
    if current_user.is_superuser or current_user.is_admin:
        count = session.exec(select(func.count()).select_from(Livestock)).one()
        items = session.exec(
            select(Livestock)
            .order_by(col(Livestock.created_at).desc())
            .offset(skip)
            .limit(limit)
        ).all()
    else:
        # Only livestock on farms owned by this farmer
        stmt = (
            select(Livestock)
            .join(Farm, Livestock.farm_id == Farm.id)
            .where(Farm.farmer_id == current_user.id)
        )
        count = session.exec(
            select(func.count())
            .select_from(Livestock)
            .join(Farm, Livestock.farm_id == Farm.id)
            .where(Farm.farmer_id == current_user.id)
        ).one()
        items = session.exec(
            stmt.order_by(col(Livestock.created_at).desc()).offset(skip).limit(limit)
        ).all()
    serialized = crud.serialize_livestock_list(session=session, livestock_items=list(items))
    return LivestocksPublic(data=serialized, count=count)


@router.post("/", response_model=LivestockPublic, status_code=201)
def create_livestock(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    livestock_in: LivestockCreate,
) -> Any:
    """Add an animal to a farm. The farm must belong to the authenticated farmer."""
    farm = session.get(Farm, livestock_in.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if not current_user.is_superuser and not current_user.is_admin:
        if farm.farmer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough privileges")
    livestock = crud.create_livestock(session=session, livestock_in=livestock_in)
    return crud.serialize_livestock(session=session, livestock=livestock)


@router.get("/{livestock_id}", response_model=LivestockPublic)
def get_livestock(
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    return crud.serialize_livestock(session=session, livestock=livestock)


@router.patch("/{livestock_id}", response_model=LivestockPublic)
def update_livestock(
    *,
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    livestock_in: LivestockUpdate,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    updated = crud.update_livestock(
        session=session, db_livestock=livestock, livestock_in=livestock_in
    )
    return crud.serialize_livestock(session=session, livestock=updated)


@router.delete("/{livestock_id}", response_model=Message)
def delete_livestock(
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    try:
        # TODO: use ON DELETE CASCADE in the database and just delete the livestock record here instead of doing multiple queries and handling exceptions
        session.exec(
            delete(HealthObservation).where(
                HealthObservation.livestock_id == livestock_id
            )
        )
        session.exec(delete(Treatment).where(Treatment.livestock_id == livestock_id))
        session.exec(
            delete(Vaccination).where(Vaccination.livestock_id == livestock_id)
        )
        session.exec(delete(LivestockImage).where(LivestockImage.livestock_id == livestock_id))
        session.exec(delete(Livestock).where(Livestock.id == livestock_id))
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete animal because it is still referenced by related records",
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting animal: {str(e)}")
    return Message(message="Animal deleted successfully")


@router.get("/{livestock_id}/images", response_model=LivestockImagesPublic)
def list_livestock_images(
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    items = crud.list_livestock_images(session=session, livestock_id=livestock_id)
    return LivestockImagesPublic(
        data=[LivestockImagePublic.model_validate(img) for img in items],
        count=len(items),
    )


@router.post("/{livestock_id}/images", response_model=LivestockImagePublic, status_code=201)
def add_livestock_image(
    *,
    livestock_id: uuid.UUID,
    image_in: LivestockImageCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    image = crud.create_livestock_image(
        session=session,
        livestock_id=livestock_id,
        image_in=image_in,
    )
    return LivestockImagePublic.model_validate(image)


@router.delete("/{livestock_id}/images/{image_id}", response_model=Message)
def remove_livestock_image(
    livestock_id: uuid.UUID,
    image_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    deleted = crud.delete_livestock_image(
        session=session,
        livestock_id=livestock_id,
        image_id=image_id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")
    return Message(message="Image deleted successfully")


# ---------------------------------------------------------------------------
# Health Observations
# ---------------------------------------------------------------------------


@router.get(
    "/{livestock_id}/health-observations", response_model=HealthObservationsPublic
)
def list_health_observations(
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    count = session.exec(
        select(func.count())
        .select_from(HealthObservation)
        .where(HealthObservation.livestock_id == livestock_id)
    ).one()
    items = session.exec(
        select(HealthObservation)
        .where(HealthObservation.livestock_id == livestock_id)
        .order_by(col(HealthObservation.observed_at).desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return HealthObservationsPublic(data=list(items), count=count)


@router.post(
    "/{livestock_id}/health-observations",
    response_model=HealthObservationPublic,
    status_code=201,
)
def create_health_observation(
    *,
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    obs_in: HealthObservationBase,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    obs = HealthObservation.model_validate(
        obs_in, update={"livestock_id": livestock_id, "logged_by": current_user.id}
    )
    session.add(obs)
    session.commit()
    session.refresh(obs)
    return obs


# ---------------------------------------------------------------------------
# Treatments
# ---------------------------------------------------------------------------


@router.get("/{livestock_id}/treatments", response_model=TreatmentsPublic)
def list_treatments(
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    count = session.exec(
        select(func.count())
        .select_from(Treatment)
        .where(Treatment.livestock_id == livestock_id)
    ).one()
    items = session.exec(
        select(Treatment)
        .where(Treatment.livestock_id == livestock_id)
        .order_by(col(Treatment.created_at).desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return TreatmentsPublic(data=list(items), count=count)


@router.post(
    "/{livestock_id}/treatments", response_model=TreatmentPublic, status_code=201
)
def create_treatment(
    *,
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    treatment_in: TreatmentBase,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    treatment = Treatment.model_validate(
        treatment_in,
        update={"livestock_id": livestock_id, "logged_by": current_user.id},
    )
    session.add(treatment)
    session.commit()
    session.refresh(treatment)
    return treatment


# ---------------------------------------------------------------------------
# Vaccinations
# ---------------------------------------------------------------------------


@router.get("/{livestock_id}/vaccinations", response_model=VaccinationsPublic)
def list_vaccinations(
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    count = session.exec(
        select(func.count())
        .select_from(Vaccination)
        .where(Vaccination.livestock_id == livestock_id)
    ).one()
    items = session.exec(
        select(Vaccination)
        .where(Vaccination.livestock_id == livestock_id)
        .order_by(col(Vaccination.created_at).desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return VaccinationsPublic(data=list(items), count=count)


@router.post(
    "/{livestock_id}/vaccinations", response_model=VaccinationPublic, status_code=201
)
def create_vaccination(
    *,
    livestock_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    vax_in: VaccinationBase,
) -> Any:
    livestock = _get_livestock_or_404(session, livestock_id)
    _assert_livestock_owner(session, livestock, current_user)
    vax = Vaccination.model_validate(
        vax_in, update={"livestock_id": livestock_id, "logged_by": current_user.id}
    )
    session.add(vax)
    session.commit()
    session.refresh(vax)
    return vax
