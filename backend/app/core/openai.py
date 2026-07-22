from __future__ import annotations

import json
import uuid
from datetime import date
from typing import Any, cast

from openai import OpenAI
from sqlmodel import Session

from app.core.config import settings
from app.models.livestock import Livestock
from app.models.whatsapp import WhatsAppMessage, WhatsAppUser
from app.crud import create_user_for_new_whatsapp

client = OpenAI(api_key=settings.OPENAI_API_KEY)

ONBOARDING_FIELDS = (
    "full_name",
    "animal_count",
    "district",
    "preferred_language",
    "main_goal",
)

ONBOARDING_MODEL = "gpt-4o-mini"

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


def run_onboarding_agent(
    *,
    system_prompt: str,
    user: WhatsAppUser,
    history: list[WhatsAppMessage],
    session: Session,
    model: str = ONBOARDING_MODEL,
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
- ALWAYS show deep empathy, care, and compassion whenever a farmer mentions that an animal is sick, injured, or unwell (e.g., 'I am so sorry to hear that [Animal Name] is not feeling well. 💙 Let's check on them right away.').
- When a farmer asks to report sickness or says an animal is sick:
  1. If an animal is already pinned (mentioned as already selected in this conversation), use that animal — do not ask again.
  2. Otherwise, if they named an animal or tag in free text, call lookup_animal to confirm it exists BEFORE treating it as identified. lookup_animal matches by name (fuzzy — e.g. 'shu' matches 'Shumba') or by exact tag number. Do not assume a name they typed is a real registered animal just because they typed it.
     - If lookup_animal finds exactly one match, confirm it by name and species in your reply (e.g., "I found Bornd, your goat."), then continue.
     - If lookup_animal returns "multiple", list the matching names and ask the farmer which one they mean — do not guess.
     - If lookup_animal (or report_sickness) returns status "not_found_list_sent", their registered-animals list has already been sent to them as a separate WhatsApp message — do not repeat the list yourself in text. Just add one short line asking them to pick from it (e.g., "I couldn't find an animal called that — I've sent your animal list above, please pick one 💙").
     - If status is plain "not_found" (list couldn't be sent — e.g. no animals registered yet), tell them plainly and suggest registering an animal first.
  3. If they did NOT specify an animal name, inform them kindly and offer to show their registered animals list.
- When asking how long symptoms have lasted, convert the farmer's answer into a whole number of days yourself and pass it as symptom_duration_days when calling report_sickness (e.g. "a week" → 7, "a month" → 30, "today" or less than a day → 0). Do not just pass the raw phrase and expect it to be parsed for you.
- Once the animal is confirmed and symptoms are reported, call the report_sickness tool to evaluate triage risk and record the observation in the database.
- Never tell the farmer an observation was recorded, or that you "will report" it, unless a tool call actually returned status "ok". If report_sickness returns status "not_found" or "not_found_list_sent", tell the farmer plainly that you could not find that animal in their herd — do not claim to have reported anything.
- If the triage evaluation indicates a vet is needed (urgency is Emergency or Urgent), explicitly inform the farmer that a veterinary officer is required and advise them to contact their local vet immediately.
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
    "After saving, show the animal summary from the tool result and ask if they want to add another animal."
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
                        "name": {"type": "string", "description": "Animal name (or partial name) or tag number, as the farmer typed it"},
                    },
                    "required": ["name"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "report_sickness",
                "description": (
                    "Report sickness/symptoms for an animal to evaluate triage urgency and record health observation. "
                    "If the farmer already selected an animal from the registered-animals list, "
                    "animal_name_or_tag can be omitted — the selected animal is used automatically."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "animal_name_or_tag": {
                            "type": ["string", "null"],
                            "description": "Name or tag number of the sick animal, if the farmer stated one directly instead of selecting from the list",
                        },
                        "symptoms": {
                            "type": "string",
                            "description": "Observed symptoms or health concerns",
                        },
                        "danger_flags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of danger flags if present (cannot_stand, breathing_difficulty, seizures_unconscious, heavy_bleeding, calving_emergency, multiple_sudden_deaths, severe_bloat)",
                        },
                        "symptom_duration": {
                            "type": ["string", "null"],
                            "description": "A short human-readable label for the duration, as the farmer said it (e.g. '2 days', 'since yesterday', 'a week') — for display only, not used for triage math.",
                        },
                        "symptom_duration_days": {
                            "type": ["integer", "null"],
                            "description": (
                                "You must convert the farmer's answer into a whole number of days yourself — "
                                "this is what triage math actually uses. 0 for today / less than a day, "
                                "1 for yesterday, 7 for about a week, 14 for two weeks, 30 for about a month. "
                                "Omit only if the farmer hasn't said how long."
                            ),
                        },
                        "symptom_trend": {
                            "type": ["string", "null"],
                            "description": "Whether symptoms are worsening, stable, or improving",
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



def _find_animal_by_name_or_tag(
    *, session: Session, user_id: uuid.UUID, query: str
) -> list[Livestock]:
    """Search a farmer's whole herd by name (fuzzy) first, then by exact tag number.

    Searches every registered animal, not just the first page shown in a list
    message — a farmer typing a tag or full name should always resolve, even
    with a large herd.
    """
    from app.crud import get_livestock_by_name_for_user, get_livestock_for_user

    matches = get_livestock_by_name_for_user(session=session, user_id=user_id, name=query)
    if matches:
        return matches

    all_animals = get_livestock_for_user(session=session, user_id=user_id, limit=None)
    return [a for a in all_animals if a.tag_number and a.tag_number.lower() == query.lower()]


def _send_registered_animal_list_fallback(*, user: WhatsAppUser, session: Session) -> bool:
    """Send the report_sickness animal-selection list when a farmer-typed name/tag
    can't be resolved, instead of just telling them to type 'menu'."""
    from app.flows import FLOW_REGISTRY
    from app.flows.report_sickness import ReportSicknessFlow

    flow = FLOW_REGISTRY.get(ReportSicknessFlow.flow_id)
    if not isinstance(flow, ReportSicknessFlow):
        return False
    return flow.start(phone=user.phone, user=user, session=session)


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

    if tool_name == "lookup_animal":
        matches = _find_animal_by_name_or_tag(
            session=session, user_id=user.linked_user_id, query=arguments["name"]
        )
        if not matches:
            list_sent = _send_registered_animal_list_fallback(user=user, session=session)
            return {
                "status": "not_found_list_sent" if list_sent else "not_found",
                "name": arguments["name"],
            }
        if len(matches) > 1:
            return {
                "status": "multiple",
                "matches": [
                    {"name": a.name, "species": a.species, "tag_number": a.tag_number}
                    for a in matches
                ],
            }
        a = matches[0]
        return {
            "status": "ok",
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
        from app.crud import get_livestock_by_id_for_user
        from app.services.sickness import record_sickness_report

        name_or_tag = arguments.get("animal_name_or_tag") or ""
        symptoms = arguments.get("symptoms", "")
        danger_flags = arguments.get("danger_flags") or []
        duration = arguments.get("symptom_duration")
        duration_days = arguments.get("symptom_duration_days")
        trend = arguments.get("symptom_trend")

        # Prefer the animal the farmer already tapped in the report_sickness
        # list (see ReportSicknessFlow.handle_selection) over free-text matching.
        animal = None
        if user.active_sickness_animal_id:
            animal = get_livestock_by_id_for_user(
                session=session,
                user_id=user.linked_user_id,
                livestock_id=user.active_sickness_animal_id,
            )

        if animal is None and name_or_tag:
            matches = _find_animal_by_name_or_tag(
                session=session, user_id=user.linked_user_id, query=name_or_tag
            )
            animal = matches[0] if matches else None

        if animal is None:
            list_sent = _send_registered_animal_list_fallback(user=user, session=session)
            return {
                "status": "not_found_list_sent" if list_sent else "not_found",
                "message": f"Could not find registered animal matching '{name_or_tag}'.",
            }

        result = record_sickness_report(
            session=session,
            user=user,
            animal=animal,
            symptoms=symptoms,
            danger_flags=danger_flags,
            duration=duration,
            symptom_duration_days=duration_days,
            trend=trend,
        )


        return {
            "status": "ok",
            "animal_name": result.animal_name,
            "urgency_level": result.triage.urgency_level,
            "requires_vet": result.triage.requires_vet,
            "summary": result.triage.summary_text,
            "recommendation_text": result.triage.recommendation_text,
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
    for tool_call in assistant_message.tool_calls:
        tool_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments or "{}")
        result = _execute_farmer_tool(tool_name, arguments, user, session)
        tool_messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False, default=str),
        })

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
