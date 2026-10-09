import logging
from datetime import datetime, timezone
from typing import Any

from pydantic import ValidationError
from sqlmodel import Session

from app.core.config import settings
from app.flows.base import BaseFlow
from app.models.conversation_state import ConversationState
from app.models.flows import RegisterAnimalForm
from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_flow_message

logger = logging.getLogger(__name__)


STEP_FORM_SENT = "form_sent"
STEP_DONE = "done"

SAVE_FAILED_MESSAGE = "Sorry, something went wrong saving your animal. Please try again from the *menu*."
FORM_INVALID_MESSAGE = (
    "Sorry, some details in the form weren't right. Please tap *Register Animal* in the *menu* to try again."
)


class RegisterAnimalFlow(BaseFlow):
    """
    Sends a WhatsApp Flow form with all animal fields at once.
    """

    flow_id = "register_animal"

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        if not settings.FLOW_ID_REGISTER_ANIMAL:
            logger.warning("[RegisterAnimalFlow] FLOW_ID_REGISTER_ANIMAL not configured")
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
                "[RegisterAnimalFlow] Failed to send flow %s: %s",
                response.status_code,
                response.text,
            )
            return False

        self.start_tracking(session=session, user=user, step=STEP_FORM_SENT)
        return True

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        logger.info("[RegisterAnimalFlow] Handling flow submission for %s: %s", user.phone, data)

        try:
            form = RegisterAnimalForm.model_validate(data)
        except ValidationError as error:
            logger.warning("[RegisterAnimalFlow] Invalid form from %s: %s", user.phone, error)
            self._close_active_state_as_failed(session=session, user=user)
            return FORM_INVALID_MESSAGE

        return self._register_from_form(form=form, user=user, session=session)

    def describe(self, state: ConversationState) -> str:
        minutes = int((datetime.now(timezone.utc) - state.started_at).total_seconds() // 60)
        return (
            f"Registering an animal: V-Vet sent the registration form {minutes} minutes ago "
            "and the farmer hasn't submitted it yet."
        )

    def _close_active_state_as_failed(self, *, session: Session, user: WhatsAppUser) -> None:
        from app.assistant.state import close_state, get_active_state

        state = get_active_state(session=session, user=user)
        if state is not None and state.flow == self.flow_id:
            close_state(session=session, state=state, status="failed")

    def _register_from_form(self, *, form: RegisterAnimalForm, user: WhatsAppUser, session: Session) -> str:
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

        try:
            animal = create_livestock_from_whatsapp(
                session=session,
                user_id=user.linked_user_id,
                district=user.district,
                name=form.name,
                gender=form.gender,
                breed=form.breed,
                weight_kg=form.weight_kg,
                date_of_birth=form.date_of_birth,
            )
        except Exception:
            logger.exception("[RegisterAnimalFlow] Saving the animal failed for %s", user.phone)
            session.rollback()
            close_state(session=session, state=state, status="failed")
            return SAVE_FAILED_MESSAGE

        if form.animal_photo:
            _save_photo(session=session, animal=animal, photo=form.animal_photo)

        submitted = form.model_dump(mode="json", exclude={"animal_photo"})
        submitted["livestock_id"] = str(animal.id)
        update_state(session=session, state=state, step=STEP_DONE, data=submitted)
        close_state(session=session, state=state, status="completed")
        return _confirmation_message(animal)


def _save_photo(*, session: Session, animal: Livestock, photo: Any) -> None:
    """Store the form's photo in the animal's folder and make it the animal's main photo.

    The form only sends a WhatsApp reference to the photo, so it is downloaded first.
    A photo problem is logged and skipped: it must not fail the registration.
    """
    from app.crud import create_livestock_image
    from app.models.livestock_image import LivestockImageCreate
    from app.services.storage import upload_livestock_image_bytes
    from app.services.whatsapp_flow_media import download_whatsapp_flow_media

    try:
        downloaded = download_whatsapp_flow_media(photo)
        if downloaded is None:
            return
        image_bytes, content_type, filename = downloaded
        image_url = upload_livestock_image_bytes(
            image_bytes, filename=filename, content_type=content_type, livestock_id=str(animal.id)
        )
        if image_url is None:
            return
        create_livestock_image(
            session=session,
            livestock_id=animal.id,
            image_in=LivestockImageCreate(image_url=image_url, is_primary=True),
        )
    except Exception:
        logger.exception("[RegisterAnimalFlow] Saving the photo failed for %s", animal.id)
        session.rollback()


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
