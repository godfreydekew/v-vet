import logging
from io import BytesIO

import requests
from elevenlabs.client import ElevenLabs
from sqlmodel import Session

from app.core.config import settings
from app.models.whatsapp import WhatsAppMessage, WhatsAppUser

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are VVet, a helpful WhatsApp assistant for livestock farmers and veterinary support. "
    "Answer questions about cattle, sheep, goats, poultry, and other farm animals — health, feeding, "
    "breeding, behaviour, injuries, symptoms, and day-to-day farm care. "
    "Keep replies practical, clear, and concise (under 200 words). "
    "If the user greets you, respond briefly and ask what they need help with. "
    "If the question is unclear, ask one focused follow-up question. "
    "Do not invent facts. If a situation may need a veterinarian, say so plainly."
)

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
# Onboarding configuration

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


# ---------------------------------------------------------------------------
# Meta Cloud API — send message
# ---------------------------------------------------------------------------


def send_whatsapp_message(phone: str, text: str) -> requests.Response:
    """Send a WhatsApp text message via the Meta Cloud API."""
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
        raise RuntimeError("WhatsApp configuration is missing in settings.")
    
    url = (
        f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": text},
    }
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    return response

def mark_whatsapp_message_as_read(message_id: str) -> requests.Response:
    """Mark a message as read via Meta cloud API."""
    if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
            raise RuntimeError("WhatsApp configuration is missing in settings.")
    url = (
        f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "status": "read",
        "message_id": message_id,
    }
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    return response

def generate_ai_response(
    message: str,
    history: list[WhatsAppMessage],
    user: WhatsAppUser,
) -> str:
    from app.core.openai import client as openai_client

    # Personalise system prompt with known user details.
    user_context_parts = []
    if user.preferred_language and user.preferred_language.lower() != "english":
        user_context_parts.append(
            f"The farmer prefers {user.preferred_language} — respond in that language when possible."
        )
    if user.district:
        user_context_parts.append(f"The farmer is located in {user.district}.")
    if user.animal_count is not None:
        user_context_parts.append(
            f"They have {user.animal_count} animals on their farm."
        )
    if user.main_goal:
        user_context_parts.append(f"Their main goal is: {user.main_goal}.")

    system_content = SYSTEM_PROMPT
    if user_context_parts:
        system_content += "\n\nFarmer profile: " + " ".join(user_context_parts)

    messages: list[dict] = [{"role": "system", "content": system_content}]

    for msg in history:
        openai_role = "user" if msg.role == "farmer" else "assistant"
        messages.append({"role": openai_role, "content": msg.content})

    messages.append({"role": "user", "content": message})

    completion = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=300,
    )
    return completion.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Farmer agent
# ---------------------------------------------------------------------------

_ADD_ANIMAL_TRIGGERS = (
    "add animal", "add cow", "add cattle", "add goat", "add sheep",
    "add pig", "add poultry", "new animal", "register animal",
)


def handle_farmer_agent(
    user: WhatsAppUser,
    message_body: str,
    session: Session,
) -> str:
    """Route all onboarded-farmer messages through the unified farmer agent."""
    from app.core import openai as openai_helpers
    from app.crud import get_conversation_history

    # Set the flag on the first message of an add-animal flow so the agent
    # knows to keep collecting details on subsequent turns.
    if not user.is_adding_animal:
        lower = message_body.strip().lower()
        if any(trigger in lower for trigger in _ADD_ANIMAL_TRIGGERS):
            user.is_adding_animal = True
            session.add(user)
            session.commit()

    history = get_conversation_history(session=session, phone=user.phone, limit=20)
    return openai_helpers.run_farmer_agent(
        user=user,
        history=history,
        session=session,
    )


# ---------------------------------------------------------------------------
# Onboarding helpers
# ---------------------------------------------------------------------------


def _next_onboarding_step(user: WhatsAppUser) -> tuple[str, str] | None:
    """
    Return (field_name, question_text) for the first unanswered onboarding field,
    or None if every field has been answered.
    """
    for field, question in ONBOARDING_STEPS:
        if getattr(user, field) is None:
            return field, question
    return None


