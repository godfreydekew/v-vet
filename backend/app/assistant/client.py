"""Calls AI models, tracks retries, timeouts, logging
"""

import json
import logging
from collections.abc import Callable
from typing import Any, TypeVar

from openai import OpenAI
from openai.types.responses import (
    EasyInputMessageParam,
    FunctionToolParam,
    ResponseInputParam,
)
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

# One message in a conversation sent to the model, e.g. {"role": "user", "content": "Hi"}.
ChatMessage = EasyInputMessageParam

# The Pydantic model a structured model call returns.
OutputT = TypeVar("OutputT", bound=BaseModel)


class AIResponseError(Exception):
    """The model answered, but not with output we can use (e.g. it refused)."""


_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY, timeout=30, max_retries=2)
    return _client


def generate_structured(
    *,
    system_prompt: str,
    messages: list[ChatMessage],
    output_type: type[OutputT],
    model: str | None = None,
) -> OutputT:
    """Send a conversation to the model and return its answer as an output_type object."""
    chosen_model = model or settings.OPENAI_MODEL

    input_messages: ResponseInputParam = [*messages]

    response = _get_client().responses.parse(
        model=chosen_model,
        input=input_messages,
        instructions=system_prompt,
        text_format=output_type,
    )

    answer = response.output_parsed
    if answer is None:
        logger.warning(
            "[AI] %s returned no usable output",
            chosen_model,
        )
        raise AIResponseError("The model returned no usable output.")

    return answer


# Most tool rounds per message, so a confused model can't loop forever.
_MAX_TOOL_ROUNDS = 4


def generate_with_tools(
    *,
    system_prompt: str,
    messages: list[ChatMessage],
    tools: list[FunctionToolParam],
    run_tool: Callable[[str, dict[str, Any]], dict[str, Any]],
    model: str | None = None,
) -> str:

    chosen_model = model or settings.OPENAI_MODEL
    client = _get_client()

    input_messages: ResponseInputParam = [*messages]
    response = client.responses.create(
        model=chosen_model,
        instructions=system_prompt,
        input=input_messages,
        tools=tools,
    )

    for _ in range(_MAX_TOOL_ROUNDS):
        tool_calls = [item for item in response.output if item.type == "function_call"]
        if not tool_calls:
            break

        tool_outputs: ResponseInputParam = []
        ends_turn = False
        for call in tool_calls:
            try:
                arguments = json.loads(call.arguments or "{}")
            except json.JSONDecodeError:
                arguments = {}
            logger.info("[AI] Tool call %s %s", call.name, arguments)
            result = run_tool(call.name, arguments)
            if result.get("ends_turn"):
                ends_turn = True
            tool_outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": json.dumps(result, default=str),
                }
            )

        if ends_turn:
            return ""

        # Continue the same conversation on OpenAI's side with the tool results.
        response = client.responses.create(
            model=chosen_model,
            instructions=system_prompt,
            previous_response_id=response.id,
            input=tool_outputs,
            tools=tools,
        )
    else:
        logger.warning("[AI] %s still calling tools after %d rounds", chosen_model, _MAX_TOOL_ROUNDS)

    return response.output_text.strip()
