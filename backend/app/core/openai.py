from __future__ import annotations

import json
from datetime import date
from typing import Any, cast

from openai import OpenAI
from sqlmodel import Session

from app.core.config import settings
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

FARMER_AGENT_SYSTEM_PROMPT = (
    "You are VVet, a WhatsApp assistant for livestock farmers. "
    "You help farmers track their animals, answer health and care questions, and register new livestock. "
    "Keep replies short and practical — this is WhatsApp. "
    "If a question is unclear, ask one focused follow-up. "
    "Do not invent facts. If a situation may need a vet, say so plainly."
)

FARMER_AGENT_ADDING_ANIMAL_HINT = (
    "\n\nThe farmer is currently in the process of adding a new animal. "
    "Species defaults to cattle if not stated. "
    "Check the recent conversation history for details already provided. "
    "Ask for any remaining fields (name, tag number, gender, breed, weight, date of birth) "
    "and show the farmer a one-line example of how to reply, for example:\n"
    "  Bessie, ZW-001, female, Hereford, 250kg, born 2022-03-15\n"
    "Call add_livestock as soon as you have any detail to save. "
    "If the farmer says 'skip', 'done', or 'that\\'s all', call add_livestock with whatever you have."
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
                "description": "Look up a specific animal by name.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Animal name or partial name"},
                    },
                    "required": ["name"],
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
                    "Call this as soon as you have any detail to save. "
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
                        "tag_number": {"type": ["string", "null"]},
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


def _execute_farmer_tool(
    tool_name: str,
    arguments: dict[str, Any],
    user: WhatsAppUser,
    session: Session,
) -> dict[str, Any]:
    from app.crud import (
        create_livestock_from_whatsapp,
        get_livestock_by_name_for_user,
        get_livestock_for_user,
    )

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
        matches = get_livestock_by_name_for_user(
            session=session, user_id=user.linked_user_id, name=arguments["name"]
        )
        if not matches:
            return {"status": "not_found", "name": arguments["name"]}
        if len(matches) > 1:
            return {
                "status": "multiple",
                "matches": [{"name": a.name, "species": a.species} for a in matches],
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
            "species": animal.species,
        }

    return {"status": "unknown_tool", "tool": tool_name}


def run_farmer_agent(
    *,
    user: WhatsAppUser,
    history: list[WhatsAppMessage],
    session: Session,
    model: str = ONBOARDING_MODEL,
) -> str:
    """Single agent that handles chat, animal queries, and livestock registration."""
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
        system_content += FARMER_AGENT_ADDING_ANIMAL_HINT

    messages: list[dict[str, Any]] = [{"role": "system", "content": system_content}]
    for msg in history:
        role = "user" if msg.role == "farmer" else "assistant"
        messages.append({"role": role, "content": msg.content})

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
