import logging
from pathlib import Path
from typing import Any

from sqlmodel import Session

from app.assistant.client import generate_with_tools
from app.assistant.farmer.context import build_farmer_context
from app.assistant.farmer.tools import TOOLS, run_tool
from app.assistant.messaging import save_message, send_text
from app.assistant.schemas import ChatMessage
from app.crud import get_conversation_history
from app.models.whatsapp import IncomingMessage, WhatsAppUser

logger = logging.getLogger(__name__)

_FARMER_DIR = Path(__file__).parent
_ASSISTANT_DIR = _FARMER_DIR.parent

# Read once when the server starts; editing these files needs a restart.
_FACT_SHEET = (_ASSISTANT_DIR / "knowledge" / "vvet_facts.md").read_text(encoding="utf-8")
_PROMPT_TEMPLATE = (_FARMER_DIR / "prompt.md").read_text(encoding="utf-8")

FARMER_INSTRUCTIONS = _PROMPT_TEMPLATE.replace("{fact_sheet}", _FACT_SHEET)

_HISTORY_LIMIT = 20

FAILED_MESSAGE = "Sorry, something went wrong on my side. Please try again in a moment."


def handle_farmer_message(*, session: Session, user: WhatsAppUser, message: IncomingMessage) -> None:
    """Reply to a text (or transcribed voice) message from an onboarded farmer."""
    save_message(session=session, user=user, role="farmer", content=message.text or "")

    system_prompt = FARMER_INSTRUCTIONS + "\n\n" + build_farmer_context(session=session, user=user)
    history = _load_history(session=session, user=user)

    def run_farmer_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        return run_tool(session=session, user=user, name=name, arguments=arguments)

    try:
        reply = generate_with_tools(
            system_prompt=system_prompt,
            messages=history,
            tools=TOOLS,
            run_tool=run_farmer_tool,
        )
    except Exception:
        logger.exception("[FarmerAgent] Model call failed for %s", user.phone)
        reply = FAILED_MESSAGE

    if reply:
        send_text(session=session, user=user, text=reply)


def _load_history(*, session: Session, user: WhatsAppUser) -> list[ChatMessage]:
    """The last messages in this chat, oldest first, including the one just received."""
    past_messages = get_conversation_history(session=session, phone=user.phone, limit=_HISTORY_LIMIT)
    history: list[ChatMessage] = []
    for past in past_messages:
        if past.role == "farmer":
            history.append({"role": "user", "content": past.content})
        else:
            history.append({"role": "assistant", "content": past.content})
    return history
