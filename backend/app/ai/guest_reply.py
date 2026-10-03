"""Writes replies to farmers who have not registered yet (the guest stage)."""

from pathlib import Path

from app.ai.client import generate_structured
from app.ai.schemas import GuestReply, ChatMessage

_AI_DIR = Path(__file__).parent

_FACT_SHEET = (_AI_DIR / "knowledge" / "vvet_facts.md").read_text(encoding="utf-8")
_PROMPT_TEMPLATE = (_AI_DIR / "prompts" / "guest.md").read_text(encoding="utf-8")

GUEST_SYSTEM_PROMPT = _PROMPT_TEMPLATE.replace("{fact_sheet}", _FACT_SHEET)

def answer_guest(
    *,
    message: str,
    history: list[ChatMessage],
    is_first_message: bool,
) -> GuestReply:

    messages: list[ChatMessage] = list(history)
    messages.append({"role": "user", "content": message})

    system_prompt = GUEST_SYSTEM_PROMPT

    if is_first_message:
        system_prompt += (
            "\n\nThe farmer is contacting V-Vet for the first time. "
            "Welcome them briefly depending on what they are asking or saying."
        )

    return generate_structured(
        system_prompt=system_prompt,
        messages=messages,
        output_type=GuestReply,
    )
