import logging
from typing import Any

from openai.types.responses import FunctionToolParam
from sqlmodel import Session

from app.assistant.messaging import save_message
from app.models.whatsapp import WhatsAppUser
from app.services.whatsapp.menu import send_main_menu

logger = logging.getLogger(__name__)

# Flows the agent may start. Each must be in app.flows.FLOW_REGISTRY.
STARTABLE_FLOWS = ["register_animal", "my_animals", "record_death", "record_birth", "report_sickness"]

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
            "register_animal sends the animal registration form. "
            "my_animals sends a tappable list of the farmer's animals; tapping one shows its details and photo. "
            "record_death starts recording an animal's death: the farmer picks the animal, the cause and the date. "
            "record_birth starts recording a calf's birth: the farmer picks the mother cow, fills in "
            "the birth details, then registers the calf. "
            "report_sickness starts reporting a sick animal: the farmer picks the animal, then "
            "describes the symptoms, then answers a few follow-up questions."
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
    {
        "type": "function",
        "name": "submit_symptoms",
        "description": (
            "Pass the farmer's description of their sick animal's symptoms to V-Vet's sickness check, "
            "which then asks the follow-up questions or, if the animal is in danger, gives urgent advice. "
            "Only use it when 'What the farmer is doing now' says V-Vet is waiting for the symptoms."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "symptoms": {
                    "type": "string",
                    "description": "The farmer's description of the symptoms, in their own words, unchanged.",
                }
            },
            "required": ["symptoms"],
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
    if name == "submit_symptoms":
        return _submit_symptoms(session=session, user=user, symptoms=arguments.get("symptoms", ""))
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
        return {"status": "error", "message": f"{flow_name} could not be started."}
    save_message(session=session, user=user, role="assistant", content=f"[Flow started: {flow_name}]")
    return {"status": "started", "flow": flow_name, "ends_turn": True}


def _submit_symptoms(*, session: Session, user: WhatsAppUser, symptoms: str) -> dict[str, Any]:
    from app.assistant.state import get_active_state
    from app.flows.report_sickness import STEP_DESCRIBE_SYMPTOMS
    from app.flows.report_sickness_context import TriageContextFlow

    state = get_active_state(session=session, user=user)
    sick_animal_id = user.active_sickness_animal_id
    if (
        state is None
        or state.flow != "report_sickness"
        or state.step != STEP_DESCRIBE_SYMPTOMS
        or sick_animal_id is None
    ):
        return {"status": "error", "message": "V-Vet isn't waiting for symptoms right now."}
    if not symptoms.strip():
        return {"status": "error", "message": "The symptoms were empty."}

    # The sickness check sends its own message: urgent advice or the first follow-up question.
    sent = TriageContextFlow().start(
        phone=user.phone,
        user=user,
        session=session,
        livestock_id=sick_animal_id,
        problem_description=symptoms.strip(),
    )
    if not sent:
        return {"status": "error", "message": "The symptoms could not be processed."}
    save_message(session=session, user=user, role="assistant", content="[Symptoms submitted]")
    return {"status": "submitted", "ends_turn": True}
