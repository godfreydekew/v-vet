import logging
from datetime import datetime, timezone

from sqlmodel import Session, col, select

from app.cron.base import CronJob
from app.models.health_observation_follow_up import HealthObservationFollowUp
from app.models.whatsapp import WhatsAppUser

logger = logging.getLogger(__name__)

_ROW_PREFIX = "followup_"


class OutcomeFollowUpJob(CronJob):
    """
    Sends the 24h/48h outcome check-in for a HealthObservation once its
    due_at has passed — "Is the animal better, the same, or worse?" with
    three tappable buttons. The reply is handled by the followup_ row-id
    prefix in the WhatsApp pipeline, not by this job.
    """

    name = "outcome-followup"

    def run(self, *, session: Session) -> dict:
        now = datetime.now(timezone.utc)
        due = session.exec(
            select(HealthObservationFollowUp)
            .where(HealthObservationFollowUp.status == "pending")
            .where(col(HealthObservationFollowUp.due_at) <= now)
        ).all()

        count = 0
        for follow_up in due:
            user = session.get(WhatsAppUser, follow_up.whatsapp_user_id)
            if user is None:
                continue

            if not self._send_check_in(phone=user.phone, follow_up=follow_up):
                continue

            follow_up.status = "sent"
            follow_up.sent_at = now
            session.add(follow_up)
            session.commit()
            count += 1

        return {"follow_ups_sent": count}

    @staticmethod
    def _send_check_in(*, phone: str, follow_up: HealthObservationFollowUp) -> bool:
        from app.services.whatsapp.client import send_reply_buttons

        report_date = follow_up.created_at.strftime("%b %d")
        body = (
            f"Hope things are looking up. Just checking in on the report from {report_date}:\n"
            f"{follow_up.description}\n\nHow is the animal doing now?"
        )
        buttons = [
            {"id": f"{_ROW_PREFIX}{follow_up.id}::better", "title": "Better"},
            {"id": f"{_ROW_PREFIX}{follow_up.id}::same", "title": "Same"},
            {"id": f"{_ROW_PREFIX}{follow_up.id}::worse", "title": "Worse"},
        ]
        response = send_reply_buttons(phone=phone, body=body, buttons=buttons)
        if response.status_code != 200:
            logger.warning(
                "[OutcomeFollowUpJob] Send failed for %s: %s %s",
                phone, response.status_code, response.text,
            )
            return False
        return True
