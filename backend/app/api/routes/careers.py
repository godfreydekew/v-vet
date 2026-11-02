import logging
import re
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import EmailStr

from app.core.config import settings
from app.models import Message
from app.utils import EmailAttachment, render_email_template, send_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/careers", tags=["careers"])

# Roles that are open on the public careers page, keyed by the id the page sends.
OPEN_ROLES: dict[str, str] = {
    "software-engineer": "Software Engineer",
}

MAX_CV_BYTES = 5 * 1024 * 1024
ALLOWED_CV_EXTENSIONS = {".pdf", ".doc", ".docx"}

APPLICATION_FAILED = (
    "We couldn't send your application just now. Please try again in a few minutes."
)


@router.post("/applications", status_code=201)
def submit_application(
    role: Annotated[str, Form()],
    full_name: Annotated[str, Form(min_length=2, max_length=120)],
    email: Annotated[EmailStr, Form()],
    phone: Annotated[str, Form(min_length=7, max_length=30)],
    location: Annotated[str, Form(min_length=2, max_length=120)],
    languages: Annotated[str, Form(max_length=200)],
    portfolio_links: Annotated[str, Form(min_length=5, max_length=2000)],
    llm_project_answer: Annotated[str, Form(min_length=50, max_length=5000)],
    cv: Annotated[UploadFile, File()],
    linkedin_url: Annotated[str, Form(max_length=300)] = "",
    lives_in_zimbabwe: Annotated[bool, Form()] = False,
    accepted_privacy_notice: Annotated[bool, Form()] = False,
    # Honeypot: hidden on the form, so only bots fill it in.
    website: Annotated[str, Form()] = "",
) -> Message:
    """Receive a job application, forward it to the team and send the applicant their coding task."""
    if website:
        logger.info("[Careers] Dropped honeypot submission")
        return Message(message="Application received")

    role_title = OPEN_ROLES.get(role)
    if role_title is None:
        raise HTTPException(status_code=404, detail="This role is not open.")
    if not accepted_privacy_notice:
        raise HTTPException(
            status_code=422,
            detail="Please confirm you've read the privacy notice.",
        )
    if not re.search(r"shona|ndebele", languages, re.IGNORECASE):
        raise HTTPException(
            status_code=422,
            detail="This role needs someone who speaks Shona or Ndebele.",
        )
    if not lives_in_zimbabwe:
        raise HTTPException(
            status_code=422,
            detail="This role is only open to people living in Zimbabwe.",
        )

    cv_attachment = _read_cv(cv)

    if not settings.emails_enabled:
        logger.error("[Careers] Emails are not configured; cannot accept applications")
        raise HTTPException(status_code=503, detail=APPLICATION_FAILED)

    # The coding task goes out first so the team email can say whether it arrived.
    task_sent = _send_safely(
        email_to=email,
        subject=f"Your V-Vet coding task: {role_title}",
        html_content=render_email_template(
            template_name="careers_coding_task.html",
            context={
                "full_name": full_name,
                "role_title": role_title,
                "careers_email": settings.CAREERS_INBOX_EMAIL,
            },
        ),
        reply_to=str(settings.CAREERS_INBOX_EMAIL),
    )

    application_sent = _send_safely(
        email_to=str(settings.CAREERS_INBOX_EMAIL),
        subject=f"New application: {role_title}, {full_name}",
        html_content=render_email_template(
            template_name="careers_application.html",
            context={
                "role_title": role_title,
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "location": location,
                "languages": languages or "Not given",
                "portfolio_links": portfolio_links,
                "linkedin_url": linkedin_url or "Not given",
                "llm_project_answer": llm_project_answer,
                "task_sent": task_sent,
                "privacy_url": f"{settings.FRONTEND_HOST}/privacy",
            },
        ),
        reply_to=email,
        attachments=[cv_attachment],
    )
    if not application_sent:
        raise HTTPException(status_code=502, detail=APPLICATION_FAILED)

    return Message(message="Application received")


def _read_cv(cv: UploadFile) -> EmailAttachment:
    filename = Path(cv.filename or "").name
    if Path(filename).suffix.lower() not in ALLOWED_CV_EXTENSIONS:
        raise HTTPException(
            status_code=422, detail="Please upload your CV as a PDF or Word document."
        )

    data = cv.file.read(MAX_CV_BYTES + 1)
    if not data:
        raise HTTPException(status_code=422, detail="Your CV file is empty.")
    if len(data) > MAX_CV_BYTES:
        raise HTTPException(status_code=422, detail="Your CV must be 5 MB or smaller.")
    return EmailAttachment(filename=filename, data=data)


def _send_safely(**kwargs: Any) -> bool:
    try:
        return send_email(**kwargs)
    except Exception:
        logger.exception("[Careers] Failed to send email to %s", kwargs.get("email_to"))
        return False
