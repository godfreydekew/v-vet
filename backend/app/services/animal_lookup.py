import uuid
from dataclasses import dataclass, field
from enum import Enum

from sqlmodel import Session

from app.crud import (
    get_livestock_by_id_for_user,
    get_livestock_by_name_for_user,
    get_livestock_for_user,
)
from app.models.livestock import Livestock


class LookupStatus(str, Enum):
    EXACT_MATCH = "exact_match"
    MULTIPLE_MATCHES = "multiple_matches"
    NOT_FOUND = "not_found"


@dataclass
class LookupResult:
    status: LookupStatus
    animal: Livestock | None = None
    candidates: list[Livestock] = field(default_factory=list)
    match_type: str | None = None  # "pinned", "exact_tag", "fuzzy_name"


def resolve_animal(
    *,
    session: Session,
    user_id: uuid.UUID,
    query: str | None = None,
    pinned_animal_id: uuid.UUID | None = None,
) -> LookupResult:
    """
    Centralized service for resolving an animal by:
    1. Pinned ID (already selected from a WhatsApp interactive list)
    2. Name (fuzzy match)
    3. Tag number (exact match)
    """
    if pinned_animal_id:
        animal = get_livestock_by_id_for_user(
            session=session, user_id=user_id, livestock_id=pinned_animal_id
        )
        if animal:
            return LookupResult(status=LookupStatus.EXACT_MATCH, animal=animal, match_type="pinned")

    if not query or not query.strip():
        return LookupResult(status=LookupStatus.NOT_FOUND)

    clean_query = query.strip()

    # 2. Name search (fuzzy)
    name_matches = get_livestock_by_name_for_user(session=session, user_id=user_id, name=clean_query)
    if len(name_matches) == 1:
        return LookupResult(status=LookupStatus.EXACT_MATCH, animal=name_matches[0], match_type="fuzzy_name")
    if len(name_matches) > 1:
        return LookupResult(status=LookupStatus.MULTIPLE_MATCHES, candidates=name_matches, match_type="fuzzy_name")

    # 3. Exact tag number search — across the whole herd, not just the first page.
    all_animals = get_livestock_for_user(session=session, user_id=user_id, limit=None)
    tag_matches = [a for a in all_animals if a.tag_number and a.tag_number.lower() == clean_query.lower()]

    if len(tag_matches) == 1:
        return LookupResult(status=LookupStatus.EXACT_MATCH, animal=tag_matches[0], match_type="exact_tag")
    if len(tag_matches) > 1:
        return LookupResult(status=LookupStatus.MULTIPLE_MATCHES, candidates=tag_matches, match_type="exact_tag")

    return LookupResult(status=LookupStatus.NOT_FOUND)
