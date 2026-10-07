from typing import TypeVar

from openai.types.responses import EasyInputMessageParam
from pydantic import BaseModel

# One message in a conversation sent to the model, e.g. {"role": "user", "content": "Hi"}.
ChatMessage = EasyInputMessageParam

# The Pydantic model a structured model call returns.
OutputT = TypeVar("OutputT", bound=BaseModel)


class AIResponseError(Exception):
    """The model answered, but not with output we can use (e.g. it refused)."""
