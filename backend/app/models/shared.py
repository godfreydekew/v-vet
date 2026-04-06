from sqlmodel import Field, SQLModel


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class BroadcastEmailRequest(SQLModel):
    """Admin request to send broadcast email to all users."""
    subject: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1)
