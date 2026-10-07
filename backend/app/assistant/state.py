"""Reads and writes conversation_state: what an onboarded farmer is currently doing.

A row is created when V-Vet starts a flow for the farmer (e.g. sends the
register-animal form) and closed when the flow finishes or is replaced.
This is the only module that touches the conversation_state table.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, col, select

from app.models.conversation_state import ConversationState, ConversationStatus
from app.models.whatsapp import WhatsAppUser

logger = logging.getLogger(__name__)

# A flow with no progress for this long is treated as abandoned.
STATE_LIFETIME = timedelta(hours=24)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def get_active_state(*, session: Session, user: WhatsAppUser) -> ConversationState | None:
    """The farmer's active flow, or None. An expired one is closed as abandoned first."""
    state = session.exec(
        select(ConversationState)
        .where(col(ConversationState.whatsapp_user_id) == user.id)
        .where(col(ConversationState.status) == "active")
    ).first()
    if state is None:
        return None

    if state.expires_at <= _now():
        close_state(session=session, state=state, status="abandoned")
        return None
    return state


def start_state(
    *, session: Session, user: WhatsAppUser, flow: str, step: str, data: dict[str, Any] | None = None
) -> ConversationState:
    """Begin a flow. The flow the farmer was in before, if any, is closed as abandoned."""
    current = get_active_state(session=session, user=user)
    if current is not None:
        close_state(session=session, state=current, status="abandoned")

    now = _now()
    state = ConversationState(
        whatsapp_user_id=user.id,
        flow=flow,
        step=step,
        data=data or {},
        started_at=now,
        updated_at=now,
        expires_at=now + STATE_LIFETIME,
    )
    session.add(state)
    session.commit()
    session.refresh(state)
    logger.info("[State] %s started %s at %s", user.phone, flow, step)
    return state


def update_state(
    *, session: Session, state: ConversationState, step: str, data: dict[str, Any]
) -> ConversationState:
    """Move the flow to a step and store what has been collected so far."""
    now = _now()
    state.step = step
    # Assign a new dict so SQLAlchemy notices the JSON column changed.
    state.data = dict(data)
    state.updated_at = now
    state.expires_at = now + STATE_LIFETIME
    session.add(state)
    session.commit()
    session.refresh(state)
    return state


def close_state(
    *, session: Session, state: ConversationState, status: ConversationStatus
) -> ConversationState:
    """End the flow. The row is kept so drop-offs and success rates can be measured."""
    state.status = status
    state.ended_at = _now()
    session.add(state)
    session.commit()
    session.refresh(state)
    logger.info("[State] %s %s at step %s", state.flow, status, state.step)
    return state
