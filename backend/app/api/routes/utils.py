from fastapi import APIRouter, Depends
from pydantic.networks import EmailStr

from app.api.deps import SessionDep, get_current_active_superuser
from app.crud import get_all_active_users
from app.models import Message, BroadcastEmailRequest
from app.utils import generate_test_email, generate_broadcast_email, send_email

router = APIRouter(prefix="/utils", tags=["utils"])


@router.post(
    "/test-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def test_email(email_to: EmailStr) -> Message:
    """
    Test emails.
    """
    email_data = generate_test_email(email_to=email_to)
    send_email(
        email_to=email_to,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Test email sent")


@router.post(
    "/broadcast-email/",
    dependencies=[Depends(get_current_active_superuser)],
    status_code=201,
)
def broadcast_email(
    session: SessionDep,
    email_request: BroadcastEmailRequest,
) -> Message:
    """
    Send a broadcast email to all active users.
    
    Requires superuser/admin privileges.
    """
    users = get_all_active_users(session=session)
    
    if not users:
        return Message(message="No active users found")
    
    email_data = generate_broadcast_email(
        subject=email_request.subject,
        message=email_request.message,
    )
    
    successful_sends = 0
    failed_sends = 0
    
    for user in users:
        try:
            send_email(
                email_to=user.email,
                subject=email_data.subject,
                html_content=email_data.html_content,
            )
            successful_sends += 1
        except Exception as e:
            failed_sends += 1
            print(f"Failed to send email to {user.email}: {e}")
    
    return Message(
        message=f"Broadcast email sent to {successful_sends} users. Failed: {failed_sends}"
    )


@router.get("/health-check/")
async def health_check() -> bool:
    return True
