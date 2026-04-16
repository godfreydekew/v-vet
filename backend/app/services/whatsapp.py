"""
WhatsApp service layer.

Responsibilities:
- Sending messages via the Meta Cloud API
- Generating AI responses (with optional conversation history)
- Onboarding state machine (stateless — derives current step from null fields)
- Greeting helpers for new and returning users
"""
import requests
from sqlmodel import Session

from app.core.config import settings
from app.core.openai import client as openai_client
from app.models.whatsapp import WhatsAppMessage, WhatsAppUser

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
