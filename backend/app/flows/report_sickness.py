import logging
import uuid

from sqlmodel import Session

from app.flows.base import BaseFlow
from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_list_message

logger = logging.getLogger(__name__)


class ReportSicknessFlow(BaseFlow):
    """
    Sends the farmer's registered animals as a WhatsApp interactive list.
    When the farmer taps one, handle_selection() pins the animal on the
    WhatsAppUser record so the farmer agent knows which animal the
    follow-up symptom description refers to, instead of re-inferring it
    from chat history.

    WhatsApp list messages cap out at 10 rows total, so herds larger than
    that are paginated: PAGE_SIZE animals per page, plus one "show more" row.

    This flow does not use native WhatsApp Flow forms (nfm_reply), so
    handle() is never called by the pipeline's form-submission path.
    """

    flow_id = "report_sickness"

    # WhatsApp list messages allow at most 10 rows total. Reserve one row
    # for "Show more animals" whenever there's a next page.
    PAGE_SIZE = 9
    MAX_ANIMALS = 100

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        return self._send_animal_page(phone=phone, user=user, session=session, offset=0)

    def show_more(self, *, offset: int, phone: str, user: WhatsAppUser, session: Session) -> bool:
        """Send the next page of animals, triggered by the 'Show more animals' row."""
        return self._send_animal_page(phone=phone, user=user, session=session, offset=offset)

    def _send_animal_page(
        self, *, phone: str, user: WhatsAppUser, session: Session, offset: int
    ) -> bool:
        from app.crud import get_livestock_for_user

        if not user.linked_user_id:
            return False

        animals = get_livestock_for_user(
            session=session, user_id=user.linked_user_id, limit=self.MAX_ANIMALS
        )
        if not animals:
            return False

        page = animals[offset : offset + self.PAGE_SIZE]
        if not page:
            # Offset ran past the end (e.g. herd shrank mid-conversation) — restart at page one.
            offset = 0
            page = animals[: self.PAGE_SIZE]

        next_offset = offset + self.PAGE_SIZE
        has_more = next_offset < len(animals)

        rows = [self._animal_row(a) for a in page]
        if has_more:
            rows.append(
                {
                    "id": f"sickness_more_{next_offset}",
                    "title": "Show more animals",
                    "description": f"{len(animals) - next_offset} more in your herd",
                }
            )

        sections = [{"title": "Your Registered Animals", "rows": rows}]

        body = (
            "I am so sorry your animal is not feeling well. 💙\n\nPlease select which animal is sick from your herd list below:"
            if offset == 0
            else "Here are more of your animals — select the one that's sick:"
        )

        response = send_list_message(
            phone=phone,
            body=body,
            button_label="Select Animal",
            sections=sections,
        )
        return response.status_code == 200

    @staticmethod
    def _animal_row(a: Livestock) -> dict:
        title = a.name if a.name else f"Tag: {a.tag_number}"
        species_str = a.species.capitalize() if a.species else "Cattle"
        health_str = a.health_status.capitalize() if a.health_status else "Healthy"
        desc = f"{species_str} • {health_str}"
        if a.tag_number and a.name:
            desc += f" • Tag: {a.tag_number}"
        return {
            "id": f"select_animal_{a.id}",
            "title": title[:24],
            "description": desc[:72],
        }

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
        session.add(user)
        session.commit()

        animal_name = animal.name or animal.tag_number
        return (
            f"Thank you. I have selected **{animal_name}** ({animal.species}). 💙\n\n"
            "Please describe what symptoms or health problems you have noticed (e.g. not eating, coughing, limping).\n\n"
            "⚠️ *Emergency check*: Is the animal unable to stand, struggling to breathe, having fits, or bleeding heavily?"
        )
