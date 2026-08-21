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
    gender: str | None = None,
) -> LookupResult:
    """
    Centralized service for resolving an animal by:
    1. An explicit name or tag in `query`, if given — always checked first,
       so a farmer naming a different animal correctly overrides a stale pin
       instead of being silently ignored (e.g. "Shumba is sick" while Bessie
       is still pinned from an earlier selection).
    2. The pinned ID, if `query` didn't resolve to anything or wasn't given
       at all — this is the "farmer is continuing about the same animal"
       fallback, and is the only path that gets match_type "pinned" (trusted,
       no confirmation needed) unless the query happens to name that same animal.

    gender, if given, restricts every path (pin included) to that gender —
    e.g. record_birth's dam selection only ever matches females.
    """
    pinned_animal = (
        get_livestock_by_id_for_user(session=session, user_id=user_id, livestock_id=pinned_animal_id)
        if pinned_animal_id
        else None
    )
    if gender is not None and pinned_animal is not None and pinned_animal.gender != gender:
        pinned_animal = None

    clean_query = query.strip() if query and query.strip() else None

    if clean_query:
        # Name search (fuzzy)
        name_matches = get_livestock_by_name_for_user(session=session, user_id=user_id, name=clean_query)
        if gender is not None:
            name_matches = [a for a in name_matches if a.gender == gender]
        if len(name_matches) == 1:
            return _matched_result(name_matches[0], pinned_animal, fallback_match_type="fuzzy_name")
        if len(name_matches) > 1:
            return LookupResult(status=LookupStatus.MULTIPLE_MATCHES, candidates=name_matches, match_type="fuzzy_name")

        # Exact tag number search — across the whole herd, not just the first page.
        all_animals = get_livestock_for_user(session=session, user_id=user_id, limit=None, gender=gender)
        tag_matches = [a for a in all_animals if a.tag_number and a.tag_number.lower() == clean_query.lower()]

        if len(tag_matches) == 1:
            return _matched_result(tag_matches[0], pinned_animal, fallback_match_type="exact_tag")
        if len(tag_matches) > 1:
            return LookupResult(status=LookupStatus.MULTIPLE_MATCHES, candidates=tag_matches, match_type="exact_tag")

        # A specific name/tag was given and nothing matched — the farmer clearly
        # meant a particular animal, not "continue with whatever is pinned", so
        # this is NOT_FOUND even if a pin exists.
        return LookupResult(status=LookupStatus.NOT_FOUND)

    # No query given at all — trust the pin, if there is one (continuation).
    if pinned_animal:
        return LookupResult(status=LookupStatus.EXACT_MATCH, animal=pinned_animal, match_type="pinned")

    return LookupResult(status=LookupStatus.NOT_FOUND)


def _matched_result(
    matched_animal: Livestock, pinned_animal: Livestock | None, *, fallback_match_type: str
) -> LookupResult:
    """A name/tag match that happens to be the already-pinned animal is still
    trusted (farmer just re-stated it); any other match needs confirmation."""
    if pinned_animal and matched_animal.id == pinned_animal.id:
        return LookupResult(status=LookupStatus.EXACT_MATCH, animal=pinned_animal, match_type="pinned")
    return LookupResult(status=LookupStatus.EXACT_MATCH, animal=matched_animal, match_type=fallback_match_type)
