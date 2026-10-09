"""Writes replies to farmers who have not registered yet (the guest stage)."""

from pathlib import Path

from app.assistant.client import ChatMessage, generate_structured
from app.assistant.guest.schemas import GuestReply

_GUEST_DIR = Path(__file__).parent
_ASSISTANT_DIR = _GUEST_DIR.parent

_FACT_SHEET = (_ASSISTANT_DIR / "knowledge" / "vvet_facts.md").read_text(encoding="utf-8")
_PROMPT_TEMPLATE = (_GUEST_DIR / "prompt.md").read_text(encoding="utf-8")

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
