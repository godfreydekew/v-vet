import logging
import uuid
from datetime import datetime, timezone

from sqlmodel import Session

from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_whatsapp_message

logger = logging.getLogger(__name__)


class ReportSicknessFlow(BaseFlow):
    """
    Sends the farmer's registered animals as a WhatsApp interactive list.
    When the farmer taps one, handle_selection() pins the animal on the
    WhatsAppUser record so the farmer agent knows which animal the
    follow-up symptom description refers to, instead of re-inferring it
    from chat history.

    Herds under SMALL_HERD_THRESHOLD get the list immediately — it fits on
    one page, so tapping is strictly easier than typing a name. Larger herds
    are asked for a name/tag instead by default (paging through a long list
    is worse UX than typing); the farmer agent falls back to sending the list
    anyway if they say they don't know which animal it is.

    The actual list-sending/pagination is shared with MyAnimalsFlow via
    app.flows.animal_list.send_interactive_animal_list — this class only
    owns the sickness-specific bits: the size-aware entry point and pinning
    the tapped animal.

    This flow does not use native WhatsApp Flow forms (nfm_reply), so
    handle() is never called by the pipeline's form-submission path.
    """

    flow_id = "report_sickness"

    SMALL_HERD_THRESHOLD = 10

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
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

        user.active_sickness_animal_id = animal.id
        user.active_sickness_updated_at = datetime.now(timezone.utc)
        user.active_sickness_reminded_at = None
        session.add(user)
        session.commit()

        animal_name = animal.name or animal.tag_number
        return (
            f"Thank you. I have selected **{animal_name}** ({animal.species}). 💙\n\n"
            "Please describe what symptoms or health problems you have noticed (e.g. not eating, coughing, limping)"
        )
