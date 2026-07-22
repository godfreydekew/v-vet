import logging

from sqlmodel import Session

from app.core.config import settings
from app.flows.base import BaseFlow
from app.models.whatsapp import WhatsAppMessageCreate, WhatsAppUser
from app.services.whatsapp.client import send_flow_message

logger = logging.getLogger(__name__)


class RegisterAnimalFlow(BaseFlow):
    """
    Sends a WhatsApp Flow form with all animal fields at once.
    When the farmer submits, the clean JSON is passed to the farmer agent
    which validates and saves the record.
    """

    flow_id = "register_animal"

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        if not settings.FLOW_ID_REGISTER_ANIMAL:
            logger.warning("[RegisterAnimalFlow] FLOW_ID_REGISTER_ANIMAL not configured — falling back to agent.")
            return False
        response = send_flow_message(
            phone=phone,
            flow_id=settings.FLOW_ID_REGISTER_ANIMAL,
            flow_token=self.flow_id,
            body="Fill in your animal's details. All fields except Species are optional.",
            cta="Register Animal",
            screen="REGISTER_ANIMAL",
        )
        logger.info(f"[RegisterAnimalFlow] Sent flow to {phone}: {response.status_code} — {response.text}")
        if response.status_code != 200:
            logger.warning(
                "[RegisterAnimalFlow] Failed to send flow %s: %s — falling back to agent.",
                response.status_code,
                response.text,
            )
            return False
        return True

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        from app.core import openai as openai_helpers
        from app.crud import get_conversation_history, save_whatsapp_message

        logger.info("[RegisterAnimalFlow] Handling flow submission for %s: %s", user.phone, data)

        fields = []
        if data.get("name"):
            fields.append(f"name: {data['name']}")
        if data.get("species"):
            fields.append(f"species: {data['species']}")
        if data.get("breed"):
            fields.append(f"breed: {data['breed']}")
        if data.get("gender"):
            fields.append(f"gender: {data['gender']}")
        if data.get("date_of_birth"):
            fields.append(f"date of birth: {data['date_of_birth']}")
        if data.get("weight_kg"):
            fields.append(f"weight: {data['weight_kg']}kg")

        photo = data.get("animal_photo")
        if photo:
            logger.info("[RegisterAnimalFlow] Received animal photo(s) for %s: %s", user.phone, photo)

        # If date of birth was not provided we can't generate a tag yet.
        # Save the partial details to history, flag the user as mid-registration,
        # and ask for an age estimate. The next message goes through the farmer
        # agent which has the today-aware hint and will calculate a DOB.
        if not data.get("date_of_birth"):
            partial = "Register this animal — " + ", ".join(fields) if fields else "Register an animal."
            save_whatsapp_message(
                session=session,
                user=user,
                msg_in=WhatsAppMessageCreate(phone=user.phone, role="farmer", content=partial),
            )
            user.is_adding_animal = True
            session.add(user)
            session.commit()
            return (
                "Almost done! One more thing — I need your animal's approximate age to complete the registration.\n\n"
                "How old is the animal? For example: *2 years old*, *6 months*, *born around 2022*"
            )

        if fields:
            message = "Register this animal — " + ", ".join(fields)
        else:
            message = "Register an unnamed cattle animal."

        history = get_conversation_history(session=session, phone=user.phone, limit=10)
        return openai_helpers.run_farmer_agent(
            user=user,
            history=history,
            session=session,
            extra_user_message=message,
        )
