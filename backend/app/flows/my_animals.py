import logging
import uuid
from datetime import date

from sqlmodel import Session

from app.flows.animal_list import send_interactive_animal_list
from app.flows.base import BaseFlow
from app.models.health_observation import HealthObservation
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
        """
        Process the farmer tapping an animal to view its details.
        """
        from app.crud import get_livestock_by_id_for_user, get_observations_for_livestock, list_livestock_images

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

        observations = get_observations_for_livestock(session=session, livestock_id=animal.id)
        profile_text = self._format_details(animal, observations)

        images = list_livestock_images(session=session, livestock_id=animal.id)
        if images:
            from app.services.whatsapp.client import send_whatsapp_image

            caption = profile_text
            if len(caption) > 1024:
                caption = caption[:1000].rstrip() + "…"

            response = send_whatsapp_image(
                phone=user.phone, image_url=images[0].image_url, caption=caption
            )
            if response.status_code == 200:
                return ""
            logger.warning(
                "[MyAnimalsFlow] Image send failed %s: %s — falling back to text.",
                response.status_code, response.text,
            )

        return profile_text

    @staticmethod
    def _format_details(animal: Livestock, observations: list[HealthObservation]) -> str:
        name = animal.name or animal.tag_number or "Unnamed animal"
        lines = [f"*{name}* 🐄", ""]
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

        lines += ["", "*Recent Health Observations*"]
        if observations:
            today = date.today()
            for obs in observations:
                days_ago = (today - obs.observed_at.date()).days
                if days_ago <= 0:
                    when = "Today"
                elif days_ago == 1:
                    when = "Yesterday"
                else:
                    when = f"{days_ago} days ago"
                summary = obs.symptoms or obs.notes or "No details recorded"
                lines.append(f"📅 {when} — {summary}")
        else:
            lines.append("_No health observations recorded yet._")

        return "\n".join(lines)
