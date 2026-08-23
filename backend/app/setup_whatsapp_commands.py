import logging

from app.services.whatsapp.client import set_whatsapp_commands

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WHATSAPP_COMMANDS: list[dict] = [
    {"command_name": "register_animal", "command_description": "Add a new animal to your herd"},
    {"command_name": "record_birth", "command_description": "Log a new calf born"},
    {"command_name": "record_death", "command_description": "Log an animal death"},
    {"command_name": "report_sickness", "command_description": "Describe symptoms for advice"},
    {"command_name": "my_animals", "command_description": "View your herd"},
]


def main() -> None:
    logger.info("Setting WhatsApp commands: %s", [c["command_name"] for c in WHATSAPP_COMMANDS])
    response = set_whatsapp_commands(WHATSAPP_COMMANDS)
    if response.status_code != 200:
        logger.error("Failed to set WhatsApp commands: %s %s", response.status_code, response.text)
        raise SystemExit(1)
    logger.info("WhatsApp commands set successfully: %s", response.text)


if __name__ == "__main__":
    main()
