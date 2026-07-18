import logging
from io import BytesIO

from sqlmodel import Session

from app.crud import (
    authenticate,
    create_whatsapp_user,
    get_conversation_history,
    get_livestock_by_name_for_user,
    get_livestock_for_user,
    get_whatsapp_user_by_phone,
    save_whatsapp_message,
)
from app.models.whatsapp import WhatsAppMessageCreate, WhatsAppUser, WhatsAppUserCreate
from app.services.whatsapp.client import (
    download_media,
    mark_whatsapp_message_as_read,
    send_list_message,
    send_whatsapp_message,
)
from app.services.whatsapp.transcription import convert_speech_to_text

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {"english", "shona", "ndebele"}

ONBOARDING_STEPS: list[tuple[str, str]] = [
    (
        "animal_count",
        "How many animals do you currently have on your farm? (reply with a number)",
    ),
    ("district", "Which district are you located in?"),
    (
        "preferred_language",
        "What language do you prefer?\nReply with: English, Shona, or Ndebele",
    ),
    (
        "main_goal",
        "What is your main goal with V-Vet?\n"
        "For example: health tracking, breeding management, record keeping, or general advice.",
    ),
]

ONBOARDING_SYSTEM_PROMPT = (
    "You are VVet's onboarding agent for a farmer using WhatsApp. "
    "Review the recent conversation history and the user's current profile. "
    "Your goal is to collect these onboarding fields when they are available: full_name, animal_count, district, preferred_language, and main_goal. "
    "If the farmer provides one or more fields in one message, call the save-multiple-fields tool. "
    "If all required fields are available, call the complete onboarding tool. "
    "If the message is random or incomplete, ask one short clarifying question for the missing field that matters most. "
    "Keep replies short, clear, and friendly."
)

# ---------------------------------------------------------------------------
# Intent menu
# ---------------------------------------------------------------------------

# Row IDs returned by WhatsApp when a farmer taps a menu item.
# These become the message_body in the pipeline, so routing is a dict lookup.
INTENT_IDS: set[str] = {
    "register_animal",
    "record_birth",
    "record_death",
    "log_vaccination",
    "log_dipping",
    "log_deworming",
    "log_bull_soundness",
    "manage_weaning",
    "report_sickness",
    "request_vet",
    "my_animals",
    "weekly_summary",
}

# Words that trigger the main menu instead of the farmer agent.
_MENU_TRIGGERS: set[str] = {"menu", "help", "hi", "hello", "start", "options"}

MAIN_MENU_SECTIONS: list[dict] = [
    {
        "title": "Records",
        "rows": [
            {
                "id": "register_animal",
                "title": "Register Animal",
                "description": "Add a new animal to your herd",
            },
            {
                "id": "record_birth",
                "title": "Record Birth",
                "description": "Log a new calf born",
            },
            {
                "id": "record_death",
                "title": "Record Death",
                "description": "Log an animal death",
            },
        ],
    },
    {
        "title": "Treatments",
        "rows": [
            {"id": "log_vaccination", "title": "Log Vaccination"},
            {"id": "log_dipping", "title": "Log Dipping"},
            {"id": "log_deworming", "title": "Log Deworming"},
        ],
    },
    {
        "title": "Health & Support",
        "rows": [
            {
                "id": "report_sickness",
                "title": "Report Sickness",
                "description": "Describe symptoms for advice",
            },
            {
                "id": "request_vet",
                "title": "Request Vet Help",
                "description": "Connect with a veterinarian",
            },
        ],
    },
    {
        "title": "My Farm",
        "rows": [
            {
                "id": "my_animals",
                "title": "My Animals",
                "description": "View your herd",
            },
            {
                "id": "weekly_summary",
                "title": "Weekly Summary",
                "description": "Get a herd overview",
            },
        ],
    },
]

_ADD_ANIMAL_TRIGGERS = (
    "add animal",
    "add cow",
    "add cattle",
    "add goat",
    "add sheep",
    "add pig",
    "add poultry",
    "new animal",
    "register animal",
)


