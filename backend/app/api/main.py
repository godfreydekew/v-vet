from fastapi import APIRouter

from app.api.routes import farms, livestock, login, private, users, utils, vet_requests
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(farms.router)
api_router.include_router(livestock.router)
api_router.include_router(vet_requests.router)
api_router.include_router(utils.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
