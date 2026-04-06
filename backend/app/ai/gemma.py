from __future__ import annotations

from functools import lru_cache

from openai import OpenAI

from app.core.config import settings

SYSTEM_PROMPT = """You are a veterinary livestock image analyst helping a farmer make practical decisions.

Write a concise, well-formatted markdown report based only on what is visible in the image.

Rules:
- Be useful to a cattle farmer.
- Focus on visible signs that may matter for health, body condition, injury, posture, coat condition, eye clarity, hydration, mobility, and environment.
- Do not claim certainty or invent facts you cannot see.
- If something is unclear, say so.
- Avoid jargon unless it helps the farmer.
- Keep the response structured with short headings and bullets.
- Include a short "What to watch next" section with practical follow-up steps.
- Include a brief confidence note.
- Do not recommend treatment that requires a veterinarian unless the image suggests urgent concern.
"""


@lru_cache(maxsize=1)
def get_gemma_client() -> OpenAI:
    if not settings.GEMMA_BASE_URL:
        raise RuntimeError("GEMMA_BASE_URL is not configured")
    if not settings.GEMMA_MODEL:
        raise RuntimeError("GEMMA_MODEL is not configured")
    return OpenAI(
        base_url=str(settings.GEMMA_BASE_URL),
        api_key=settings.GEMMA_API_KEY or "EMPTY",
    )


def build_livestock_image_analysis_prompt(
    *,
    image_url: str,
    livestock_name: str | None = None,
    tag_number: str | None = None,
    breed: str | None = None,
    health_status: str | None = None,
    lifecycle_status: str | None = None,
) -> str:
    context_lines: list[str] = []
    if livestock_name:
        context_lines.append(f"Name: {livestock_name}")
    if tag_number:
        context_lines.append(f"Tag number: {tag_number}")
    if breed:
        context_lines.append(f"Breed: {breed}")
    if health_status:
        context_lines.append(f"Current health status in the system: {health_status}")
    if lifecycle_status:
        context_lines.append(f"Current lifecycle status in the system: {lifecycle_status}")

    context_block = "\n".join(context_lines) if context_lines else "No extra livestock context provided."

    return f"""Analyze this livestock image for a farmer.

Livestock context:
{context_block}

Image URL:
{image_url}

Return a markdown report with this structure:
# AI Analysis
## Summary
## Visible observations
## Farmer value / practical notes
## What to watch next
## Confidence

Make it clear, useful, and grounded in what is visible in the image."""


def analyze_livestock_image(
    *,
    image_url: str,
    livestock_name: str | None = None,
    tag_number: str | None = None,
    breed: str | None = None,
    health_status: str | None = None,
    lifecycle_status: str | None = None,
) -> str:
    client = get_gemma_client()
    response = client.chat.completions.create(
        model=settings.GEMMA_MODEL or "google/gemma-4-E4B-it",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url},
                    },
                    {
                        "type": "text",
                        "text": build_livestock_image_analysis_prompt(
                            image_url=image_url,
                            livestock_name=livestock_name,
                            tag_number=tag_number,
                            breed=breed,
                            health_status=health_status,
                            lifecycle_status=lifecycle_status,
                        ),
                    },
                ],
            },
        ],
        max_tokens=settings.GEMMA_MAX_TOKENS,
    )

    content = response.choices[0].message.content
    if isinstance(content, list):
        return "\n".join(part.get("text", "") for part in content if isinstance(part, dict))
    return content or ""