def handle_onboarding(
    user: WhatsAppUser,
    message_body: str,
    session: Session,
) -> str:
    """Run the onboarding agent over the recent WhatsApp conversation history."""
    from app.core import openai as openai_helpers
    from app.crud import get_conversation_history

    history = get_conversation_history(session=session, phone=user.phone, limit=10)
    return openai_helpers.run_onboarding_agent(
        system_prompt=f"{ONBOARDING_SYSTEM_PROMPT}\n\nLatest incoming message: {message_body}",
        user=user,
        history=history,
        session=session,
        limit=10,
    )


def get_welcome_message() -> str:
    # _, first_question = ONBOARDING_STEPS[0]
    welcome_message = """👋 Welcome to V-Vet!

    I help farmers like you keep animals healthy and productive.

    💬 You can send me:
    - Photos or videos of sick animals
    - Questions about your livestock
    - Reports when animals are born, sick, or treated

    I'll help you fast - and connect you to a vet when needed.

    Ready to start? Reply YES to set up your farm (takes 2 minutes)."""

    return welcome_message


SUPPORTED_LANGUAGES = {"english", "shona", "ndebele"}


def detect_language_change(message_body: str) -> str | None:
    text = message_body.strip().lower().rstrip(".")

    # Strip optional "language" keyword and colon prefix.
    for prefix in ("language:", "language"):
        if text.startswith(prefix):
            text = text[len(prefix) :].strip()
            break

    if text in SUPPORTED_LANGUAGES:
        return text.capitalize()
    return None


def handle_language_change(user: WhatsAppUser, language: str, session: Session) -> str:
    """Save the new language preference and return a confirmation message."""
    user.preferred_language = language
    session.add(user)
    session.commit()
    return f"Language updated to {language}. I'll respond in {language} from now on."


def get_returning_incomplete_message(user: WhatsAppUser) -> str:
    """
    Message for a user who previously registered but never completed onboarding.
    Greets them by name and resumes from where they left off.
    """
    name = user.full_name or "there"
    next_step = _next_onboarding_step(user)
    if next_step:
        _, question = next_step
        return (
            f"Hi {name}, welcome back to V-Vet!\n\n"
            f"Let's finish setting up your profile.\n\n{question}"
        )
    # Edge case: all fields filled but flag not set — shouldn't normally happen.
    return f"Hi {name}, welcome back! How can I help you today?"


def convert_speech_to_text(audio_file) -> str:
    elevenlabs_api_key = settings.ELEVENLABS_API_KEY
    client = ElevenLabs(api_key=elevenlabs_api_key)

    audio_data = BytesIO(audio_file.read())
    transcription = client.speech_to_text.convert(
        file=audio_data,
        model_id="scribe_v2",
        tag_audio_events=True,
        language_code="en",
    )
    return transcription.text


# ---------------------------------------------------------------------------
# Message extraction — text or audio
# ---------------------------------------------------------------------------


def extract_message_body(message_obj: dict) -> str | None:
    """
    Return the plain-text content of a Meta message object.

    - type "text"  → return text.body directly.
    - type "audio" → download from the URL already in the payload,
                     transcribe via ElevenLabs, return the transcription.
    - anything else (image, video, sticker, …) → return None so the caller
      can ignore it silently.
    """
    msg_type: str = message_obj.get("type", "")

    if msg_type == "text":
        return message_obj.get("text", {}).get("body", "").strip() or None

    if msg_type == "audio":
        audio_url: str | None = message_obj.get("audio", {}).get("url")
        if not audio_url:
            logger.warning("[WhatsApp] Audio message missing URL:", message_obj)
            return None
        audio_bytes = _download_media(audio_url)
        if audio_bytes is None:
            logger.warning("[WhatsApp] Failed to download audio from URL:", audio_url)
            return None
        return convert_speech_to_text(BytesIO(audio_bytes))

    return None


def _download_media(url: str) -> bytes | None:
    """Download raw media bytes from a Meta-signed URL using the access token."""
    if not settings.WHATSAPP_ACCESS_TOKEN:
        return None

    headers = {"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"}
    resp = requests.get(url, headers=headers, timeout=30)
    if resp.status_code != 200:
        logger.warning("[WhatsApp] Media download failed %s: %s", resp.status_code, url)
        return None
    return resp.content


