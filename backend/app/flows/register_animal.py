import logging
from datetime import date, datetime, timezone
from typing import Any

from sqlmodel import Session

from app.core.config import settings
from app.flows.base import BaseFlow
from app.models.conversation_state import ConversationState
from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppMessageCreate, WhatsAppUser
from app.services.whatsapp.client import send_flow_message

logger = logging.getLogger(__name__)


STEP_FORM_SENT = "form_sent"
STEP_DONE = "done"

SAVE_FAILED_MESSAGE = "Sorry, something went wrong saving your animal. Please try again from the *menu*."


class RegisterAnimalFlow(BaseFlow):
    """
    Sends a WhatsApp Flow form with all animal fields at once.
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
            body="Fill in your animal's details. All fields are optional.",
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

        if settings.USE_FARMER_AGENT:
            from app.assistant.state import start_state

            start_state(session=session, user=user, flow=self.flow_id, step=STEP_FORM_SENT)
        return True

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        from app.core import openai as openai_helpers
        from app.crud import get_conversation_history, save_whatsapp_message

        logger.info("[RegisterAnimalFlow] Handling flow submission for %s: %s", user.phone, data)

        if settings.USE_FARMER_AGENT:
            return self._register_from_form(data=data, user=user, session=session)

        fields = []
        if data.get("name"):
            fields.append(f"name: {data['name']}")
        else:
            fields.append("name: null (unnamed)")
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
            try:
                from app.services.storage import upload_livestock_image_bytes
                from app.services.whatsapp_flow_media import (
                    download_whatsapp_flow_media,
                )

                download_res = download_whatsapp_flow_media(photo)
                if download_res:
                    img_bytes, ctype, fname = download_res
                    s3_url = upload_livestock_image_bytes(img_bytes, filename=fname, content_type=ctype)
                    if s3_url:
                        user.pending_animal_photo_url = s3_url
                        session.add(user)
                        session.commit()
                        logger.info("[RegisterAnimalFlow] Saved pending_animal_photo_url for %s: %s", user.phone, s3_url)
            except Exception as err:
                logger.exception("[RegisterAnimalFlow] Failed processing animal photo for %s: %s", user.phone, err)

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

    def describe(self, state: ConversationState) -> str:
        minutes = int((datetime.now(timezone.utc) - state.started_at).total_seconds() // 60)
        return (
            f"Registering an animal: V-Vet sent the registration form {minutes} minutes ago "
            "and the farmer hasn't submitted it yet."
        )

    def _register_from_form(self, *, data: dict[str, Any], user: WhatsAppUser, session: Session) -> str:
        """Save the animal from the submitted form and close the farmer's register_animal state."""
        from app.assistant.state import (
            close_state,
            get_active_state,
            start_state,
            update_state,
        )
        from app.crud import create_livestock_from_whatsapp

        if not user.linked_user_id or not user.district:
            return "Sorry, your account isn't fully set up yet, so I can't register animals."

        state = get_active_state(session=session, user=user)
        if state is None or state.flow != self.flow_id:
            # A form submitted from an older message: record it as its own attempt.
            state = start_state(session=session, user=user, flow=self.flow_id, step=STEP_FORM_SENT)

        # The form sends every field as text, with "" for anything left empty.
        name = data.get("name") or None
        breed = data.get("breed") or None
        gender = data.get("gender") or None
        weight_kg = float(data["weight_kg"]) if data.get("weight_kg") else None
        date_of_birth = date.fromisoformat(data["date_of_birth"]) if data.get("date_of_birth") else None

        try:
            animal = create_livestock_from_whatsapp(
                session=session,
                user_id=user.linked_user_id,
                district=user.district,
                name=name,
                gender=gender,
                breed=breed,
                weight_kg=weight_kg,
                date_of_birth=date_of_birth,
            )
        except Exception:
            logger.exception("[RegisterAnimalFlow] Saving the animal failed for %s", user.phone)
            session.rollback()
            close_state(session=session, state=state, status="failed")
            return SAVE_FAILED_MESSAGE

        # The form only sends a WhatsApp reference to the photo: download it, store it,
        # and link it to the animal. A photo problem must not fail the registration.
        photo_url = _upload_photo(data.get("animal_photo"), phone=user.phone)
        if photo_url:
            try:
                _attach_photo(session=session, animal=animal, photo_url=photo_url)
            except Exception:
                logger.exception("[RegisterAnimalFlow] Attaching the photo failed for %s", animal.id)
                session.rollback()

        submitted = {
            "name": name,
            "breed": breed,
            "gender": gender,
            "weight_kg": weight_kg,
            "date_of_birth": date_of_birth.isoformat() if date_of_birth else None,
            "livestock_id": str(animal.id),
        }
        update_state(session=session, state=state, step=STEP_DONE, data=submitted)
        close_state(session=session, state=state, status="completed")
        return _confirmation_message(animal)


def _upload_photo(photo: object, *, phone: str) -> str | None:
    """Download the form's photo from WhatsApp and store it. Returns its URL, or None."""
    if not photo:
        return None
    try:
        from app.services.storage import upload_livestock_image_bytes
        from app.services.whatsapp_flow_media import download_whatsapp_flow_media

        downloaded = download_whatsapp_flow_media(photo)
        if downloaded is None:
            return None
        image_bytes, content_type, filename = downloaded
        return upload_livestock_image_bytes(image_bytes, filename=filename, content_type=content_type)
    except Exception:
        # A missing photo shouldn't stop the animal being registered.
        logger.exception("[RegisterAnimalFlow] Photo upload failed for %s", phone)
        return None


def _attach_photo(*, session: Session, animal: Livestock, photo_url: str) -> None:
    from app.crud import create_livestock_image
    from app.models.livestock_image import LivestockImageCreate
    from app.services.storage import move_pending_image_to_livestock

    final_url = move_pending_image_to_livestock(pending_url=photo_url, livestock_id=animal.id) or photo_url
    create_livestock_image(
        session=session,
        livestock_id=animal.id,
        image_in=LivestockImageCreate(image_url=final_url, is_primary=True),
    )


def _confirmation_message(animal: Livestock) -> str:
    title = f"*{animal.name}* is registered" if animal.name else "Your animal is registered"
    lines = [f"✅ {title}.", "", f"Tag: {animal.tag_number}"]
    if animal.breed:
        lines.append(f"Breed: {animal.breed}")
    if animal.gender:
        lines.append(f"Gender: {animal.gender.capitalize()}")
    lines.append(f"Date of birth: {animal.date_of_birth}" if animal.date_of_birth else "Date of birth: not given")
    if animal.weight_kg:
        lines.append(f"Weight: {animal.weight_kg:g}kg")
    return "\n".join(lines)
