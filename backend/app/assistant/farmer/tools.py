"""The farmer agent's tools: what each one is (for the model) and what it does.

Every tool returns a small dict the model reads, e.g. {"status": "sent"}.
"""

import logging
from typing import Any

from openai.types.responses import FunctionToolParam
from sqlmodel import Session

from app.assistant.messaging import save_message
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.menu import send_main_menu

logger = logging.getLogger(__name__)

# Flows the agent may start. Each must be in app.flows.FLOW_REGISTRY.
STARTABLE_FLOWS = ["register_animal"]

# WhatsApp rejects list message bodies longer than this.
_MENU_BODY_LIMIT = 1024

TOOLS: list[FunctionToolParam] = [
    {
        "type": "function",
        "name": "send_menu",
        "description": (
            "Send the farmer V-Vet's main menu: a tappable list of everything V-Vet can do "
            "(register an animal, record a birth or death, report a sick animal, see their animals)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "A short line shown above the menu button, in the farmer's language.",
                }
            },
            "required": ["message"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "start_flow",
        "description": (
            "Start a task for the farmer, exactly as if they tapped it in the menu. "
            "register_animal sends the animal registration form."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "flow": {"type": "string", "enum": STARTABLE_FLOWS},
            },
            "required": ["flow"],
            "additionalProperties": False,
        },
        "strict": True,
    },
]


def run_tool(
    *, session: Session, user: WhatsAppUser, name: str, arguments: dict[str, Any]
) -> dict[str, Any]:
    if name == "send_menu":
        return _send_menu(session=session, user=user, message=arguments.get("message", ""))
    if name == "start_flow":
        return _start_flow(session=session, user=user, flow_name=arguments.get("flow", ""))
    logger.warning("[FarmerTools] Unknown tool %s", name)
    return {"status": "error", "message": f"There is no tool called {name}."}


def _send_menu(*, session: Session, user: WhatsAppUser, message: str) -> dict[str, Any]:
    body = message.strip()[:_MENU_BODY_LIMIT]
    sent = send_main_menu(phone=user.phone, body=body) if body else send_main_menu(phone=user.phone)
    if not sent:
        return {"status": "error", "message": "The menu could not be sent."}
    save_message(session=session, user=user, role="assistant", content=f"[Menu sent] {body}".strip())
    return {"status": "sent"}


def _start_flow(*, session: Session, user: WhatsAppUser, flow_name: str) -> dict[str, Any]:
    from app.flows import FLOW_REGISTRY

    flow = FLOW_REGISTRY.get(flow_name) if flow_name in STARTABLE_FLOWS else None
    if flow is None:
        return {"status": "error", "message": f"There is no flow called {flow_name}."}

    # The flow sends its own message and records the farmer's state, as a menu tap does.
    if not flow.start(phone=user.phone, user=user, session=session):
        return {"status": "error", "message": "The form could not be sent. Suggest trying again from the menu."}
    save_message(session=session, user=user, role="assistant", content=f"[Flow started: {flow_name}]")
    return {"status": "started", "flow": flow_name}
