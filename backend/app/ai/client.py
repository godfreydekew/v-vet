"""Calls AI models, tracks retries, timeouts, logging
"""

import logging

from openai import OpenAI
from openai.types.responses import ResponseInputParam

from app.ai.schemas import AIResponseError, ChatMessage, OutputT
from app.core.config import settings

logger = logging.getLogger(__name__)

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
