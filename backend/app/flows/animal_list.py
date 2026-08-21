import logging
from typing import Literal

from sqlmodel import Session

from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_list_message

logger = logging.getLogger(__name__)

AnimalListIntent = Literal["view", "sickness", "death", "birth"]

# WhatsApp list messages allow at most 10 rows total. Reserve one row for
# "Show more animals" whenever there's a next page.
PAGE_SIZE = 9
MAX_ANIMALS = 100

_ROW_ID_PREFIX: dict[AnimalListIntent, str] = {
    "view": "view_animal_",
    "sickness": "select_animal_",
    "death": "death_animal_",
    "birth": "birth_animal_",
}
_MORE_ID_PREFIX: dict[AnimalListIntent, str] = {
    "view": "view_more_",
    "sickness": "sickness_more_",
    "death": "death_more_",
    "birth": "birth_more_",
}
_HEADER_TEXT: dict[AnimalListIntent, str] = {
    "view": "Here is your registered herd. Tap an animal to view its details:",
    "sickness": (
        "I am so sorry your animal is not feeling well. 💙\n\n"
        "Please select which animal is sick from your herd list below:"
    ),
    "death": (
        "We are so sorry for your loss. 💙\n\n"
        "Please select which animal passed away from your herd list below:"
    ),
    "birth": (
        "Congratulations on the new birth! 🐄🎉\n\n"
        "Please select which cow gave birth from your herd list below:"
    ),
}
_MORE_HEADER_TEXT: dict[AnimalListIntent, str] = {
    "view": "Here are more of your animals — tap one to view its details:",
    "sickness": "Here are more of your animals — select the one that's sick:",
    "death": "Here are more of your animals — select the one that passed away:",
    "birth": "Here are more of your cows — select the one that gave birth:",
}
_BUTTON_LABEL: dict[AnimalListIntent, str] = {
    "view": "View Animal",
    "sickness": "Select Animal",
    "death": "Select Animal",
    "birth": "Select Mother Cow",
}
# Restricts the underlying query for intents that only make sense for one
# gender — dam selection only ever shows/matches females.
_GENDER_FILTER: dict[AnimalListIntent, str | None] = {
    "view": None,
    "sickness": None,
    "death": None,
    "birth": "female",
}


def send_interactive_animal_list(
    *,
    phone: str,
    user: WhatsAppUser,
    session: Session,
    intent: AnimalListIntent,
    offset: int = 0,
) -> bool:
    """
    Sends a paginated WhatsApp interactive list of the farmer's registered
    animals. Shared by ReportSicknessFlow (intent="sickness" — tap pins the
    animal for a sickness report) and MyAnimalsFlow (intent="view" — tap
    shows the animal's details), so the pagination/rendering logic that used
    to live only in ReportSicknessFlow lives in exactly one place.
    """
    from app.crud import get_livestock_for_user

    if not user.linked_user_id:
        return False

    animals = get_livestock_for_user(
        session=session, user_id=user.linked_user_id, limit=MAX_ANIMALS, gender=_GENDER_FILTER[intent]
    )
    if not animals:
        return False

    page = animals[offset : offset + PAGE_SIZE]
    if not page:
        # Offset ran past the end (e.g. herd shrank mid-conversation) — restart at page one.
        offset = 0
        page = animals[:PAGE_SIZE]

    next_offset = offset + PAGE_SIZE
    has_more = next_offset < len(animals)

    row_prefix = _ROW_ID_PREFIX[intent]
    rows = [_animal_row(a, row_prefix) for a in page]
    if has_more:
        rows.append(
            {
                "id": f"{_MORE_ID_PREFIX[intent]}{next_offset}",
                "title": "Show more animals",
                "description": f"{len(animals) - next_offset} more in your herd",
            }
        )

    sections = [{"title": "Your Registered Animals", "rows": rows}]
    body = _HEADER_TEXT[intent] if offset == 0 else _MORE_HEADER_TEXT[intent]

    response = send_list_message(
        phone=phone,
        body=body,
        button_label=_BUTTON_LABEL[intent],
        sections=sections,
    )
    return response.status_code == 200


def _animal_row(a: Livestock, row_id_prefix: str) -> dict:
    title = a.name if a.name else f"Tag: {a.tag_number}"
    species_str = a.species.capitalize() if a.species else "Cattle"
    health_str = a.health_status.capitalize() if a.health_status else "Healthy"
    desc = f"{species_str} • {health_str}"
    if a.tag_number and a.name:
        desc += f" • Tag: {a.tag_number}"
    return {
        "id": f"{row_id_prefix}{a.id}",
        "title": title[:24],
        "description": desc[:72],
    }
