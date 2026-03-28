import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Livestock,
    Message,
    VetRequest,
    VetRequestPublic,
    VetRequestsPublic,
    VetRequestSubmit,
    VetRequestUpdate,
    VetResponse,
    VetResponseCreate,
    VetResponsePublic,
)

router = APIRouter(prefix="/vet-requests", tags=["vet-requests"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_request_or_404(session: Any, request_id: uuid.UUID) -> VetRequest:
    req = session.get(VetRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Vet request not found")
    return req  # type: ignore[return-value]


def _assert_access(req: VetRequest, current_user: Any) -> None:
    """Farmer who owns it, assigned vet, admin, or superuser can access."""
    if current_user.is_superuser or current_user.is_admin:
        return
    if req.farmer_id == current_user.id:
        return
    if req.vet_id == current_user.id:
        return
    raise HTTPException(status_code=403, detail="Not enough privileges")


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get("/", response_model=VetRequestsPublic)
def list_vet_requests(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    - Farmer: sees their own requests
    - Vet: sees requests assigned to them
    - Admin/superuser: sees all
    """
    if current_user.is_superuser or current_user.is_admin:
        items = session.exec(
            select(VetRequest)
            .order_by(col(VetRequest.submitted_at).desc())
            .offset(skip)
            .limit(limit)
        ).all()
    elif current_user.role == "vet":
        items = session.exec(
            select(VetRequest)
            .where(col(VetRequest.vet_id) == current_user.id)
            .order_by(col(VetRequest.submitted_at).desc())
            .offset(skip)
            .limit(limit)
        ).all()
    else:
        items = session.exec(
            select(VetRequest)
            .where(col(VetRequest.farmer_id) == current_user.id)
            .order_by(col(VetRequest.submitted_at).desc())
            .offset(skip)
            .limit(limit)
        ).all()

    # Single batch lookup for livestock — avoids N+1 on the frontend
    livestock_ids = list({item.livestock_id for item in items})
    livestock_map: dict[uuid.UUID, Livestock] = {}
    if livestock_ids:
        for ls in session.exec(
            select(Livestock).where(col(Livestock.id).in_(livestock_ids))
        ).all():
            livestock_map[ls.id] = ls  # type: ignore[index]

    enriched = []
    for item in items:
        ls = livestock_map.get(item.livestock_id)
        enriched.append(
            VetRequestPublic(
                **item.model_dump(),
                livestock_name=ls.name if ls else None,
                livestock_tag=ls.tag_number if ls else None,
                livestock_species=ls.species if ls else None,
            )
        )

    return VetRequestsPublic(data=enriched, count=len(enriched))


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/", response_model=VetRequestPublic, status_code=201)
def create_vet_request(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    body: VetRequestSubmit,
) -> Any:
    """Farmer submits a vet request, choosing a specific vet."""
    livestock = session.get(Livestock, body.livestock_id)
    if not livestock:
        raise HTTPException(status_code=404, detail="Animal not found")

    req = VetRequest(
        livestock_id=body.livestock_id,
        farm_id=livestock.farm_id,
        farmer_id=current_user.id,
        vet_id=body.vet_id,
        urgency=body.urgency,
        farmer_notes=body.farmer_notes,
        status="assigned",
        assigned_at=_utcnow(),
    )
    session.add(req)
    session.commit()
    session.refresh(req)
    return req


# ---------------------------------------------------------------------------
# Get / Update / Delete
# ---------------------------------------------------------------------------


@router.get("/{request_id}", response_model=VetRequestPublic)
def get_vet_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    req = _get_request_or_404(session, request_id)
    _assert_access(req, current_user)
    return req


@router.patch("/{request_id}", response_model=VetRequestPublic)
def update_vet_request(
    *,
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    body: VetRequestUpdate,
) -> Any:
    """
    Vet can move status to in_review or completed.
    Farmer can cancel their own pending/assigned request.
    """
    req = _get_request_or_404(session, request_id)
    _assert_access(req, current_user)

    update_data = body.model_dump(exclude_unset=True)

    # Farmers can only cancel
    if not (current_user.is_superuser or current_user.is_admin or req.vet_id == current_user.id):
        allowed = {"status"} if update_data.get("status") == "cancelled" else set()
        update_data = {k: v for k, v in update_data.items() if k in allowed}

    for field, value in update_data.items():
        setattr(req, field, value)

    req.updated_at = _utcnow()
    session.add(req)
    session.commit()
    session.refresh(req)
    return req


@router.delete("/{request_id}", response_model=Message)
def delete_vet_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    req = _get_request_or_404(session, request_id)
    _assert_access(req, current_user)
    if not (current_user.is_superuser or current_user.is_admin):
        raise HTTPException(status_code=403, detail="Not enough privileges")
    session.delete(req)
    session.commit()
    return Message(message="Vet request deleted")


# ---------------------------------------------------------------------------
# Vet response
# ---------------------------------------------------------------------------


@router.post("/{request_id}/response", response_model=VetResponsePublic, status_code=201)
def submit_vet_response(
    *,
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    body: VetResponseCreate,
) -> Any:
    """Vet submits their response. Automatically marks the request as completed."""
    req = _get_request_or_404(session, request_id)

    if req.vet_id != current_user.id and not (current_user.is_superuser or current_user.is_admin):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    # Check no duplicate response
    existing = session.exec(
        select(VetResponse).where(col(VetResponse.vet_request_id) == request_id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Response already submitted for this request")

    response = VetResponse(
        vet_request_id=request_id,
        vet_id=current_user.id,
        response_type=body.response_type,
        diagnosis=body.diagnosis,
        treatment_recommendation=body.treatment_recommendation,
        drug_name=body.drug_name,
        dosage=body.dosage,
        confidence_level=body.confidence_level,
        follow_up_required=body.follow_up_required,
        follow_up_date=body.follow_up_date,
        vet_notes=body.vet_notes,
    )
    session.add(response)

    req.status = "completed"
    req.completed_at = _utcnow()
    req.updated_at = _utcnow()
    session.add(req)

    session.commit()
    session.refresh(response)
    return response


@router.get("/{request_id}/response", response_model=VetResponsePublic)
def get_vet_response(
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    req = _get_request_or_404(session, request_id)
    _assert_access(req, current_user)

    response = session.exec(
        select(VetResponse).where(col(VetResponse.vet_request_id) == request_id)
    ).first()
    if not response:
        raise HTTPException(status_code=404, detail="No response submitted yet")
    return response
