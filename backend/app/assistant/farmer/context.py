from datetime import date

from sqlmodel import Session, col, select

from app.assistant.state import get_active_state
from app.crud import get_livestock_for_user, get_observations_for_livestock
from app.models.livestock import Livestock
from app.models.treatment import Treatment
from app.models.vaccination import Vaccination
from app.models.whatsapp import WhatsAppUser

# How many of each kind of record to show per animal (most recent first).
_RECORDS_PER_ANIMAL = 3


def build_farmer_context(*, session: Session, user: WhatsAppUser) -> str:
    sections = [
        f"# Today\n{date.today().isoformat()}",
        "# Farmer\n" + _farmer_details(user),
        "# Herd\n" + _herd(session=session, user=user),
        "# What the farmer is doing now\n" + _current_activity(session=session, user=user),
    ]
    return "\n\n".join(sections)


def _farmer_details(user: WhatsAppUser) -> str:
    lines = [f"Name: {user.full_name or 'not given'}"]
    lines.append(f"District: {user.district or 'not given'}")
    lines.append(f"Preferred language: {user.preferred_language or 'not given'}")
    if user.main_goal:
        lines.append(f"Main goal: {user.main_goal}")
    if user.animal_count is not None:
        lines.append(f"Animals they said they have when they joined: {user.animal_count}")
    return "\n".join(lines)


def _herd(*, session: Session, user: WhatsAppUser) -> str:
    if user.linked_user_id is None:
        return "No animals registered yet."

    animals = get_livestock_for_user(session=session, user_id=user.linked_user_id, limit=None)
    if not animals:
        return "No animals registered yet."

    blocks = [f"{len(animals)} animal(s) on the farm:"]
    for animal in animals:
        blocks.append(_animal(session=session, animal=animal))
    return "\n".join(blocks)


def _animal(*, session: Session, animal: Livestock) -> str:
    name = animal.name or "Unnamed"
    details = [animal.gender or "sex not given"]
    if animal.breed:
        details.append(animal.breed)
    details.append(f"born {animal.date_of_birth}" if animal.date_of_birth else "date of birth not given")
    if animal.weight_kg:
        details.append(f"{animal.weight_kg:g} kg")
    details.append(animal.health_status)
    lines = [f"- {name} (tag {animal.tag_number}): " + ", ".join(details)]

    observations = get_observations_for_livestock(
        session=session, livestock_id=animal.id, limit=_RECORDS_PER_ANIMAL
    )
    for observation in observations:
        text = observation.symptoms or "no symptoms written"
        if observation.notes:
            text += f" ({observation.notes})"
        lines.append(f"  Health report {observation.observed_at.date()}: {text}")

    treatments = session.exec(
        select(Treatment)
        .where(col(Treatment.livestock_id) == animal.id)
        .order_by(col(Treatment.date_given).desc())
        .limit(_RECORDS_PER_ANIMAL)
    ).all()
    for treatment in treatments:
        dose = f", {treatment.dosage}" if treatment.dosage else ""
        lines.append(f"  Treatment {treatment.date_given}: {treatment.treatment_name}{dose}")

    vaccinations = session.exec(
        select(Vaccination)
        .where(col(Vaccination.livestock_id) == animal.id)
        .order_by(col(Vaccination.date_given).desc())
        .limit(_RECORDS_PER_ANIMAL)
    ).all()
    for vaccination in vaccinations:
        due = f" (next due {vaccination.next_due_date})" if vaccination.next_due_date else ""
        lines.append(f"  Vaccination {vaccination.date_given}: {vaccination.vaccine_name}{due}")

    return "\n".join(lines)


def _current_activity(*, session: Session, user: WhatsAppUser) -> str:
    from app.flows import FLOW_REGISTRY

    state = get_active_state(session=session, user=user)
    if state is None:
        return "Nothing in progress."

    flow = FLOW_REGISTRY.get(state.flow)
    if flow is None:
        return f"In the {state.flow} flow, at step '{state.step}'."
    return flow.describe(state)
