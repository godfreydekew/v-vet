import logging
import uuid

from sqlmodel import Session, col, select

from app.flows.triage_context_questions import (
    BASIC_CONTEXT_QUESTIONS,
    Question,
    get_question,
    next_question,
)
from app.models.triage_session import TriageSession
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_list_message, send_reply_buttons

logger = logging.getLogger(__name__)

_ROW_PREFIX = "ctx_"
_DONE_OPTION_ID = "__done__"


class TriageContextFlow:
    """
    Deterministic, no-LLM state machine that walks a farmer through the
    "Establish basic context" questions (Step 2 of the triage spec) once an
    animal has already been identified and confirmed — this is only ever
    started from ReportSicknessFlow.handle_selection() (tap path) or the
    report_sickness tool's confirmed path (free-text path), never before an
    animal is settled.

    Question content lives in triage_context_questions.py as data — adding
    Step 3+ from the spec later means adding more Question entries there,
    not new classes here.

    Progress is tracked in a TriageSession row rather than on WhatsAppUser,
    since this is genuinely multi-step state, unlike the single-value pins
    used elsewhere (is_adding_animal, active_sickness_animal_id).
    """

    def start(
        self,
        *,
        phone: str,
        user: WhatsAppUser,
        session: Session,
        livestock_id: uuid.UUID,
        problem_description: str,
    ) -> bool:
        self._discard_open_sessions(user=user, session=session)

        triage_session = TriageSession(
            whatsapp_user_id=user.id,
            livestock_id=livestock_id,
            current_question_id=BASIC_CONTEXT_QUESTIONS[0].id,
            answers={"problem_description": problem_description},
        )
        session.add(triage_session)
        session.commit()

        return self._send_question(phone=phone, question=BASIC_CONTEXT_QUESTIONS[0])

    def handle_answer(
        self, *, row_id: str, phone: str, user: WhatsAppUser, session: Session
    ) -> tuple[bool, TriageSession | None]:
        """
        Processes a tapped option. Returns (message_sent, completed_session).
        completed_session is only set on the turn the questionnaire finishes,
        so the caller knows when to hand off to final triage recording.
        """
        triage_session = self._get_open_session(user=user, session=session)
        if triage_session is None or not row_id.startswith(_ROW_PREFIX):
            return False, None

        question = get_question(triage_session.current_question_id or "")
        if question is None:
            return False, None

        parsed = self._parse_row_id(row_id)
        if parsed is None:
            return False, None
        question_id, option_id = parsed
        if question_id != question.id:
            # Stale tap from an earlier (already-advanced) question — ignore.
            return False, None

        if question.multi_select:
            return self._handle_multi_select_tap(
                triage_session=triage_session,
                question=question,
                option_id=option_id,
                phone=phone,
                session=session,
            )

        self._record_answer(triage_session, question.id, option_id, session=session)
        return self._advance(triage_session=triage_session, phone=phone, session=session)

    # ------------------------------------------------------------------

    def _handle_multi_select_tap(
        self,
        *,
        triage_session: TriageSession,
        question: Question,
        option_id: str,
        phone: str,
        session: Session,
    ) -> tuple[bool, TriageSession | None]:
        if option_id == _DONE_OPTION_ID:
            return self._advance(triage_session=triage_session, phone=phone, session=session)

        selected: list[str] = list(triage_session.answers.get(question.id, []))
        if option_id not in selected:
            selected.append(option_id)
        self._record_answer(triage_session, question.id, selected, session=session)

        remaining = [o for o in question.options if o.id not in selected]
        sent = self._send_question(phone=phone, question=question, remaining_options=remaining)
        return sent, None

    def _advance(
        self, *, triage_session: TriageSession, phone: str, session: Session
    ) -> tuple[bool, TriageSession | None]:
        upcoming = next_question(triage_session.current_question_id)
        if upcoming is None:
            triage_session.current_question_id = None
            triage_session.is_completed = True
            session.add(triage_session)
            session.commit()
            return True, triage_session

        triage_session.current_question_id = upcoming.id
        session.add(triage_session)
        session.commit()

        sent = self._send_question(phone=phone, question=upcoming)
        return sent, None

    def _record_answer(
        self, triage_session: TriageSession, question_id: str, value: object, *, session: Session
    ) -> None:
        # Reassign (don't mutate in place) so SQLAlchemy detects the JSON column changed.
        answers = dict(triage_session.answers)
        answers[question_id] = value
        triage_session.answers = answers

        # Commit here rather than leaving it to the caller: each WhatsApp tap
        # is a separate webhook request with its own DB session, so an answer
        # that isn't durably saved before this request ends is lost the
        # moment the next tap re-fetches TriageSession from a fresh session.
        session.add(triage_session)
        session.commit()

    def _send_question(
        self,
        *,
        phone: str,
        question: Question,
        remaining_options: list[object] | None = None,
    ) -> bool:
        options = remaining_options if remaining_options is not None else question.options

        if question.multi_select:
            rows = [
                {"id": f"{_ROW_PREFIX}{question.id}::{o.id}", "title": o.title[:24]}
                for o in options
            ]
            rows.insert(
                0,
                {"id": f"{_ROW_PREFIX}{question.id}::{_DONE_OPTION_ID}", "title": "Done — that's everything"},
            )
            response = send_list_message(
                phone=phone,
                body=question.prompt,
                button_label="Select",
                sections=[{"title": "Select all that apply", "rows": rows}],
            )
            return response.status_code == 200

        if question.uses_list:
            rows = [
                {"id": f"{_ROW_PREFIX}{question.id}::{o.id}", "title": o.title[:24]}
                for o in question.options
            ]
            response = send_list_message(
                phone=phone,
                body=question.prompt,
                button_label="Select",
                sections=[{"title": "Choose one", "rows": rows}],
            )
            return response.status_code == 200

        buttons = [
            {"id": f"{_ROW_PREFIX}{question.id}::{o.id}", "title": o.title[:20]}
            for o in question.options
        ]
        response = send_reply_buttons(phone=phone, body=question.prompt, buttons=buttons)
        return response.status_code == 200

    def complete_and_record(
        self, *, triage_session: TriageSession, user: WhatsAppUser, session: Session
    ) -> str:
        """
        Once every question is answered, persist a plain record of what was
        collected and give the farmer a human-readable summary back.

        No triage/urgency evaluation and no VetRequest here — this flow only
        collects basic context for now. Deciding urgency is a separate, later
        step (see docs/V-VET triage flow and district codes.md, Step 3+).
        """
        from app.crud import get_livestock_by_id_for_user
        from app.flows.triage_context_questions import ONSET_TO_DURATION_DAYS
        from app.models.health_observation import HealthObservation

        animal = (
            get_livestock_by_id_for_user(
                session=session, user_id=user.linked_user_id, livestock_id=triage_session.livestock_id
            )
            if user.linked_user_id
            else None
        )
        if animal is None:
            return "Sorry, something went wrong finding that animal. Please send 'menu' and try reporting again."

        answers = triage_session.answers
        symptoms = answers.get("problem_description") or "No description given."
        animal_name = animal.name or animal.tag_number or "your animal"
        summary = self._summarize_answers(animal_name, answers)

        onset = answers.get("onset_time")
        obs = HealthObservation(
            livestock_id=animal.id,
            logged_by=user.linked_user_id,
            symptoms=symptoms,
            symptom_duration_days=ONSET_TO_DURATION_DAYS.get(onset) if onset else None,
            notes=summary,
        )
        session.add(obs)

        animal.health_status = "sick"
        session.add(animal)

        if user.active_sickness_animal_id is not None:
            user.active_sickness_animal_id = None
            session.add(user)

        session.commit()

        return f"{summary}\n\nThis has been recorded. Thank you for letting us know."

    _SUMMARY_LABELS: dict[str, str] = {
        "onset_time": "Onset",
        "progression": "Progression",
        "previous_history": "Had this before",
        "other_affected": "Other animals affected",
        "recent_changes": "Recent changes",
    }

    def _summarize_answers(self, animal_name: str, answers: dict) -> str:
        lines = [f"Here's what we've recorded for {animal_name}:", "", f"Problem: {answers.get('problem_description') or 'No description given.'}"]

        for question_id, label in self._SUMMARY_LABELS.items():
            if question_id not in answers:
                continue
            question = get_question(question_id)
            if question is None:
                continue
            value = answers[question_id]
            if question.multi_select:
                titles = [self._option_title(question, v) for v in value] if value else []
                display = ", ".join(titles) if titles else "None reported"
            else:
                display = self._option_title(question, value)
            lines.append(f"{label}: {display}")

        return "\n".join(lines)

    @staticmethod
    def _option_title(question: Question, option_id: str) -> str:
        for option in question.options:
            if option.id == option_id:
                return option.title
        return option_id

    @staticmethod
    def _parse_row_id(row_id: str) -> tuple[str, str] | None:
        body = row_id[len(_ROW_PREFIX):]
        if "::" not in body:
            return None
        question_id, option_id = body.split("::", 1)
        return question_id, option_id

    def _get_open_session(self, *, user: WhatsAppUser, session: Session) -> TriageSession | None:
        return session.exec(
            select(TriageSession)
            .where(TriageSession.whatsapp_user_id == user.id)
            .where(col(TriageSession.is_completed).is_(False))
            .order_by(col(TriageSession.created_at).desc())
        ).first()

    def _discard_open_sessions(self, *, user: WhatsAppUser, session: Session) -> None:
        """Delete any incomplete session before starting a new one — an
        abandoned questionnaire isn't a meaningful record, unlike a
        completed one, so it's discarded rather than kept around."""
        open_sessions = session.exec(
            select(TriageSession)
            .where(TriageSession.whatsapp_user_id == user.id)
            .where(col(TriageSession.is_completed).is_(False))
        ).all()
        for s in open_sessions:
            session.delete(s)
        if open_sessions:
            session.commit()
