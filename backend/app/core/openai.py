from __future__ import annotations

import json
from typing import Any, cast

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.whatsapp import WhatsAppMessage, WhatsAppUser

client = OpenAI(api_key=settings.OPENAI_API_KEY)

ONBOARDING_FIELDS = (
    "full_name",
    "animal_count",
    "district",
    "preferred_language",
    "main_goal",
)

ONBOARDING_MODEL = "gpt-4o"

ONBOARDING_FOLLOW_UP_PROMPT = (
    "You are the onboarding assistant responding after tool calls have already been executed. "
    "Look at the updated onboarding state and reply with one short message. "
    "If all required onboarding fields are now present, say the user has completed all onboarding steps and give a brief welcome. "
    "If some fields are still missing, say onboarding is not yet complete and ask only for the next missing field. "
    "Do not repeat fields that are already saved."
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
