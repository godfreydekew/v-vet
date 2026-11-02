from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings

URL = f"{settings.API_V1_STR}/careers/applications"


def _form(**overrides: str) -> dict[str, str]:
    form = {
        "role": "software-engineer",
        "full_name": "Tendai Moyo",
        "email": "tendai@example.com",
        "phone": "+263771234567",
        "location": "Harare",
        "languages": "English, Shona",
        "portfolio_links": "https://github.com/example",
        "llm_project_answer": "I built a WhatsApp bot on top of an LLM. " * 3,
        "lives_in_zimbabwe": "true",
        "accepted_privacy_notice": "true",
    }
    form.update(overrides)
    return form


def _cv(name: str = "cv.pdf", data: bytes = b"%PDF-1.4 cv") -> dict:
    return {"cv": (name, data, "application/pdf")}


@pytest.fixture
def emails_on():
    with (
        patch.object(settings, "SMTP_HOST", "smtp.example.com"),
        patch.object(settings, "EMAILS_FROM_EMAIL", "noreply@example.com"),
    ):
        yield


@pytest.mark.usefixtures("emails_on")
def test_application_sends_task_and_forwards_cv(client: TestClient) -> None:
    with patch("app.api.routes.careers.send_email", return_value=True) as send:
        r = client.post(URL, data=_form(preferred_pay="800 to 1,200"), files=_cv())

    assert r.status_code == 201
    task_call, team_call = send.call_args_list
    assert task_call.kwargs["email_to"] == "tendai@example.com"
    assert "coding task" in task_call.kwargs["subject"].lower()
    assert team_call.kwargs["email_to"] == settings.CAREERS_INBOX_EMAIL
    assert team_call.kwargs["reply_to"] == "tendai@example.com"
    assert team_call.kwargs["attachments"][0].filename == "cv.pdf"
    assert "800 to 1,200" in team_call.kwargs["html_content"]
    assert "800 to 1,200" not in task_call.kwargs["html_content"]


@pytest.mark.usefixtures("emails_on")
def test_applicant_text_is_escaped_in_team_email(client: TestClient) -> None:
    with patch("app.api.routes.careers.send_email", return_value=True) as send:
        client.post(URL, data=_form(full_name="<b>Tendai</b>"), files=_cv())

    team_html = send.call_args_list[1].kwargs["html_content"]
    assert "<b>Tendai</b>" not in team_html
    assert "&lt;b&gt;Tendai&lt;/b&gt;" in team_html


@pytest.mark.usefixtures("emails_on")
def test_failed_task_email_is_flagged_but_application_accepted(
    client: TestClient,
) -> None:
    with patch("app.api.routes.careers.send_email", side_effect=[False, True]) as send:
        r = client.post(URL, data=_form(), files=_cv())

    assert r.status_code == 201
    assert "send the task manually" in send.call_args_list[1].kwargs["html_content"]


@pytest.mark.usefixtures("emails_on")
def test_failed_team_email_returns_error(client: TestClient) -> None:
    with patch(
        "app.api.routes.careers.send_email", side_effect=[True, Exception("smtp down")]
    ):
        r = client.post(URL, data=_form(), files=_cv())

    assert r.status_code == 502


@pytest.mark.parametrize(
    ("form", "files", "status"),
    [
        (_form(role="chief-cow-officer"), _cv(), 404),
        (_form(lives_in_zimbabwe="false"), _cv(), 422),
        (_form(languages="English"), _cv(), 422),
        (_form(accepted_privacy_notice="false"), _cv(), 422),
        (_form(), _cv(name="cv.exe"), 422),
        (_form(), _cv(data=b""), 422),
        (_form(), _cv(data=b"x" * (5 * 1024 * 1024 + 1)), 422),
        (_form(llm_project_answer="too short"), _cv(), 422),
    ],
)
@pytest.mark.usefixtures("emails_on")
def test_invalid_applications_are_rejected(
    client: TestClient, form: dict, files: dict, status: int
) -> None:
    with patch("app.api.routes.careers.send_email", return_value=True) as send:
        r = client.post(URL, data=form, files=files)

    assert r.status_code == status
    send.assert_not_called()


@pytest.mark.usefixtures("emails_on")
def test_honeypot_submission_is_silently_dropped(client: TestClient) -> None:
    with patch("app.api.routes.careers.send_email", return_value=True) as send:
        r = client.post(URL, data=_form(website="https://spam.example"), files=_cv())

    assert r.status_code == 201
    send.assert_not_called()


def test_application_fails_cleanly_when_emails_not_configured(
    client: TestClient,
) -> None:
    with (
        patch.object(settings, "SMTP_HOST", None),
        patch("app.api.routes.careers.send_email") as send,
    ):
        r = client.post(URL, data=_form(), files=_cv())

    assert r.status_code == 503
    send.assert_not_called()
