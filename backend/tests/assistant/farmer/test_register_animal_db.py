"""Registering an animal through the farmer agent's tool, against a real database.

Each test runs inside a transaction that is rolled back afterwards, so no rows are left behind.
WhatsApp sends and photo storage are replaced with fakes.
"""

import uuid
from collections.abc import Generator
from types import SimpleNamespace

import pytest
from sqlmodel import Session, select

from app.assistant.farmer import tools
from app.assistant.farmer.context import build_farmer_context
from app.core.config import settings
from app.core.db import engine
from app.flows import FLOW_REGISTRY, register_animal
from app.models import Livestock, LivestockImage, User
from app.models.conversation_state import ConversationState
from app.models.whatsapp import WhatsAppUser

OK_RESPONSE = SimpleNamespace(status_code=200, text="")


@pytest.fixture
def session() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    # Commits made by the code under test only release a savepoint inside this transaction.
    db_session = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield db_session
    db_session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(autouse=True)
def fakes(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "FLOW_ID_REGISTER_ANIMAL", "test-flow-id")
    monkeypatch.setattr(register_animal, "send_flow_message", lambda **kwargs: OK_RESPONSE)
    monkeypatch.setattr(
        "app.services.whatsapp_flow_media.download_whatsapp_flow_media",
        lambda photo: (b"image-bytes", "image/jpeg", "photo.jpg"),  # noqa: ARG005
    )
    monkeypatch.setattr(
        "app.services.storage.upload_livestock_image_bytes",
        lambda image_bytes, filename, content_type, livestock_id: (  # noqa: ARG005
            f"https://example.com/livestock/{livestock_id}/photo.jpg"
        ),
    )


@pytest.fixture
def farmer(session: Session) -> WhatsAppUser:
    web_user = User(email=None, hashed_password="x", full_name="Tendai Moyo", district="Harare")
    session.add(web_user)
    session.commit()
    whatsapp_user = WhatsAppUser(
        phone="2637" + uuid.uuid4().hex[:8],
        hashed_password="x",
        full_name="Tendai Moyo",
        district="Harare",
        preferred_language="English",
        is_fully_onboarded=True,
        linked_user_id=web_user.id,
    )
    session.add(whatsapp_user)
    session.commit()
    session.refresh(whatsapp_user)
    return whatsapp_user


def _states(session: Session, farmer: WhatsAppUser) -> list[ConversationState]:
    return list(
        session.exec(
            select(ConversationState).where(ConversationState.whatsapp_user_id == farmer.id)
        ).all()
    )


def test_tool_sends_form_then_submission_saves_animal(session, farmer) -> None:
    result = tools.run_tool(
        session=session, user=farmer, name="start_flow", arguments={"flow": "register_animal"}
    )
    assert result["status"] == "started"

    [state] = _states(session, farmer)
    assert (state.flow, state.step, state.status) == ("register_animal", "form_sent", "active")
    context = build_farmer_context(session=session, user=farmer)
    assert "Registering an animal: V-Vet sent the registration form" in context
    assert "No animals registered yet." in context

    reply = FLOW_REGISTRY["register_animal"].handle(
        data={"name": "Bessie", "gender": "female", "breed": "Brahman", "weight_kg": "", "animal_photo": ["media-1"]},
        user=farmer,
        session=session,
    )

    [state] = _states(session, farmer)
    assert (state.step, state.status) == ("done", "completed")
    assert state.ended_at is not None
    assert state.data["name"] == "Bessie"
    assert state.data["gender"] == "female"
    assert state.data["date_of_birth"] is None
    assert "photo_url" not in state.data
    animal = session.get(Livestock, uuid.UUID(state.data["livestock_id"]))
    assert animal is not None
    assert animal.date_of_birth is None
    assert animal.tag_number.startswith("HAR-")
    images = session.exec(select(LivestockImage).where(LivestockImage.livestock_id == animal.id)).all()
    assert len(images) == 1
    # Uploaded straight into the animal's own folder, not a pending one.
    assert images[0].image_url == f"https://example.com/livestock/{animal.id}/photo.jpg"
    assert images[0].is_primary
    assert "*Bessie* is registered" in reply
    assert "Date of birth: not given" in reply

    context = build_farmer_context(session=session, user=farmer)
    assert "Nothing in progress." in context
    assert "Bessie (tag HAR-" in context


def test_form_from_an_older_message_is_still_saved(session, farmer) -> None:
    FLOW_REGISTRY["register_animal"].handle(
        data={"name": "Tino", "date_of_birth": "2022-01-01", "weight_kg": "310"},
        user=farmer,
        session=session,
    )

    [state] = _states(session, farmer)
    assert state.status == "completed"
    animal = session.get(Livestock, uuid.UUID(state.data["livestock_id"]))
    assert animal is not None
    assert str(animal.date_of_birth) == "2022-01-01"
    assert animal.weight_kg == 310


def test_sending_the_form_again_abandons_the_unfinished_one(session, farmer) -> None:
    for _ in range(2):
        tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "register_animal"})

    assert sorted(state.status for state in _states(session, farmer)) == ["abandoned", "active"]


def test_invalid_form_saves_nothing(session, farmer) -> None:
    tools.run_tool(session=session, user=farmer, name="start_flow", arguments={"flow": "register_animal"})

    reply = FLOW_REGISTRY["register_animal"].handle(
        data={"name": "Bessie", "weight_kg": "heavy"}, user=farmer, session=session
    )

    assert reply == register_animal.FORM_INVALID_MESSAGE
    [state] = _states(session, farmer)
    assert state.status == "failed"
    assert session.exec(select(Livestock).where(Livestock.name == "Bessie")).all() == []
