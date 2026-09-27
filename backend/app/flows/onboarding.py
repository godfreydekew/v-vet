import logging

from sqlmodel import Session

from app.flows.base import BaseFlow
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.client import send_flow_message, send_whatsapp_message
from app.services.whatsapp.menu import send_main_menu

logger = logging.getLogger(__name__)


class OnboardingFlow(BaseFlow):
    flow_id = "onboarding"

    def start(self, phone: str, user: WhatsAppUser, session: Session) -> bool:
        from app.core.config import settings

        if not settings.FLOW_ID_ONBOARDING:
            logger.warning("[OnboardingFlow] FLOW_ID_ONBOARDING not configured — sending fallback text.")
            response = send_whatsapp_message(
                phone=phone,
                text="Registration is being set up, please try again shortly.",
            )
            return response.status_code == 200

        response = send_flow_message(
            phone=phone,
            flow_id=settings.FLOW_ID_ONBOARDING,
            flow_token=self.flow_id,
            body="Let's get your farm set up. \n\nWe will collect some basic information about your farm and your animals. This will help us assist you better.",
            cta="Join V-Vet",
            screen="ONBOARDING",
        )
        return response.status_code == 200

    def handle(self, data: dict, user: WhatsAppUser, session: Session) -> str:
        from app.core.openai import complete_onboarding, save_onboarding_fields

        fields = {
            "full_name": (data.get("full_name") or "").strip() or None,
            "district": (data.get("district") or "").strip() or None,
            "preferred_language": (data.get("preferred_language") or "").strip() or None,
            "main_goal": (data.get("main_goal") or "").strip() or None,
            "animal_count": data.get("animal_count"),
        }
        user = save_onboarding_fields(session=session, user=user, fields=fields)
        user = complete_onboarding(session=session, user=user)

        name = user.full_name or "there"
        welcome = (
            f"🎉 You're all set, {name}! Welcome to V-Vet.\n\n"
            "Tap *View Menu* below to register your first animal or see "
            "everything V-Vet can do."
        )
        menu_sent = send_main_menu(phone=user.phone, body=welcome)
        if menu_sent:
            return ""
        return welcome
