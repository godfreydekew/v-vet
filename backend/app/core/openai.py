from __future__ import annotations

import json
import logging
import uuid
from datetime import date
from typing import Any, cast

from openai import OpenAI
from sqlmodel import Session

from app.core.config import settings
from app.models.whatsapp import WhatsAppMessage, WhatsAppUser
from app.crud import create_user_for_new_whatsapp

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)

ONBOARDING_FIELDS = (
    "full_name",
    "animal_count",
    "district",
    "preferred_language",
    "main_goal",
)

ONBOARDING_MODEL = "gpt-4o-mini"
FARMER_AGENT_MODEL = "gpt-5-mini"

ONBOARDING_FOLLOW_UP_PROMPT = (
    "You are the onboarding assistant responding after tool calls have already been executed. "
    "Look at the updated onboarding state and reply with one short message. "
    "If all required onboarding fields are now present, say the user has completed all onboarding steps and give a brief welcome. "
    "If some fields are still missing, say onboarding is not yet complete and ask only for the next missing field. "
    "Do not repeat fields that are already saved."
    "If onboarding is complete, Ask the farmer if they would like to add an animals to the system"
)

def build_onboarding_message_list(
    *,
    system_prompt: str,
    user: WhatsAppUser,
    history: list[WhatsAppMessage],
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Build the OpenAI message list from the system prompt and recent history."""
    onboarding_state = {
        "full_name": user.full_name,
        "animal_count": user.animal_count,
        "district": user.district,
        "preferred_language": user.preferred_language,
        "main_goal": user.main_goal,
        "is_fully_onboarded": user.is_fully_onboarded,
    }

    messages: list[dict[str, Any]] = [
        {
            "role": "system",
            "content": (
                f"{system_prompt}\n\n"
                f"Current onboarding state: {json.dumps(onboarding_state, ensure_ascii=False)}\n\n"
                "Use the recent conversation history to infer which onboarding fields are already answered. "
                "If the farmer has provided one or more missing fields, call the relevant tool. "
                "If all five fields are present, mark onboarding complete. "
                f"Review at most the last {limit} messages from the conversation history."
            ),
        }
    ]

    recent_history = history[-limit:]
    for message in recent_history:
        role = "user" if message.role == "farmer" else "assistant"
        messages.append({"role": role, "content": message.content})

    return messages


def build_onboarding_tools() -> list[dict[str, Any]]:
    """Tool definitions used by the onboarding agent."""
    return [
        {
            "type": "function",
            "function": {
                "name": "save_onboarding_fields",
                "description": "Save one or more onboarding fields extracted from the farmer's message.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "full_name": {"type": ["string", "null"]},
                        "animal_count": {"type": ["integer", "string", "null"]},
                        "district": {"type": ["string", "null"]},
                        "preferred_language": {"type": ["string", "null"]},
                        "main_goal": {"type": ["string", "null"]},
                    },
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "complete_onboarding",
                "description": "Mark the WhatsApp user as fully onboarded once all required fields are present.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "additionalProperties": False,
                },
            },
        },
    ]


def _apply_onboarding_fields(
    *,
    session: Session,
    user: WhatsAppUser,
    fields: dict[str, Any],
) -> WhatsAppUser:
    updated = False

    for field_name, value in fields.items():
        if field_name not in ONBOARDING_FIELDS:
            continue
        if value in (None, ""):
            continue
        if field_name == "animal_count" and value is not None:
            value = int(value)
        setattr(user, field_name, value)
        updated = True

    if updated:
        session.add(user)
        session.commit()
        session.refresh(user)

    return user


def save_onboarding_fields(
    *,
    session: Session,
    user: WhatsAppUser,
    fields: dict[str, Any],
) -> WhatsAppUser:
    """Persist one or more onboarding fields on the WhatsApp user."""
    return _apply_onboarding_fields(session=session, user=user, fields=fields)


def complete_onboarding(*, session: Session, user: WhatsAppUser) -> WhatsAppUser:
    """Mark the WhatsApp user as fully onboarded."""
    new_user = create_user_for_new_whatsapp(session=session, whatsapp_user=user)
    user.linked_user_id = new_user.id
    user.is_fully_onboarded = True
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def _build_herd_context(*, user: WhatsAppUser, session: Session) -> str:
    """
    Compact, standing summary of the farmer's herd — name, species, gender,
    health status, tag, and the most recent health observation.
    """
    if not user.linked_user_id:
        return ""

    from app.crud import get_latest_observations_for_user, get_livestock_for_user

    animals = get_livestock_for_user(session=session, user_id=user.linked_user_id, limit=None)
    if not animals:
        return ""

    latest_obs = get_latest_observations_for_user(session=session, user_id=user.linked_user_id)
    today = date.today()

    lines = [f"Farmer's registered animals ({len(animals)}):"]
    for a in animals:
        name = a.name or "(unnamed)"
        detail = f"{a.gender or 'unknown sex'} {a.species}, {a.health_status}, tag {a.tag_number}"
        obs = latest_obs.get(a.id)
        if obs and obs.symptoms:
            days_ago = (today - obs.observed_at.date()).days
            if days_ago <= 0:
                when = "today"
            elif days_ago == 1:
                when = "yesterday"
            else:
                when = f"{days_ago} days ago"
            detail += f" (last observed {when}: {obs.symptoms})"
        lines.append(f"- {name} — {detail}")

    return "\n\n" + "\n".join(lines)


def run_onboarding_agent(
    *,
    system_prompt: str,
    user: WhatsAppUser,
    history: list[WhatsAppMessage],
    session: Session,
    model: str = FARMER_AGENT_MODEL,
    limit: int = 10,
) -> str:
    """Run the onboarding agent with tool-calling over recent WhatsApp history."""
    messages = build_onboarding_message_list(
        system_prompt=system_prompt,
        user=user,
        history=history,
        limit=limit,
    )
    tools = build_onboarding_tools()

    response = client.chat.completions.create(
        model=model,
        messages=cast(Any, messages),
        tools=cast(Any, tools),
        tool_choice="auto",
    )

    assistant_message = response.choices[0].message
    if not assistant_message.tool_calls:
        return (assistant_message.content or "").strip()

    tool_messages: list[dict[str, Any]] = []
    for tool_call in assistant_message.tool_calls:
        tool_call_data = cast(Any, tool_call)
        tool_name = tool_call_data.function.name
        arguments = json.loads(tool_call_data.function.arguments or "{}")

        if tool_name == "save_onboarding_fields":
            save_onboarding_fields(session=session, user=user, fields=arguments)
            tool_result = {"status": "saved", "fields": arguments}
        elif tool_name == "complete_onboarding":
            complete_onboarding(session=session, user=user)
            tool_result = {"status": "completed"}
        else:
            tool_result = {"status": "ignored", "tool": tool_name}

        tool_messages.append(
            {
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(tool_result, ensure_ascii=False),
            }
        )

    follow_up = client.chat.completions.create(
        model=model,
        messages=cast(
            Any,
            [
                {
                    "role": "system",
                    "content": ONBOARDING_FOLLOW_UP_PROMPT,
                },
                *messages,
                {
                    "role": "assistant",
                    "content": assistant_message.content or "",
                    "tool_calls": assistant_message.tool_calls,
                },
                *tool_messages,
            ],
        ),
    )
    final_message = follow_up.choices[0].message.content or ""
    return final_message.strip()


# ---------------------------------------------------------------------------
# Farmer agent — handles chat, animal queries, and livestock registration
# ---------------------------------------------------------------------------

FARMER_AGENT_SYSTEM_PROMPT = """You are VVet, a warm, caring, and empathetic WhatsApp assistant for livestock farmers in sub-Saharan Africa.
You help farmers track their animals, log sickness and health observations, and answer questions.
CRITICAL INSTRUCTIONS:
- Do not add emojis to any responses.
- ALWAYS show deep empathy, care, and compassion whenever a farmer mentions that an animal is sick, injured, or unwell (e.g., 'I am so sorry to hear that [Animal Name] is not feeling well. Let's check on them right away.').
- Never tell the farmer an animal was registered, saved, or updated unless the add_livestock tool call actually returned status "saved". If add_livestock returns status "error", tell the farmer plainly what error occurred (e.g. asking them to link their account or set their district) — do NOT claim the animal was registered.
- Do NOT use command verbs like "Register" or "Add" as an animal's name. If no explicit name was provided, set name to null (unnamed).
- When a farmer asks to report sickness or says an animal is sick, you must always call a tool to identify the animal — never just reply in text asking which animal it is without also calling a tool. The core rule: nothing gets written to report_sickness until the animal is confirmed, and tapping the interactive list is the only thing that counts as confirmed on its own.
  1. If an animal is already pinned (already tapped from the interactive list earlier in this conversation):
     - If the message clearly continues describing that same animal (more symptom detail, answering something you just asked about it), use the pinned animal directly — that tap was the confirmation, do not ask again.
     - If the message is generic and could plausibly be about a different animal (e.g. they say "my animal is sick" or "she is not eating" again, out of context of the current conversation), ask: "You previously selected [pinned animal name] — are you still reporting for them, or a different animal?" and wait for their answer before calling report_sickness.
       - If they confirm it's still the same animal, proceed using the pin as usual.
       - If they name a different animal ("No, it's Shumba"), that's handled by case 3 below — a named animal always overrides the pin, you don't need to unpin it yourself.
       - If they say no but don't give a new name, treat it exactly like case 2 below — identification starts fresh, call lookup_animal with name omitted.
  2. If they did NOT name an animal at all (e.g. "my animal is sick", "one of my cows isn't well"), call lookup_animal with name omitted (null). It will return "no_animal_specified" (small herd: the real interactive list has already been sent, just tell them briefly to pick from it) or "too_many_to_list" (large herd: ask them to reply with the animal's name or tag). If they then say they don't know / can't tell you a name, call send_animal_selection_list with intent="sickness" — this sends the real tappable list directly to their WhatsApp, and tapping an animal pins it for this report.
  3. If they named an animal or tag in free text — including what looks like an exact tag number — call lookup_animal to confirm it exists BEFORE treating it as identified. lookup_animal matches by name (fuzzy — e.g. 'shu' matches 'Shumba') or by exact tag number. Never invent a placeholder name (e.g. 'animal', 'my animal') — if they haven't actually named one, use case 2 instead.
     - If lookup_animal finds a match, do not treat it as settled yet — explicitly ask the farmer to confirm (e.g., "I found Shumba, your cow — is that right?") and wait for them to say yes. This applies even to an exact tag match, not just a fuzzy name match.
     - If lookup_animal returns "multiple", list the matching names and ask the farmer which one they mean — do not guess.
     - If lookup_animal (or report_sickness) returns status "not_found_list_sent", a real name/tag was given but didn't match anything — their registered-animals list has already been sent as a separate message. Do not repeat the list yourself in text. Just tell them you couldn't find that specific animal and to pick from the list above.
     - If status is plain "not_found" (list couldn't be sent — e.g. no animals registered yet), tell them plainly and suggest registering an animal first.
  4. Once you have the farmer's problem description and a resolved animal (from lookup_animal, or given together in one message, e.g. "Bessie is sick, she is coughing and has a fever"), call report_sickness with that description as symptoms. If the animal was not pinned, leave confirmed false on this first call.
     - If report_sickness returns "needs_confirmation", ask the farmer to confirm the named animal (by name and species) and wait for a yes — do not call report_sickness again until they confirm.
     - Once they confirm, call report_sickness again with the same details plus confirmed=true.
     - It then returns "context_flow_started" — it has handed off to a separate deterministic questionnaire that sends its own WhatsApp messages asking follow-up questions (onset, progression, herd context) and records the observation itself once done. Do not call report_sickness again for this animal, and do not claim anything was recorded yet — just add one brief, warm line (e.g. "Let's go through a few quick questions about Bessie.") since the next message the farmer sees is the questionnaire's first question, not yours.
- Never tell the farmer an observation was recorded, or that you "will report" it, unless a tool call actually returned status "ok". If report_sickness returns "not_found", "not_found_list_sent", "no_animal_specified", "too_many_to_list", "needs_confirmation", or "context_flow_started", nothing has been recorded yet — do not claim otherwise.
- If the farmer asks to see/browse their animals and this is NOT part of an in-progress sickness report (e.g. "send the list", "show me my animals" out of the blue), call send_animal_selection_list with intent="view" — do not describe the list yourself in text using list_animals for this purpose. Only use intent="sickness" when the list is for identifying which animal a sickness report is about (see case 2 above); using the wrong intent here means tapping an animal will do the wrong thing (pin it for a sickness report vs. just show its details).
- Keep replies short, kind, polite, and practical."""

FARMER_AGENT_ADDING_ANIMAL_HINT = (
    "\n\nThe farmer is currently adding a new animal. "
    "Tag number is auto-generated — do NOT ask for it. "
    "Species defaults to cattle if not stated. "
    "Collect: name, gender, breed, weight (kg), date of birth. "
    "Show a one-line example when asking: Bessie, female, Hereford, 250kg, born 2022-03-15\n"
    "If the farmer doesn't know the exact date of birth, kindly ask them to estimate the animal's age instead "
    "(e.g. 'about 2 years old' or 'roughly 6 months'). Today's date is {today}. "
    "Once they give an age estimate, calculate an approximate date_of_birth by subtracting that age from today's date "
    "(use the 1st of the month for the estimated day). "
    "When confirming the animal's details with the farmer, mention that the date of birth is an estimate. "
    "Do not call add livestock until date of birth is provided or estimated."
    "Call add_livestock as soon as you have any detail to save. "
    "If the farmer says 'skip', 'done', or 'that\\'s all', call add_livestock with whatever you have. "
    "After calling add_livestock, check the tool status. If status is 'saved', show the animal summary from the tool result. "
    "If status is 'error', tell the farmer what error occurred — DO NOT claim the animal was registered."
)


def build_farmer_agent_tools() -> list[dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "list_animals",
                "description": "List all active livestock on the farmer's account.",
                "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "lookup_animal",
                "description": (
                    "Look up a specific animal by name (fuzzy match, e.g. 'shu' matches 'Shumba') "
                    "or by exact tag number. If nothing matches, the farmer's full registered-animals "
                    "list is sent to them automatically."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": ["string", "null"],
                            "description": (
                                "Animal name (or partial name) or tag number, exactly as the farmer typed it. "
                                "Omit (null) if the farmer has not actually named an animal yet — "
                                "never invent a placeholder like 'animal' or 'my animal'."
                            ),
                        },
                    },
                    "required": [],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "send_animal_selection_list",
                "description": (
                    "Send the farmer a tappable WhatsApp list of their registered animals. "
                    "Do NOT format the list yourself in text using list_animals for this purpose — "
                    "this tool sends the real interactive picker, which lets the farmer tap the exact "
                    "animal instead of typing a name. The intent argument changes what tapping an "
                    "animal actually does, so pick it carefully — it is not just cosmetic."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "intent": {
                            "type": "string",
                            "enum": ["sickness", "view"],
                            "description": (
                                "'sickness' — use while identifying an animal for an in-progress sickness "
                                "report (farmer doesn't know the name/tag, or asks to see/select from the "
                                "list mid-report). Tapping an animal PINS it and continues the sickness report. "
                                "'view' — use when the farmer just wants to see/browse their animals and this "
                                "is NOT about reporting sickness (e.g. 'show me my animals', 'send the list' "
                                "outside of a sickness conversation). Tapping an animal shows its details and "
                                "pins nothing."
                            ),
                        },
                    },
                    "required": ["intent"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "report_sickness",
                "description": (
                    "Confirm the animal for a sickness report and hand off to the basic-context "
                    "questionnaire, which asks its own follow-up questions (onset, progression, herd "
                    "context) via WhatsApp buttons/lists and records the final observation itself. "
                    "If the farmer already selected an animal from the registered-animals list, "
                    "animal_name_or_tag can be omitted — the selected animal is used automatically. "
                    "Unless the animal was selected by tapping the list, this will refuse to proceed "
                    "until the farmer has explicitly confirmed which animal — see the confirmed parameter."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "animal_name_or_tag": {
                            "type": ["string", "null"],
                            "description": "Name or tag number of the sick animal, if the farmer stated one directly instead of selecting from the list",
                        },
                        "confirmed": {
                            "type": ["boolean", "null"],
                            "description": (
                                "Set true only after the farmer has explicitly said yes to confirm which animal "
                                "this is. Required for anything not selected by tapping the interactive list — "
                                "including an exact tag match, not just a fuzzy name match. Leave false/omit on "
                                "the first attempt; if this returns status 'needs_confirmation', ask the farmer "
                                "to confirm the animal by name, then call this again with confirmed=true (same "
                                "symptoms) once they say yes."
                            ),
                        },
                        "symptoms": {
                            "type": "string",
                            "description": "The farmer's free-text description of the problem, passed through as-is to the questionnaire as the initial problem description.",
                        },
                    },
                    "required": ["symptoms"],
                    "additionalProperties": False,
                },
            },
        },

        {
            "type": "function",
            "function": {
                "name": "record_death",
                "description": (
                    "Identify which animal has died from the farmer's free-text message and hand off "
                    "to the cause-of-death buttons. Only used when the farmer names the animal in text "
                    "instead of tapping it from the record_death interactive list — tapping the list is "
                    "handled separately and never reaches this tool. This will refuse to proceed until "
                    "the farmer has explicitly confirmed which animal — see the confirmed parameter, "
                    "since marking an animal deceased cannot be undone by the farmer."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "animal_name_or_tag": {
                            "type": ["string", "null"],
                            "description": "Name or tag number of the animal that died, exactly as the farmer typed it. Omit (null) if not stated yet.",
                        },
                        "confirmed": {
                            "type": ["boolean", "null"],
                            "description": (
                                "Set true only after the farmer has explicitly said yes to confirm which "
                                "animal this is. Leave false/omit on the first attempt; if this returns "
                                "status 'needs_confirmation', ask the farmer to confirm by name, then call "
                                "this again with confirmed=true once they say yes."
                            ),
                        },
                    },
                    "required": [],
                    "additionalProperties": False,
                },
            },
        },

        {
            "type": "function",
            "function": {
                "name": "add_livestock",
                "description": (
                    "Register a new animal on the farmer's account. "
                    "Species defaults to 'cattle' if not stated. "
                    "Call this as soon as you have date of birth or an age estimate and any other details."
                    "Omit fields the farmer hasn't provided."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "species": {
                            "type": "string",
                            "enum": ["cattle", "sheep", "goat", "poultry", "pig", "other"],
                            "description": "Defaults to cattle if not specified.",
                        },
                        "name": {"type": ["string", "null"]},
                        "gender": {"type": ["string", "null"], "enum": ["male", "female", "unknown"]},
                        "breed": {"type": ["string", "null"]},
                        "weight_kg": {"type": ["number", "null"]},
                        "date_of_birth": {
                            "type": ["string", "null"],
                            "description": "ISO date YYYY-MM-DD",
                        },
                    },
                    "required": [],
                    "additionalProperties": False,
                },
            },
        },
    ]



def _send_animal_selection_list(*, user: WhatsAppUser, session: Session) -> bool:
    if user.active_sickness_animal_id is not None:
        user.active_sickness_animal_id = None
        session.add(user)
        session.commit()

    from app.flows import FLOW_REGISTRY
    from app.flows.report_sickness import ReportSicknessFlow

    flow = FLOW_REGISTRY.get(ReportSicknessFlow.flow_id)
    if not isinstance(flow, ReportSicknessFlow):
        return False
    return flow.send_animal_list(phone=user.phone, user=user, session=session)


def _handle_no_animal_specified(
    *, user: WhatsAppUser, user_id: uuid.UUID, session: Session
) -> dict[str, Any]:
    if user.active_sickness_animal_id is not None:
        user.active_sickness_animal_id = None
        session.add(user)
        session.commit()

    from app.crud import get_livestock_for_user
    from app.flows.report_sickness import ReportSicknessFlow

    animal_count = len(get_livestock_for_user(session=session, user_id=user_id))
    if animal_count >= ReportSicknessFlow.SMALL_HERD_THRESHOLD:
        return {"status": "too_many_to_list", "count": animal_count}

    list_sent = _send_animal_selection_list(user=user, session=session)
    return {"status": "no_animal_specified_list_sent" if list_sent else "no_animal_specified"}


_DIRECT_SEND_STATUSES = {
    "no_animal_specified_list_sent",
    "sent",
    "not_found_list_sent",
    "context_flow_started",
    "cause_question_sent",
}


def _execute_farmer_tool(
    tool_name: str,
    arguments: dict[str, Any],
    user: WhatsAppUser,
    session: Session,
) -> dict[str, Any]:
    from app.crud import create_livestock_from_whatsapp, get_livestock_for_user

    if user.linked_user_id is None:
        return {
            "status": "error",
            "message": "Account not linked. Ask the farmer to send: sync their@email.com theirpassword",
        }

    if tool_name == "list_animals":
        animals = get_livestock_for_user(session=session, user_id=user.linked_user_id)
        if not animals:
            return {"status": "empty", "message": "No active animals found on this account."}
        return {
            "status": "ok",
            "count": len(animals),
            "animals": [
                {
                    "name": a.name,
                    "tag_number": a.tag_number,
                    "species": a.species,
                    "health_status": a.health_status,
                }
                for a in animals
            ],
        }

    if tool_name == "send_animal_selection_list":
        intent = arguments.get("intent") or "sickness"

        if intent == "view":
            from app.flows import FLOW_REGISTRY
            from app.flows.my_animals import MyAnimalsFlow

            view_flow = FLOW_REGISTRY.get(MyAnimalsFlow.flow_id)
            list_sent = (
                view_flow.start(phone=user.phone, user=user, session=session)
                if isinstance(view_flow, MyAnimalsFlow)
                else False
            )
        else:
            list_sent = _send_animal_selection_list(user=user, session=session)

        if list_sent:
            return {"status": "sent"}
        return {"status": "error", "message": "No registered animals found on this account."}

    if tool_name == "lookup_animal":
        from app.services.animal_lookup import LookupStatus, resolve_animal

        query = arguments.get("name") or None
        if query is None:
            return {"status": "no_animal_specified"}

        result = resolve_animal(session=session, user_id=user.linked_user_id, query=query)

        if result.status == LookupStatus.MULTIPLE_MATCHES:
            return {
                "status": "multiple",
                "matches": [
                    {"name": a.name, "species": a.species, "tag_number": a.tag_number}
                    for a in result.candidates
                ],
            }
        if result.animal is None:
            list_sent = _send_animal_selection_list(user=user, session=session)
            return {
                "status": "not_found_list_sent" if list_sent else "not_found",
                "name": query,
            }
        a = result.animal
        return {
            "status": "ok",
            "match_type": result.match_type,
            "is_fuzzy": result.match_type == "fuzzy_name",
            "animal": {
                "name": a.name,
                "tag_number": a.tag_number,
                "species": a.species,
                "breed": a.breed,
                "gender": a.gender,
                "health_status": a.health_status,
                "lifecycle_status": a.lifecycle_status,
                "weight_kg": a.weight_kg,
                "date_of_birth": str(a.date_of_birth) if a.date_of_birth else None,
                "notes": a.notes,
            },
        }

    if tool_name == "report_sickness":
        from app.services.animal_lookup import LookupStatus, resolve_animal

        name_or_tag = arguments.get("animal_name_or_tag") or ""
        confirmed = bool(arguments.get("confirmed"))
        symptoms = arguments.get("symptoms", "")

        # Prefer the animal the farmer already tapped in the report_sickness
        # list (see ReportSicknessFlow.handle_selection) over free-text matching.
        lookup = resolve_animal(
            session=session,
            user_id=user.linked_user_id,
            query=name_or_tag or None,
            pinned_animal_id=user.active_sickness_animal_id,
        )

        if lookup.status == LookupStatus.MULTIPLE_MATCHES:
            return {
                "status": "multiple",
                "matches": [
                    {"name": a.name, "species": a.species, "tag_number": a.tag_number}
                    for a in lookup.candidates
                ],
            }

        if lookup.animal is None:
            if not name_or_tag:
                return _handle_no_animal_specified(
                    user=user, user_id=user.linked_user_id, session=session
                )
            list_sent = _send_animal_selection_list(user=user, session=session)
            return {
                "status": "not_found_list_sent" if list_sent else "not_found",
                "message": f"Could not find registered animal matching '{name_or_tag}'.",
            }

        # A pinned animal was already confirmed by tapping the interactive list.
        # Anything else (an exact tag match included) needs the farmer to
        # explicitly say yes before anything gets written.
        if lookup.match_type != "pinned" and not confirmed:
            a = lookup.animal
            return {
                "status": "needs_confirmation",
                "animal_name": a.name or a.tag_number,
                "species": a.species,
                "tag_number": a.tag_number,
                "match_type": lookup.match_type,
            }

        # Hand off to the deterministic "basic context" questionnaire
        # (app/flows/report_sickness_context.py) instead of recording from
        # free-text-extracted fields directly. It sends its own WhatsApp
        # messages from here. (Emergency short-circuiting is out of scope
        # for now — every report goes through the basic-context questions.)
        from app.flows.report_sickness_context import TriageContextFlow

        TriageContextFlow().start(
            phone=user.phone,
            user=user,
            session=session,
            livestock_id=lookup.animal.id,
            problem_description=symptoms,
        )
        return {
            "status": "context_flow_started",
            "animal_name": lookup.animal.name or lookup.animal.tag_number,
        }

    if tool_name == "record_death":
        from app.flows import FLOW_REGISTRY
        from app.flows.record_death import RecordDeathFlow
        from app.services.animal_lookup import LookupStatus, resolve_animal

        name_or_tag = arguments.get("animal_name_or_tag") or ""
        confirmed = bool(arguments.get("confirmed"))

        lookup = resolve_animal(session=session, user_id=user.linked_user_id, query=name_or_tag or None)

        if lookup.status == LookupStatus.MULTIPLE_MATCHES:
            return {
                "status": "multiple",
                "matches": [
                    {"name": a.name, "species": a.species, "tag_number": a.tag_number}
                    for a in lookup.candidates
                ],
            }

        if lookup.animal is None:
            death_flow = FLOW_REGISTRY.get(RecordDeathFlow.flow_id)
            list_sent = (
                death_flow.send_animal_list(phone=user.phone, user=user, session=session)
                if isinstance(death_flow, RecordDeathFlow)
                else False
            )
            return {
                "status": "not_found_list_sent" if list_sent else "not_found",
                "message": f"Could not find registered animal matching '{name_or_tag}'.",
            }

        # Marking an animal deceased can't be undone by the farmer, so this
        # always needs an explicit yes — no pinned/tapped fast path exists
        # here since this tool only runs for free-text identification.
        if not confirmed:
            a = lookup.animal
            return {
                "status": "needs_confirmation",
                "animal_name": a.name or a.tag_number,
                "species": a.species,
                "tag_number": a.tag_number,
                "match_type": lookup.match_type,
            }

        death_flow = FLOW_REGISTRY.get(RecordDeathFlow.flow_id)
        sent = (
            death_flow.pin_and_ask_cause(
                livestock_id=lookup.animal.id, phone=user.phone, user=user, session=session
            )
            if isinstance(death_flow, RecordDeathFlow)
            else False
        )
        return {
            "status": "cause_question_sent" if sent else "error",
            "animal_name": lookup.animal.name or lookup.animal.tag_number,
        }

    if tool_name == "add_livestock":
        if not user.district:
            return {
                "status": "error",
                "message": "District not set. Ask the farmer to provide their district before adding animals.",
            }
        dob_raw = arguments.get("date_of_birth")
        dob: date | None = date.fromisoformat(dob_raw) if dob_raw else None
        animal = create_livestock_from_whatsapp(
            session=session,
            user_id=user.linked_user_id,
            district=user.district,
            species=arguments.get("species", "cattle"),
            name=arguments.get("name"),
            gender=arguments.get("gender"),
            breed=arguments.get("breed"),
            weight_kg=arguments.get("weight_kg"),
            date_of_birth=dob,
        )
        user.is_adding_animal = False
        if user.pending_animal_photo_url:
            from app import crud
            from app.models.livestock_image import LivestockImageCreate
            from app.services.storage import move_pending_image_to_livestock

            final_url = (   
                move_pending_image_to_livestock(
                    pending_url=user.pending_animal_photo_url,
                    livestock_id=animal.id,
                )
                or user.pending_animal_photo_url
            )

            crud.create_livestock_image(
                session=session,
                livestock_id=animal.id,
                image_in=LivestockImageCreate(
                    image_url=final_url,
                    is_primary=True,
                ),
            )
            logger.info(
                "[add_livestock] Created primary LivestockImage for %s from URL: %s",
                animal.id,
                final_url,
            )
            user.pending_animal_photo_url = None

        session.add(user)
        session.commit()
        return {
            "status": "saved",
            "name": animal.name or "(unnamed)",
            "tag_number": animal.tag_number,
            "species": animal.species,
            "breed": animal.breed,
            "gender": animal.gender,
            "weight_kg": animal.weight_kg,
            "date_of_birth": str(animal.date_of_birth) if animal.date_of_birth else None,
        }

    return {"status": "unknown_tool", "tool": tool_name}


def run_farmer_agent(
    *,
    user: WhatsAppUser,
    history: list[WhatsAppMessage],
    session: Session,
    model: str = ONBOARDING_MODEL,
    extra_user_message: str | None = None,
) -> str:
    """Single agent that handles chat, animal queries, and livestock registration.

    extra_user_message — injected as the final user turn without being persisted
    to DB first. Used by Flow form handlers to pass clean structured data.
    """
    system_content = FARMER_AGENT_SYSTEM_PROMPT

    profile_parts = []
    if user.preferred_language and user.preferred_language.lower() != "english":
        profile_parts.append(f"Respond in {user.preferred_language} when possible.")
    if user.district:
        profile_parts.append(f"Farmer is located in {user.district}.")
    if user.animal_count is not None:
        profile_parts.append(f"They have {user.animal_count} animals.")
    if user.main_goal:
        profile_parts.append(f"Their main goal: {user.main_goal}.")
    if profile_parts:
        system_content += "\n\nFarmer profile: " + " ".join(profile_parts)
    herd_context = _build_herd_context(user=user, session=session)
    if herd_context:
        system_content += herd_context
        system_content += (
            "\n\nAnswer questions about the herd above directly using this context. This is only for read only operations."
            "lookup_animal just to answer a question. Only use tools when the farmer wants to "
            "actually register, report, or record something."
        )
    if user.is_adding_animal:
        system_content += FARMER_AGENT_ADDING_ANIMAL_HINT.format(today=date.today().isoformat())

    if user.active_sickness_animal_id and user.linked_user_id:
        from app.crud import get_livestock_by_id_for_user

        pinned_animal = get_livestock_by_id_for_user(
            session=session,
            user_id=user.linked_user_id,
            livestock_id=user.active_sickness_animal_id,
        )
        if pinned_animal:
            pinned_name = pinned_animal.name or pinned_animal.tag_number
            system_content += (
                f"\n\nThe farmer already selected {pinned_name} from their herd list to report sickness. "
                "Do not ask which animal is sick again. Once they describe symptoms, "
                "call report_sickness with those symptoms — you may omit animal_name_or_tag."
            )

    messages: list[dict[str, Any]] = [{"role": "system", "content": system_content}]
    for msg in history:
        role = "user" if msg.role == "farmer" else "assistant"
        messages.append({"role": role, "content": msg.content})

    if extra_user_message:
        messages.append({"role": "user", "content": extra_user_message})

    tools = build_farmer_agent_tools()
    response = client.chat.completions.create(
        model=model,
        messages=cast(Any, messages),
        tools=cast(Any, tools),
        tool_choice="auto",
    )

    assistant_message = response.choices[0].message
    if not assistant_message.tool_calls:
        return (assistant_message.content or "").strip()

    tool_messages: list[dict[str, Any]] = []
    tool_results: list[dict[str, Any]] = []
    for tool_call in assistant_message.tool_calls:
        tool_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments or "{}")
        result = _execute_farmer_tool(tool_name, arguments, user, session)
        tool_results.append(result)
        tool_messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False, default=str),
        })

    # Remove agent follow narration
    if any(r.get("status") in _DIRECT_SEND_STATUSES for r in tool_results):
        return ""

    follow_up = client.chat.completions.create(
        model=model,
        messages=cast(
            Any,
            [
                {"role": "system", "content": system_content},
                *messages[1:],
                {
                    "role": "assistant",
                    "content": assistant_message.content or "",
                    "tool_calls": assistant_message.tool_calls,
                },
                *tool_messages,
            ],
        ),
    )
    return (follow_up.choices[0].message.content or "").strip()


def compose_reminder_lead_in(*, history: list[WhatsAppMessage]) -> str:
    """
    Reads recent conversation history and returns a short lead-in line for a
    stalled sickness-report reminder.
    """
    if not history:
        return ""

    transcript = "\n".join(
        f"{'Farmer' if m.role == 'farmer' else 'VVet'}: {m.content}" for m in history
    )
    messages = [
        {
            "role": "system",
            "content": (
                "You are VVet, a warm WhatsApp assistant for livestock farmers. "
                "A farmer stalled mid-way through reporting a sick animal. Read the "
                "recent conversation and write ONE short, warm lead-in sentence to "
                "reconnect before we re-show them the next question — acknowledge "
                "anything relevant they said in the meantime. Do not ask a new "
                "question yourself, do not repeat the question text, just a brief "
                "warm reconnect line. No emojis."
            ),
        },
        {"role": "user", "content": f"Recent conversation:\n{transcript}"},
    ]

    response = client.chat.completions.create(
        model=ONBOARDING_MODEL,
        messages=cast(Any, messages),
    )
    return (response.choices[0].message.content or "").strip()


DANGER_FLAG_OPTIONS = [
    "cannot_stand",
    "breathing_difficulty",
    "seizures_unconscious",
    "heavy_bleeding",
    "calving_emergency",
    "multiple_sudden_deaths",
    "severe_bloat",
]


def detect_danger_flags(*, symptoms: str) -> list[str]:
    """
    Classifies free-text symptoms into the fixed danger-flag vocabulary.
    """
    if not symptoms or not symptoms.strip():
        return []

    tool = {
        "type": "function",
        "function": {
            "name": "report_danger_flags",
            "description": "Report which danger signs are present in the farmer's description, if any.",
            "parameters": {
                "type": "object",
                "properties": {
                    "danger_flags": {
                        "type": "array",
                        "items": {"type": "string", "enum": DANGER_FLAG_OPTIONS},
                        "description": "Danger signs actually described — empty list if none apply.",
                    },
                },
                "required": ["danger_flags"],
                "additionalProperties": False,
            },
        },
    }

    messages = [
        {
            "role": "system",
            "content": (
                "You are a veterinary triage classifier for livestock in sub-Saharan Africa. "
                "Read the farmer's description of their animal's symptoms — any phrasing, any "
                "level of detail, possibly informal — and identify which of the fixed danger "
                "signs are actually present. Farmers describe the same danger sign many "
                "different ways (e.g. 'she can't get up', 'down and won't rise', 'struggling "
                "for air', 'gasping' — match on meaning, not exact wording. Err toward "
                "flagging when uncertain: missing a real danger sign is worse than flagging "
                "one that turns out mild. Only report a flag the farmer's own words genuinely "
                "describe — do not invent signs they didn't mention."
            ),
        },
        {"role": "user", "content": symptoms},
    ]

    response = client.chat.completions.create(
        model=ONBOARDING_MODEL,
        messages=cast(Any, messages),
        tools=cast(Any, [tool]),
        tool_choice=cast(Any, {"type": "function", "function": {"name": "report_danger_flags"}}),
    )

    tool_calls = response.choices[0].message.tool_calls
    if not tool_calls:
        return []

    tool_call_data = cast(Any, tool_calls[0])
    try:
        arguments = json.loads(tool_call_data.function.arguments or "{}")
    except json.JSONDecodeError:
        return []

    flags = arguments.get("danger_flags") or []
    return [f for f in flags if f in DANGER_FLAG_OPTIONS]
