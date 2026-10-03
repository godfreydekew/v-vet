"""The shapes of answers the AI models return."""

from typing import Literal, TypeVar

from openai.types.responses import EasyInputMessageParam
from pydantic import BaseModel, Field

GuestIntent = Literal[
    "greeting",
    "urgent",
    "how_it_works",
    "cost",
    "language",
    "trust",
    "what_is_vvet",
    "ready_to_register",
    "other",
]


class GuestReply(BaseModel):
    intent: GuestIntent = Field(description="What the farmer's message is mainly about.")
    language: str = Field(
        description="The language the farmer wrote in, in lowercase English, e.g. english, shona, ndebele."
    )
    reply: str = Field(description="The message to send back to the farmer.")

ChatMessage = EasyInputMessageParam

OutputT = TypeVar("OutputT", bound=BaseModel)

class AIResponseError(Exception):
    """The model answered, but not with output we can use (e.g. it refused)."""
