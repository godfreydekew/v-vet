from typing import Any

from fastapi import APIRouter, Depends

from app import crud
from app.api.deps import SessionDep, get_current_active_superuser
from app.models.admin import AdminFarmersPublic

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_active_superuser)],
)


@router.get("/farmers", response_model=AdminFarmersPublic)
def list_admin_farmers(session: SessionDep) -> Any:
    """Every farmer (web and WhatsApp) with registration, message, farm and animal stats."""
    rows = crud.get_admin_farmer_rows(session=session)
    return AdminFarmersPublic(data=rows, count=len(rows))