# ---------------------------------------------------------------------------
# Account sync — link WhatsApp user to web account
# ---------------------------------------------------------------------------


def detect_sync_command(message_body: str) -> tuple[str, str] | None:
    """
    Return (email, password) if the message is a sync command, else None.

    Accepted formats:
      sync email@example.com mypassword
      link email@example.com mypassword
    """
    text = message_body.strip()
    lower = text.lower()
    for prefix in ("sync ", "link "):
        if lower.startswith(prefix):
            parts = text[len(prefix) :].strip().split(None, 1)
            if len(parts) == 2:
                return parts[0], parts[1]
    return None


def handle_sync(
    whatsapp_user: WhatsAppUser,
    email: str,
    password: str,
    session: Session,
) -> str:
    """Authenticate against the web User table and store the link if valid."""
    from app.crud import authenticate  # local import avoids circular dependency

    web_user = authenticate(session=session, email=email, password=password)
    if web_user is None:
        return "Wrong email or password. Please try again:\nsync your@email.com yourpassword"

    whatsapp_user.linked_user_id = web_user.id
    session.add(whatsapp_user)
    session.commit()

    name = web_user.full_name or email
    return (
        f"Account linked! Welcome, {name}.\n\n"
        "You can now ask about your livestock. Try:\n"
        "• *cows* — list your first 10 animals\n"
        "• *cow <name>* — get full details on a specific animal"
    )


# ---------------------------------------------------------------------------
# Livestock query tool
# ---------------------------------------------------------------------------


def detect_animal_query(message_body: str) -> str | None:
    """
    Return the animal name if the message is a livestock query, else None.

    Accepted formats:
      cow <name>       animal <name>
      cows             animals         ← list mode (no name = return first 10)
    """
    text = message_body.strip().lower()
    for prefix in ("cow ", "animal ", "livestock "):
        if text.startswith(prefix):
            return text[len(prefix) :].strip() or None
    if text in ("cows", "animals", "livestock", "my animals", "my cows"):
        return ""  # empty string = list mode
    return None


def handle_animal_query(
    whatsapp_user: WhatsAppUser,
    name_query: str,
    session: Session,
) -> str:
    """Look up livestock for the linked web account and return a formatted reply."""
    from app.crud import get_livestock_by_name_for_user, get_livestock_for_user

    if whatsapp_user.linked_user_id is None:
        return (
            "Your WhatsApp account is not linked to a V-Vet web account yet.\n\n"
            "To link it, send:\nsync your@email.com yourpassword"
        )

    if name_query == "":
        animals = get_livestock_for_user(
            session=session, user_id=whatsapp_user.linked_user_id
        )
        if not animals:
            return "No active animals found on your account."
        lines = [f"Your animals ({len(animals)}):"]
        for a in animals:
            tag = f" [{a.tag_number}]" if a.tag_number else ""
            lines.append(
                f"• {a.name or '(unnamed)'}{tag} — {a.species}, {a.health_status}"
            )
        return "\n".join(lines)

    matches = get_livestock_by_name_for_user(
        session=session, user_id=whatsapp_user.linked_user_id, name=name_query
    )
    if not matches:
        return f'No animal found matching "{name_query}" on your account.'
    if len(matches) > 1:
        names = ", ".join(a.name or "(unnamed)" for a in matches)
        return f"Multiple matches: {names}\nPlease be more specific."

    a = matches[0]
    lines = [f"*{a.name or '(unnamed)'}*"]
    if a.tag_number:
        lines.append(f"Tag: {a.tag_number}")
    lines.append(f"Species: {a.species}")
    if a.breed:
        lines.append(f"Breed: {a.breed}")
    if a.gender:
        lines.append(f"Gender: {a.gender}")
    lines.append(f"Health: {a.health_status}")
    lines.append(f"Status: {a.lifecycle_status}")
    if a.weight_kg is not None:
        lines.append(f"Weight: {a.weight_kg} kg")
    if a.date_of_birth:
        lines.append(f"DOB: {a.date_of_birth}")
    if a.acquired_date:
        lines.append(f"Acquired: {a.acquired_date}")
    if a.notes:
        lines.append(f"Notes: {a.notes}")
    return "\n".join(lines)
