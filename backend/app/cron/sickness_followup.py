import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlmodel import Session, col, select

from app.cron.base import CronJob
from app.models.triage_session import TriageSession
from app.models.whatsapp import WhatsAppUser

logger = logging.getLogger(__name__)

INACTIVITY_MINUTES = 2

_DEFAULT_LEAD_IN = "Just checking in — here's where you left off:"
_STAGE1_PROMPT = "Please describe what symptoms or health problems you have noticed."


class SicknessFollowupJob(CronJob):
    """
    Reminds farmers who stalled mid sickness-report:
    - Stage 1: picked an animal (WhatsAppUser.active_sickness_animal_id) but
      never described symptoms, so no TriageSession exists yet.
    - Stage 2: started the basic-context questionnaire (TriageSession) but
      stopped answering.
    """

    name = "sickness-followup"

    def run(self, *, session: Session) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=INACTIVITY_MINUTES)
        stage2_count = self._process_stage2(session=session, cutoff=cutoff)
        stage1_count = self._process_stage1(session=session, cutoff=cutoff)
        return {"stage1_reminders": stage1_count, "stage2_reminders": stage2_count}

    def _process_stage2(self, *, session: Session, cutoff: datetime) -> int:
        from app.flows.report_sickness_context import TriageContextFlow

        # updated_at is only set by the update trigger, so a session still
        # sitting on its first (unanswered) question has updated_at = NULL.
        # Coalesce to created_at so those sessions are still found as stale.
        last_touched = func.coalesce(TriageSession.updated_at, TriageSession.created_at)
        stale_sessions = session.exec(
            select(TriageSession)
            .where(col(TriageSession.is_completed).is_(False))
            .where(col(TriageSession.reminded_at).is_(None))
            .where(last_touched <= cutoff)
        ).all()

        flow = TriageContextFlow()
        count = 0
        for triage_session in stale_sessions:
            user = session.get(WhatsAppUser, triage_session.whatsapp_user_id)
            if user is None or triage_session.current_question_id is None:
                continue

            lead_in = self._compose_lead_in(user=user, session=session)
            self._send_text(phone=user.phone, text=lead_in)
            flow.resend_current_question(phone=user.phone, question_id=triage_session.current_question_id)

            triage_session.reminded_at = datetime.now(timezone.utc)
            session.add(triage_session)
            session.commit()
            count += 1

        return count

    def _process_stage1(self, *, session: Session, cutoff: datetime) -> int:
        pinned_users = session.exec(
            select(WhatsAppUser)
            .where(col(WhatsAppUser.active_sickness_animal_id).is_not(None))
            .where(col(WhatsAppUser.active_sickness_reminded_at).is_(None))
            .where(col(WhatsAppUser.active_sickness_updated_at) <= cutoff)
        ).all()

        count = 0
        for user in pinned_users:
            open_session = session.exec(
                select(TriageSession)
                .where(TriageSession.whatsapp_user_id == user.id)
                .where(col(TriageSession.is_completed).is_(False))
            ).first()
            if open_session is not None:
                continue  # already moved into Stage 2

            lead_in = self._compose_lead_in(user=user, session=session)
            self._send_text(phone=user.phone, text=f"{lead_in}\n\n{_STAGE1_PROMPT}")

            user.active_sickness_reminded_at = datetime.now(timezone.utc)
            session.add(user)
            session.commit()
            count += 1

        return count

    @staticmethod
    def _send_text(*, phone: str, text: str) -> None:
        from app.services.whatsapp.client import send_whatsapp_message

        response = send_whatsapp_message(phone=phone, text=text)
        if response.status_code != 200:
            logger.warning(
                "[SicknessFollowupJob] Send failed for %s: %s %s",
                phone, response.status_code, response.text,
            )

    @staticmethod
    def _compose_lead_in(*, user: WhatsAppUser, session: Session) -> str:
        from app.core.openai import compose_reminder_lead_in
        from app.crud import get_conversation_history

        try:
            history = get_conversation_history(session=session, phone=user.phone, limit=10)
            return compose_reminder_lead_in(history=history) or _DEFAULT_LEAD_IN
        except Exception:
            logger.exception("compose_reminder_lead_in failed; using default lead-in")
            return _DEFAULT_LEAD_IN
