from io import BytesIO

from elevenlabs.client import ElevenLabs

from app.core.config import settings


def convert_speech_to_text(audio_data: BytesIO) -> str:
    """Transcribe audio bytes to text using ElevenLabs Scribe."""
    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
    transcription = client.speech_to_text.convert(
        file=audio_data,
        model_id="scribe_v2",
        tag_audio_events=True,
        language_code="en",
    )
    return transcription.text
