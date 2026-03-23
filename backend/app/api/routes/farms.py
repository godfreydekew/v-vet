import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Farm,
    FarmBase,
    FarmPublic,
    FarmsPublic,
    FarmUpdate,
    Livestock,
    LivestocksPublic,
    Message,
)

router = APIRouter(prefix="/farms", tags=["farms"])


def _get_farm_or_404(session: Any, farm_id: uuid.UUID) -> Farm:
    farm = session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


def _assert_owner(farm: Farm, current_user: Any) -> None:
    if current_user.is_superuser or current_user.is_admin:
        return
    if farm.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough privileges")


@router.get("/", response_model=FarmsPublic)
def list_farms(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """List farms. Farmers see their own; admins/superusers see all."""
    if current_user.is_superuser or current_user.is_admin:
        count = session.exec(select(func.count()).select_from(Farm)).one()
        farms = session.exec(
            select(Farm).order_by(col(Farm.created_at).desc()).offset(skip).limit(limit)
        ).all()
    else:
        count = session.exec(
            select(func.count())
            .select_from(Farm)
            .where(Farm.farmer_id == current_user.id)
        ).one()
        farms = session.exec(
            select(Farm)
            .where(Farm.farmer_id == current_user.id)
            .order_by(col(Farm.created_at).desc())
            .offset(skip)
            .limit(limit)
        ).all()
    return FarmsPublic(data=list(farms), count=count)


@router.post("/", response_model=FarmPublic, status_code=201)
def create_farm(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    farm_in: FarmBase,
) -> Any:
    """Create a new farm. farmer_id is set from the authenticated user."""
    return crud.create_farm(session=session, farm_in=farm_in, farmer_id=current_user.id)


@router.get("/{farm_id}", response_model=FarmPublic)
def get_farm(
    farm_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    farm = _get_farm_or_404(session, farm_id)
    _assert_owner(farm, current_user)
    return farm


@router.patch("/{farm_id}", response_model=FarmPublic)
def update_farm(
    *,
    farm_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    farm_in: FarmUpdate,
) -> Any:
    farm = _get_farm_or_404(session, farm_id)
    _assert_owner(farm, current_user)
    return crud.update_farm(session=session, db_farm=farm, farm_in=farm_in)


@router.delete("/{farm_id}", response_model=Message)
def delete_farm(
    farm_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    farm = _get_farm_or_404(session, farm_id)
    _assert_owner(farm, current_user)
    # Prevent deletion if livestock still exist on this farm
    has_livestock = session.exec(
        select(func.count()).select_from(Livestock).where(Livestock.farm_id == farm_id)
    ).one()
    if has_livestock:
        raise HTTPException(
            status_code=409,
            detail="Please remove all animals from this farm before deleting it.",
        )
    session.delete(farm)
    session.commit()
    return Message(message="Farm deleted successfully")


@router.get("/{farm_id}/livestock", response_model=LivestocksPublic)
def list_farm_livestock(
    farm_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 200,
) -> Any:
    """List all livestock belonging to a specific farm."""
    farm = _get_farm_or_404(session, farm_id)
    _assert_owner(farm, current_user)
    count = session.exec(
        select(func.count()).select_from(Livestock).where(Livestock.farm_id == farm_id)
    ).one()
    items = session.exec(
        select(Livestock)
        .where(Livestock.farm_id == farm_id)
        .order_by(col(Livestock.created_at).desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return LivestocksPublic(data=list(items), count=count)
