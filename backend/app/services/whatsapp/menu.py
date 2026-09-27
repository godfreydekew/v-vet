import logging

from app.services.whatsapp.client import send_list_message

logger = logging.getLogger(__name__)

DEFAULT_MENU_BODY = "What would you like to do today?"

MAIN_MENU_SECTIONS: list[dict] = [
    {
        "title": "Records",
        "rows": [
            {
                "id": "register_animal",
                "title": "Register Animal",
                "description": "Add a new animal to your herd",
            },
            {
                "id": "record_birth",
                "title": "Record Birth",
                "description": "Log a new calf born",
            },
            {
                "id": "record_death",
                "title": "Record Death",
                "description": "Log an animal death",
            },
        ],
    },
    # {
    #     "title": "Treatments",
    #     "rows": [
    #         {"id": "log_vaccination", "title": "Log Vaccination"},
    #         {"id": "log_dipping", "title": "Log Dipping"},
    #         {"id": "log_deworming", "title": "Log Deworming"},
    #     ],
    # },
    {
        "title": "Health & Support",
        "rows": [
            {
                "id": "report_sickness",
                "title": "Report Sickness",
                "description": "Describe symptoms for advice",
            },
            # {
            #     "id": "request_vet",
            #     "title": "Request Vet Help",
            #     "description": "Connect with a veterinarian",
            # },
        ],
    },
    {
        "title": "My Farm",
        "rows": [
            {
                "id": "my_animals",
                "title": "My Animals",
                "description": "View your herd",
            },
            # {
            #     "id": "weekly_summary",
            #     "title": "Weekly Summary",
            #     "description": "Get a herd overview",
            # },
        ],
    },
]


def send_main_menu(*, phone: str, body: str = DEFAULT_MENU_BODY) -> bool:
    """Send the main menu list. body is the text shown above the "View Menu" button.
    Returns True if WhatsApp accepted the message.
    """
    response = send_list_message(
        phone=phone,
        body=body,
        button_label="View Menu",
        sections=MAIN_MENU_SECTIONS,
    )
    if response.status_code != 200:
        logger.warning(
            "[WhatsApp] Menu send failed %s: %s",
            response.status_code,
            response.text,
        )
        return False
    return True
