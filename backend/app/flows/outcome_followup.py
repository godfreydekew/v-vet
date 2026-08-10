import logging
import uuid
from datetime import datetime, timezone

from sqlmodel import Session

from app.models.health_observation_follow_up import HealthObservationFollowUp
from app.models.whatsapp import WhatsAppUser

logger = logging.getLogger(__name__)

_ROW_PREFIX = "followup_"

_OUTCOME_ACK = {
    "better": "Great to hear! Keep monitoring and let us know if anything changes.",
    "same": "Thanks for letting us know. Keep monitoring closely over the next day.",
}


class OutcomeFollowUpFlow:
    """
    Handles the Better/Same/Worse tap sent by OutcomeFollowUpJob's WhatsApp
    check-in. 
    """

    def handle_reply(
        self, *, row_id: str, user: WhatsAppUser, session: Session
    ) -> str | None:
        parsed = self._parse_row_id(row_id)
        if parsed is None:
            return None
        follow_up_id, outcome = parsed

        follow_up = session.get(HealthObservationFollowUp, follow_up_id)
        if follow_up is None or follow_up.whatsapp_user_id != user.id:
            return None
        if follow_up.status == "resolved":
            # Stale tap on an already-resolved check-in — ignore.
            return None

        follow_up.status = "resolved"
        follow_up.outcome = outcome
        follow_up.resolved_at = datetime.now(timezone.utc)
        session.add(follow_up)
        session.commit()

        if outcome == "worse":
            return (
                f"Sorry to hear that. Please contact a local veterinary officer as soon as "
                f"possible for {follow_up.description}.\n\n"
                "Keep the animal in a safe, quiet, shaded area in the meantime."
            )
        return _OUTCOME_ACK.get(outcome, "Thanks for the update.")

    @staticmethod
    def _parse_row_id(row_id: str) -> tuple[uuid.UUID, str] | None:
        body = row_id[len(_ROW_PREFIX):]
        if "::" not in body:
            return None
        id_str, outcome = body.split("::", 1)
        if outcome not in ("better", "same", "worse"):
            return None
        try:
            follow_up_id = uuid.UUID(id_str)
        except ValueError:
            return None
        return follow_up_id, outcome