class WhatsAppConversationService:
    """Orchestrates the full inbound-message pipeline for WhatsApp conversations."""

    def process_message(
        self, *, session: Session, phone: str, message_obj: dict
    ) -> None:
        # Form submissions arrive as nfm_reply — handle before the normal text pipeline
        # because they carry their own routing identity via flow_token.
        if self._is_flow_submission(message_obj):
            self._handle_flow_submission(
                session=session, phone=phone, message_obj=message_obj
            )
            return

        message_body = self._extract_message_body(message_obj)
        if message_body is None:
            return

        self._mark_read(message_obj["id"])

        user = get_whatsapp_user_by_phone(session=session, phone=phone)
        if user is None:
            user = create_whatsapp_user(
                session=session,
                user_in=WhatsAppUserCreate(phone=phone),
            )
            self._send_and_persist(
                session=session, user=user, phone=phone, reply=self._welcome_message()
            )
            return

        save_whatsapp_message(
            session=session,
            user=user,
            msg_in=WhatsAppMessageCreate(
                phone=phone, role="farmer", content=message_body
            ),
        )

        new_lang = self._detect_language_change(message_body)
        if new_lang:
            reply = self._handle_language_change(
                user=user, language=new_lang, session=session
            )
            self._send_and_persist(session=session, user=user, phone=phone, reply=reply)
            return

        sync_creds = self._detect_sync_command(message_body)
        if sync_creds:
            email, password = sync_creds
            reply = self._handle_sync(
                user=user, email=email, password=password, session=session
            )
            self._send_and_persist(session=session, user=user, phone=phone, reply=reply)
            return

        if not user.is_fully_onboarded:
            reply = self._handle_onboarding(
                user=user, message_body=message_body, session=session
            )
            self._send_and_persist(session=session, user=user, phone=phone, reply=reply)
            return

        # Show menu on greetings / explicit "menu" request.
        if message_body.strip().lower() in _MENU_TRIGGERS:
            self._send_main_menu(phone=phone)
            self._persist_assistant(
                session=session,
                user=user,
                phone=phone,
                content="[Menu sent]",
            )
            return

        # Known intent from a menu tap — route to the right handler.
        if message_body in INTENT_IDS:
            reply = self._handle_intent(
                intent=message_body, user=user, session=session, phone=phone
            )
            if reply:
                self._send_and_persist(
                    session=session, user=user, phone=phone, reply=reply
                )
            else:
                # Flow form was sent — persist a record so history stays consistent.
                self._persist_assistant(
                    session=session,
                    user=user,
                    phone=phone,
                    content=f"[Form sent: {message_body}]",
                )
            return

        reply = self._handle_farmer_agent(
            user=user, message_body=message_body, session=session
        )
        self._send_and_persist(session=session, user=user, phone=phone, reply=reply)

    # ------------------------------------------------------------------
    # Private — message extraction
    # ------------------------------------------------------------------

    def _extract_message_body(self, message_obj: dict) -> str | None:
        msg_type: str = message_obj.get("type", "")

        if msg_type == "text":
            return message_obj.get("text", {}).get("body", "").strip() or None

        if msg_type == "audio":
            audio_url: str | None = message_obj.get("audio", {}).get("url")
            if not audio_url:
                logger.warning("[WhatsApp] Audio message missing URL")
                return None
            audio_bytes = download_media(audio_url)
            if audio_bytes is None:
                logger.warning("[WhatsApp] Failed to download audio from %s", audio_url)
                return None
            return convert_speech_to_text(BytesIO(audio_bytes))

        if msg_type == "interactive":
            interactive = message_obj.get("interactive", {})
            kind = interactive.get("type", "")

            if kind == "list_reply":
                # Farmer tapped a menu item — return the row ID directly.
                return interactive.get("list_reply", {}).get("id")

            if kind == "button_reply":
                # Farmer tapped a quick-reply button — return the button ID.
                return interactive.get("button_reply", {}).get("id")

            if kind == "nfm_reply":
                # WhatsApp Flow form submitted — return raw JSON string.
                return interactive.get("nfm_reply", {}).get("response_json")

        return None

    # ------------------------------------------------------------------
    # Private — Meta API helpers
    # ------------------------------------------------------------------

    def _mark_read(self, message_id: str) -> None:
        response = mark_whatsapp_message_as_read(message_id)
        if response.status_code != 200:
            logger.warning(
                "[WhatsApp] Failed to mark as read %s: %s",
                response.status_code,
                response.text,
            )

    def _send_and_persist(
        self, *, session: Session, user: WhatsAppUser, phone: str, reply: str
    ) -> None:
        self._persist_assistant(session=session, user=user, phone=phone, content=reply)
        response = send_whatsapp_message(phone=phone, text=reply)
        if response.status_code != 200:
            logger.warning(
                "[WhatsApp] Send failed %s: %s", response.status_code, response.text
            )

    def _persist_assistant(
        self, *, session: Session, user: WhatsAppUser, phone: str, content: str
    ) -> None:
        save_whatsapp_message(
            session=session,
            user=user,
            msg_in=WhatsAppMessageCreate(
                phone=phone, role="assistant", content=content
            ),
        )

    def _send_main_menu(self, *, phone: str) -> None:
        response = send_list_message(
            phone=phone,
            body="What would you like to do today?",
            button_label="View Menu",
            sections=MAIN_MENU_SECTIONS,
        )
        if response.status_code != 200:
            logger.warning(
                "[WhatsApp] Menu send failed %s: %s",
                response.status_code,
                response.text,
            )

    # ------------------------------------------------------------------
    # Private — WhatsApp Flow form handling
    # ------------------------------------------------------------------

    @staticmethod
    def _is_flow_submission(message_obj: dict) -> bool:
        return (
            message_obj.get("type") == "interactive"
            and message_obj.get("interactive", {}).get("type") == "nfm_reply"
        )

    def _handle_flow_submission(
        self, *, session: Session, phone: str, message_obj: dict
    ) -> None:
        import json
        from app.flows import FLOW_REGISTRY

        self._mark_read(message_obj["id"])

        raw = message_obj["interactive"]["nfm_reply"].get("response_json", "{}")
        try:
            payload = json.loads(raw)
        except ValueError:
            logger.warning("[WhatsApp] Could not parse nfm_reply JSON: %s", raw)
            return

        if not isinstance(payload, dict):
            logger.warning("[WhatsApp] nfm_reply JSON was not an object: %s", raw)
            return

        flow_token = payload.get("flow_token")
        data = payload.get("data")
        if isinstance(data, dict):
            data = dict(data)
        else:
            data = dict(payload)

        data.pop("flow_token", None)
        data.pop("screen", None)
        data.pop("version", None)

        if not flow_token:
            flow_token = data.pop("flow_token", None)

        if not flow_token:
            logger.warning("[WhatsApp] nfm_reply missing flow_token")
            return

        user = get_whatsapp_user_by_phone(session=session, phone=phone)
        if user is None:
            logger.warning("[WhatsApp] nfm_reply from unknown phone %s", phone)
            return

        save_whatsapp_message(
            session=session,
            user=user,
            msg_in=WhatsAppMessageCreate(
                phone=phone, role="farmer", content=f"[Form: {flow_token}] {raw}"
            ),
        )

        flow = FLOW_REGISTRY.get(flow_token)
        if flow is None:
            logger.warning("[WhatsApp] No handler for flow_token '%s'", flow_token)
            return

        reply = flow.handle(data=data, user=user, session=session)
        self._send_and_persist(session=session, user=user, phone=phone, reply=reply)

    # ------------------------------------------------------------------
    # Private — intent routing
    # ------------------------------------------------------------------

    def _handle_intent(
        self, *, intent: str, user: WhatsAppUser, session: Session, phone: str
    ) -> str | None:
        """
        Route a known intent ID to its handler.

        Flows that launch a WhatsApp Form call flow.start() and return None
        (the reply is the form itself, not a text message).
        Unimplemented intents fall back to the farmer agent.
        """
        from app.flows import FLOW_REGISTRY

        # If the intent maps to a registered Flow, try to send the form.
        # If the form can't be sent (no flow ID configured, Meta API error),
        # fall through to the farmer agent which guides them step by step.
        flow = FLOW_REGISTRY.get(intent)
        if flow and flow.start(phone=phone):
            return None  # form sent — no additional text reply needed

        # Fallback: farmer agent handles anything not yet a dedicated flow.
        intent_labels = {
            "record_birth": "record a birth",
            "record_death": "record a death",
            "log_vaccination": "log a vaccination",
            "log_dipping": "log a dipping treatment",
            "log_deworming": "log a deworming treatment",
            "log_bull_soundness": "log a bull soundness evaluation",
            "manage_weaning": "manage weaning",
            "report_sickness": "report a sick animal",
            "request_vet": "request vet help",
            "my_animals": "list my animals",
            "weekly_summary": "get a weekly summary",
        }
        label = intent_labels.get(intent, intent)
        return self._handle_farmer_agent(
            user=user,
            message_body=f"I want to {label}",
            session=session,
        )

    # ------------------------------------------------------------------
    # Private — language change
    # ------------------------------------------------------------------

    def _detect_language_change(self, message_body: str) -> str | None:
        text = message_body.strip().lower().rstrip(".")
        for prefix in ("language:", "language"):
            if text.startswith(prefix):
                text = text[len(prefix) :].strip()
                break
        return text.capitalize() if text in SUPPORTED_LANGUAGES else None

    def _handle_language_change(
        self, *, user: WhatsAppUser, language: str, session: Session
    ) -> str:
        user.preferred_language = language
        session.add(user)
        session.commit()
        return (
            f"Language updated to {language}. I'll respond in {language} from now on."
        )

    # ------------------------------------------------------------------
    # Private — account sync (legacy manual link)
    # ------------------------------------------------------------------

    def _detect_sync_command(self, message_body: str) -> tuple[str, str] | None:
        text = message_body.strip()
        for prefix in ("sync ", "link "):
            if text.lower().startswith(prefix):
                parts = text[len(prefix) :].strip().split(None, 1)
                if len(parts) == 2:
                    return parts[0], parts[1]
        return None

    def _handle_sync(
        self, *, user: WhatsAppUser, email: str, password: str, session: Session
    ) -> str:
        web_user = authenticate(session=session, email=email, password=password)
        if web_user is None:
            return "Wrong email or password. Please try again:\nsync your@email.com yourpassword"
        user.linked_user_id = web_user.id
        session.add(user)
        session.commit()
        name = web_user.full_name or email
        return (
            f"Account linked! Welcome, {name}.\n\n"
            "You can now ask about your livestock. Try:\n"
            "• *cows* — list your first 10 animals\n"
            "• *cow <name>* — get full details on a specific animal"
        )

    # ------------------------------------------------------------------
    # Private — onboarding
    # ------------------------------------------------------------------

    def _handle_onboarding(
        self, *, user: WhatsAppUser, message_body: str, session: Session
    ) -> str:
        from app.core import openai as openai_helpers

        history = get_conversation_history(session=session, phone=user.phone, limit=10)
        return openai_helpers.run_onboarding_agent(
            system_prompt=f"{ONBOARDING_SYSTEM_PROMPT}\n\nLatest incoming message: {message_body}",
            user=user,
            history=history,
            session=session,
            limit=10,
        )

    # ------------------------------------------------------------------
    # Private — farmer agent
    # ------------------------------------------------------------------

    def _handle_farmer_agent(
        self, *, user: WhatsAppUser, message_body: str, session: Session
    ) -> str:
        from app.core import openai as openai_helpers

        if not user.is_adding_animal:
            lower = message_body.strip().lower()
            if any(trigger in lower for trigger in _ADD_ANIMAL_TRIGGERS):
                user.is_adding_animal = True
                session.add(user)
                session.commit()

        history = get_conversation_history(session=session, phone=user.phone, limit=20)
        return openai_helpers.run_farmer_agent(
            user=user, history=history, session=session
        )

    # ------------------------------------------------------------------
    # Private — static message builders
    # ------------------------------------------------------------------

    @staticmethod
    def _welcome_message() -> str:
        return (
            "👋 Welcome to V-Vet!\n\n"
            "I help farmers like you keep animals healthy and productive.\n\n"
            "💬 You can send me:\n"
            "- Photos or videos of sick animals\n"
            "- Questions about your livestock\n"
            "- Reports when animals are born, sick, or treated\n\n"
            "I'll help you fast - and connect you to a vet when needed.\n\n"
            "Ready to start? Reply YES to set up your farm (takes 2 minutes)."
        )

    @staticmethod
    def _returning_incomplete_message(user: WhatsAppUser) -> str:
        name = user.full_name or "there"
        for field, question in ONBOARDING_STEPS:
            if getattr(user, field) is None:
                return (
                    f"Hi {name}, welcome back to V-Vet!\n\n"
                    f"Let's finish setting up your profile.\n\n{question}"
                )
        return f"Hi {name}, welcome back! How can I help you today?"
