import logging

from sqlmodel import Session

from app import crud
from app.core.db import engine, init_db
from app.models import UserCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


DEMO_USERS = [
    {
        "external_id": "vet-1",
        "email": "vet@vvet.com",
        "password": "demo1234",
        "full_name": "Dr Moyo",
        "role": "vet",
        "phone_number": "+263 77 987 6543",
        "address": None,
        "is_admin": False,
        "is_superuser": False,
    },
    {
        "external_id": "farmer-1",
        "email": "farmer@vvet.com",
        "password": "demo1234",
        "full_name": "Mary Chivhu",
        "role": "farmer",
        "phone_number": "+263 77 123 4567",
        "address": "Chivhu, Zimbabwe",
        "is_admin": False,
        "is_superuser": False,
    },
    {
        "external_id": "admin-1",
        "email": "admin@vvet.com",
        "password": "demo1234",
        "full_name": "Admin",
        "role": "admin",
        "phone_number": "+263 77 000 0000",
        "address": None,
        "is_admin": True,
        "is_superuser": True,
    },
]


def seed_demo_users(session: Session) -> None:
    for user_data in DEMO_USERS:
        existing_user = crud.get_user_by_email(session=session, email=user_data["email"])
        if existing_user:
            logger.info("Demo user already exists: %s", user_data["email"])
            continue

        user_in = UserCreate(
            email=user_data["email"],
            password=user_data["password"],
            full_name=user_data["full_name"],
            role=user_data["role"],
            phone_number=user_data["phone_number"],
            address=user_data["address"],
            is_admin=user_data["is_admin"],
            is_superuser=user_data["is_superuser"],
        )
        crud.create_user(session=session, user_create=user_in)
        logger.info(
            "Created demo user: %s (%s)",
            user_data["email"],
            user_data["external_id"],
        )


def init() -> None:
    with Session(engine) as session:
        init_db(session)
        seed_demo_users(session)


def main() -> None:
    logger.info("Creating initial data")
    init()
    
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
