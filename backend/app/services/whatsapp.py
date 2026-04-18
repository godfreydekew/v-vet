import logging
from io import BytesIO

import requests
from elevenlabs.client import ElevenLabs
from sqlmodel import Session

from app.core.config import settings
from app.core.openai import client as openai_client
from app.models.whatsapp import WhatsAppMessage, WhatsAppUser

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are VVet Live, a helpful WhatsApp assistant for livestock farmers and veterinary support. "
    "Answer questions about cattle, sheep, goats, poultry, and other farm animals — health, feeding, "
    "breeding, behaviour, injuries, symptoms, and day-to-day farm care. "
    "Keep replies practical, clear, and concise (under 200 words). "
    "If the user greets you, respond briefly and ask what they need help with. "
    "If the question is unclear, ask one focused follow-up question. "
    "Do not invent facts. If a situation may need a veterinarian, say so plainly."
)

# ---------------------------------------------------------------------------
# Onboarding configuration
# Steps are ordered — each key maps to the WhatsAppUser column that stores
# the answer. The order here IS the onboarding order.
# ---------------------------------------------------------------------------

ONBOARDING_STEPS: list[tuple[str, str]] = [
    ("animal_count", "How many animals do you currently have on your farm? (reply with a number)"),
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

    url = f"https://graph.facebook.com/v25.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
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


# ---------------------------------------------------------------------------
# AI response generation
# ---------------------------------------------------------------------------


def generate_ai_response(
    message: str,
    history: list[WhatsAppMessage],
    user: WhatsAppUser,
) -> str:
    """
    Generate an AI response using the last N messages as context.

    History is a chronologically ordered list of WhatsAppMessage rows.
    Farmer messages map to OpenAI role "user"; assistant messages stay "assistant".
    User profile (language, district, animal count) is injected into the system prompt.
    """
    # Personalise system prompt with known user details.
    user_context_parts = []
    if user.preferred_language and user.preferred_language.lower() != "english":
        user_context_parts.append(
            f"The farmer prefers {user.preferred_language} — respond in that language when possible."
        )
    if user.district:
        user_context_parts.append(f"The farmer is located in {user.district}.")
    if user.animal_count is not None:
        user_context_parts.append(f"They have {user.animal_count} animals on their farm.")
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
    """
    Stateless onboarding state machine.

    Called when the user exists but is not yet fully onboarded.
    Saves the incoming message as the answer to the current step,
    then returns the next question or a completion message.
    """
    current_step = _next_onboarding_step(user)

    if current_step is not None:
        field, _ = current_step

        if field == "animal_count":
            # Expect a numeric answer; ask again on invalid input.
            cleaned = message_body.strip().split()[0]  # take first word/number
            try:
                setattr(user, field, int(cleaned))
            except ValueError:
                return "Please reply with just a number. How many animals do you have on your farm?"
        else:
            setattr(user, field, message_body.strip()[:500])

        session.add(user)
        session.commit()
        session.refresh(user)

    # After saving, check what's next.
    next_step = _next_onboarding_step(user)

    if next_step is None:
        # All fields filled — mark fully onboarded.
        user.is_fully_onboarded = True
        session.add(user)
        session.commit()
        name = user.full_name or "there"
        return (
            f"Thank you, {name}! You're all set on V-Vet ✓\n\n"
            "You can now ask me anything about your livestock — health, feeding, "
            "breeding, and more. How can I help you today?"
        )

    _, next_question = next_step
    return next_question


def get_welcome_message() -> str:
    """
    First message sent to a brand-new user right after registration.
    Includes the first onboarding question.
    New users have no profile data yet, so no personalisation is applied.
    """
    _, first_question = ONBOARDING_STEPS[0]
    return (
        "Welcome to V-Vet! I'm your livestock health assistant.\n\n"
        "Before we get started, I need a few quick details to personalise your experience.\n\n"
        f"{first_question}"
    )


# ---------------------------------------------------------------------------
# Language change command
# ---------------------------------------------------------------------------

SUPPORTED_LANGUAGES = {"english", "shona", "ndebele"}


def detect_language_change(message_body: str) -> str | None:
    """
    Return the normalised language name if the message is a language-change
    command, otherwise return None.

    Accepted formats (all case-insensitive):
      "language english"
      "language: shona"
      "shona"          ← bare language name with no other words
    """
    text = message_body.strip().lower().rstrip(".")

    # Strip optional "language" keyword and colon prefix.
    for prefix in ("language:", "language"):
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
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
            parts = text[len(prefix):].strip().split(None, 1)
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
            return text[len(prefix):].strip() or None
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
            session=session, user_id=whatsapp_user.linked_user_id, limit=10
        )
        if not animals:
            return "No active animals found on your account."
        lines = [f"Your animals ({len(animals)}):"]
        for a in animals:
            tag = f" [{a.tag_number}]" if a.tag_number else ""
            lines.append(f"• {a.name or '(unnamed)'}{tag} — {a.species}, {a.health_status}")
        return "\n".join(lines)

    matches = get_livestock_by_name_for_user(
        session=session, user_id=whatsapp_user.linked_user_id, name=name_query
    )
    if not matches:
        return f"No animal found matching \"{name_query}\" on your account."
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
