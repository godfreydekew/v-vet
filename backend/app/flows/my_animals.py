import logging
import uuid

from sqlmodel import Session

from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppUser

logger = logging.getLogger(__name__)


class MyAnimalsFlow(BaseFlow):
    """
    Sends the farmer's registered animals as a WhatsApp interactive list for
    viewing — the "My Animals" menu item. Tapping an animal shows its
    details. No LLM involved anywhere in this path, unlike the old behaviour
    where the menu tap fell through to the FarmerAgent and could misfire
    into calling the wrong tool (e.g. report_sickness).

    List-sending/pagination is shared with ReportSicknessFlow via
    app.flows.animal_list.send_interactive_animal_list.

    This flow does not use native WhatsApp Flow forms (nfm_reply), so
    handle() is never called by the pipeline's form-submission path.
    """

    flow_id = "my_animals"

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return send_interactive_animal_list(phone=phone, user=user, session=session, intent="view")

    def show_more(self, *, offset: int, phone: str, user: WhatsAppUser, session: Session) -> bool:
        """Send the next page of animals, triggered by the 'Show more animals' row."""
        return send_interactive_animal_list(
            phone=phone, user=user, session=session, intent="view", offset=offset
        )

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        raise NotImplementedError(
            "my_animals uses an interactive list, not a WhatsApp Flow form — "
            "see handle_view() instead."
        )

    def handle_view(self, animal_id: str, user: WhatsAppUser, session: Session) -> str:
        """Process the farmer tapping an animal to view its details."""
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

        return self._format_details(animal)

    @staticmethod
    def _format_details(animal: Livestock) -> str:
        name = animal.name or animal.tag_number or "Unnamed animal"
        lines = [f"*{name}*", ""]
        lines.append(f"Species: {animal.species.capitalize() if animal.species else 'Unknown'}")
        if animal.breed:
            lines.append(f"Breed: {animal.breed}")
        if animal.gender:
            lines.append(f"Gender: {animal.gender.capitalize()}")
        if animal.tag_number:
            lines.append(f"Tag: {animal.tag_number}")
        if animal.date_of_birth:
            lines.append(f"Date of birth: {animal.date_of_birth}")
        if animal.weight_kg:
            lines.append(f"Weight: {animal.weight_kg}kg")
        lines.append(
            f"Health status: {animal.health_status.capitalize() if animal.health_status else 'Healthy'}"
        )
        if animal.notes:
            lines.append(f"Notes: {animal.notes}")
        return "\n".join(lines)
