from dataclasses import dataclass


@dataclass
class IncomingMessage:

    message_id: str
    phone: str
    message_type: str
    text: str | None
    button_id: str | None
