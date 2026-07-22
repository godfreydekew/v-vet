import json
from dataclasses import dataclass

from sqlmodel import Session

from app.models.health_observation import HealthObservation
from app.models.livestock import Livestock
from app.models.vet_request import VetRequest
from app.models.whatsapp import WhatsAppUser
from app.services.triage import TriageResult, evaluate_triage


@dataclass
class SicknessReportResult:
    animal_name: str
    triage: TriageResult


def record_sickness_report(
    *,
    session: Session,
    user: WhatsAppUser,
    animal: Livestock,
    symptoms: str,
    danger_flags: list[str] | None = None,
    duration: str | None = None,
    symptom_duration_days: int | None = None,
    trend: str | None = None,
) -> SicknessReportResult:
    """
    Runs triage on the reported symptoms and persists the health observation
    (and a VetRequest, if the triage result requires one).

    Owns the full "report sickness" operation so any caller — the FarmerAgent
    tool today, a fully-structured flow step later — goes through the same
    logic instead of duplicating triage + persistence.

    animal resolution (by name, tag, or a pinned selection) is the caller's
    responsibility, since how "which animal" is determined differs by entry
    point (free text vs a WhatsApp list selection).
    """
    triage_res = evaluate_triage(
        symptoms=symptoms,
        danger_flags=danger_flags,
        symptom_duration_days=symptom_duration_days,
        trend=trend,
    )

    if triage_res.urgency_level in ("Emergency", "Urgent"):
        animal.health_status = "sick"
        session.add(animal)

    obs = HealthObservation(
        livestock_id=animal.id,
        logged_by=user.linked_user_id,
        symptoms=symptoms,
        urgency_level=triage_res.urgency_level,
        danger_flags=json.dumps(triage_res.danger_flags),
        symptom_duration=duration,
        symptom_duration_days=symptom_duration_days,
        symptom_trend=trend,
        notes=triage_res.summary_text,
    )
    session.add(obs)

    if triage_res.requires_vet:
        vr = VetRequest(
            livestock_id=animal.id,
            farmer_id=user.linked_user_id,
            urgency=triage_res.urgency_level.lower(),
            farmer_notes=f"Symptoms: {symptoms}. {triage_res.summary_text}",
            status="pending",
        )
        session.add(vr)

    if user.active_sickness_animal_id is not None:
        user.active_sickness_animal_id = None
        session.add(user)

    session.commit()

    return SicknessReportResult(
        animal_name=animal.name or animal.tag_number,
        triage=triage_res,
    )
