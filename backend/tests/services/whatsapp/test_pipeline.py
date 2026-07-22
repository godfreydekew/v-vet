from unittest.mock import MagicMock

from app.services.whatsapp.pipeline import WhatsAppConversationService


def test_flow_submission_uses_nested_form_data(monkeypatch) -> None:
    service = WhatsAppConversationService()

    user = MagicMock()
    user.phone = "447477837773"

    flow = MagicMock()
    flow.handle.return_value = "Animal saved"

    monkeypatch.setattr(service, "_mark_read", lambda message_id: None)
    monkeypatch.setattr(
        "app.services.whatsapp.pipeline.get_whatsapp_user_by_phone",
        lambda session, phone: user,
    )
    monkeypatch.setattr(
        "app.services.whatsapp.pipeline.save_whatsapp_message",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr("app.flows.FLOW_REGISTRY", {"register_animal": flow})

    send_calls: list[tuple[str, str]] = []
    monkeypatch.setattr(
        service,
        "_send_and_persist",
        lambda *, session, user, phone, reply: send_calls.append((phone, reply)),
    )

    message_obj = {
        "id": "wamid.test",
        "interactive": {
            "type": "nfm_reply",
            "nfm_reply": {
                "response_json": (
                    "{"
                    '"flow_token":"register_animal",'
                    '"screen":"REGISTER_ANIMAL",'
                    '"version":"3",'
                    '"data":{'
                    '"name":"Bessie",'
                    '"species":"cow",'
                    '"breed":"ankole"'
                    "}"
                    "}"
                )
            },
        },
    }

    session = MagicMock()

    service._handle_flow_submission(
        session=session, phone=user.phone, message_obj=message_obj
    )

    flow.handle.assert_called_once_with(
        data={"name": "Bessie", "species": "cow", "breed": "ankole"},
        user=user,
        session=session,
    )
    assert send_calls == [(user.phone, "Animal saved")]
