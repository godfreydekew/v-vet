import logging
import uuid

from sqlmodel import Session

from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.conversation_state import ConversationState
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_whatsapp_message

logger = logging.getLogger(__name__)

# Steps stored in conversation_state.
STEP_PICK_ANIMAL = "pick_animal"
STEP_DESCRIBE_SYMPTOMS = "describe_symptoms"
STEP_QUESTIONS = "questions"
STEP_DONE = "done"


class ReportSicknessFlow(BaseFlow):

    flow_id = "report_sickness"

    SMALL_HERD_THRESHOLD = 10

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        sent = self._send_first_step(phone=phone, user=user, session=session)
        if sent:
            self.start_tracking(session=session, user=user, step=STEP_PICK_ANIMAL)
        return sent

    def _send_first_step(self, *, phone: str, user: WhatsAppUser, session: Session) -> bool:
        from app.crud import get_livestock_for_user
        from app.flows.animal_list import MAX_ANIMALS

        if not user.linked_user_id:
            return False

        animal_count = len(
            get_livestock_for_user(session=session, user_id=user.linked_user_id, limit=MAX_ANIMALS)
        )
        if animal_count == 0:
            return False

        if animal_count >= self.SMALL_HERD_THRESHOLD:
            response = send_whatsapp_message(
                phone=phone,
                text=(
                    "I am so sorry your animal is not feeling well. 💙\n\n"
                    "You have quite a few animals registered — which one is it? "
                    "Please reply with its name or tag number."
                ),
            )
            return response.status_code == 200

        return self.send_animal_list(phone=phone, user=user, session=session)

    def send_animal_list(self, *, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(phone=phone, user=user, session=session, intent="sickness")

    def show_more(self, *, offset: int, phone: str, user: WhatsAppUser, session: Session) -> bool:
        """Send the next page of animals, triggered by the 'Show more animals' row."""
        return send_interactive_animal_list(
            phone=phone, user=user, session=session, intent="sickness", offset=offset
        )

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        raise NotImplementedError(
            "report_sickness uses an interactive list, not a WhatsApp Flow form — "
            "see handle_selection() instead."
        )

    def handle_selection(self, animal_id: str, user: WhatsAppUser, session: Session) -> str:
        """Process the farmer tapping an animal in the list sent by start() / show_more()."""
        from app.crud import get_livestock_by_id_for_user

        try:
            parsed_id = uuid.UUID(animal_id)
        except ValueError:
            return "Sorry, I couldn't find that animal. Please send 'menu' and try again."

        animal = (
            get_livestock_by_id_for_user(
                session=session, user_id=user.linked_user_id, livestock_id=parsed_id
            )
            if user.linked_user_id
            else None
        )
        if animal is None:
            return "Sorry, I couldn't find that animal. Please send 'menu' and try again."

        animal_name = animal.name or animal.tag_number
        self.record_step(
            session=session,
            user=user,
            step=STEP_DESCRIBE_SYMPTOMS,
            data={"animal_id": str(animal.id), "animal_name": animal_name},
        )
        return (
            f"Thank you. I have selected **{animal_name}**. \n\n"
            "Please describe what symptoms or health problems you have noticed (e.g. not eating, coughing, limping)"
        )

    def submit_symptoms(self, *, session: Session, user: WhatsAppUser, symptoms: str) -> str | None:
        """Hand the farmer's description to the sickness check, once the sick animal is chosen.

        The sickness check sends its own message: urgent advice, or the first follow-up question.
        Returns None when that happened, otherwise the reason it couldn't.
        """
        from app.assistant.state import get_active_state
        from app.flows.report_sickness_context import TriageContextFlow

        state = get_active_state(session=session, user=user)
        if state is None or state.flow != self.flow_id or state.step != STEP_DESCRIBE_SYMPTOMS:
            return "V-Vet isn't waiting for symptoms right now."
        if not symptoms.strip():
            return "The symptoms were empty."

        sent = TriageContextFlow().start(
            phone=user.phone,
            user=user,
            session=session,
            livestock_id=uuid.UUID(state.data["animal_id"]),
            problem_description=symptoms.strip(),
        )
        if not sent:
            return "The symptoms could not be processed."
        return None

    def describe(self, state: ConversationState) -> str:
        animal_name = state.data.get("animal_name", "the animal")
        if state.step == STEP_DESCRIBE_SYMPTOMS:
            return (
                f"Reporting a sick animal ({animal_name}): V-Vet asked the farmer to describe the "
                "symptoms and is waiting for their description."
            )
        if state.step == STEP_QUESTIONS:
            return (
                f"Reporting a sick animal ({animal_name}): the symptoms are saved and the farmer is "
                "answering V-Vet's follow-up questions by tapping the options on the latest question."
            )
        return (
            "Reporting a sick animal: V-Vet asked the farmer which animal is sick, "
            "and they haven't chosen yet."
        )
