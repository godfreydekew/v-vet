# Re-export all models so that existing imports (e.g. `from app.models import User`)
# continue to work after the migration from models.py to the models/ package.
#
# Importing all table models here also ensures SQLModel registers every table
# before Alembic or SQLModel.metadata.create_all() is called.

from sqlmodel import SQLModel

from app.models.farm import (
    Farm,
    FarmBase,
    FarmCreate,
    FarmPublic,
    FarmsPublic,
    FarmUpdate,
)
from app.models.health_observation import (
    HealthObservation,
    HealthObservationBase,
    HealthObservationCreate,
    HealthObservationPublic,
    HealthObservationsPublic,
    HealthObservationUpdate,
)
from app.models.livestock import (
    Livestock,
    LivestockBase,
    LivestockCreate,
    LivestockPublic,
    LivestocksPublic,
    LivestockUpdate,
)
from app.models.shared import Message, NewPassword, Token, TokenPayload
from app.models.treatment import (
    Treatment,
    TreatmentBase,
    TreatmentCreate,
    TreatmentPublic,
    TreatmentsPublic,
    TreatmentUpdate,
)
from app.models.user import (
    UpdatePassword,
    User,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.models.vaccination import (
    Vaccination,
    VaccinationBase,
    VaccinationCreate,
    VaccinationPublic,
    VaccinationsPublic,
    VaccinationUpdate,
)
from app.models.vet_profile import (
    VetProfile,
    VetProfileBase,
    VetProfileCreate,
    VetProfilePublic,
    VetProfileUpdate,
)
from app.models.vet_request import (
    VetRequest,
    VetRequestBase,
    VetRequestCreate,
    VetRequestPublic,
    VetRequestsPublic,
    VetRequestUpdate,
)
from app.models.vet_response import (
    VetResponse,
    VetResponseBase,
    VetResponseCreate,
    VetResponsePublic,
    VetResponseUpdate,
)

__all__ = [
    # SQLModel
    "SQLModel",
    # Shared
    "Message",
    "NewPassword",
    "Token",
    "TokenPayload",
    # User
    "UpdatePassword",
    "User",
    "UserBase",
    "UserCreate",
    "UserPublic",
    "UserRegister",
    "UsersPublic",
    "UserUpdate",
    "UserUpdateMe",
    # Farm
    "Farm",
    "FarmBase",
    "FarmCreate",
    "FarmPublic",
    "FarmsPublic",
    "FarmUpdate",
    # Livestock
    "Livestock",
    "LivestockBase",
    "LivestockCreate",
    "LivestockPublic",
    "LivestocksPublic",
    "LivestockUpdate",
    # HealthObservation
    "HealthObservation",
    "HealthObservationBase",
    "HealthObservationCreate",
    "HealthObservationPublic",
    "HealthObservationsPublic",
    "HealthObservationUpdate",
    # Vaccination
    "Vaccination",
    "VaccinationBase",
    "VaccinationCreate",
    "VaccinationPublic",
    "VaccinationsPublic",
    "VaccinationUpdate",
    # Treatment
    "Treatment",
    "TreatmentBase",
    "TreatmentCreate",
    "TreatmentPublic",
    "TreatmentsPublic",
    "TreatmentUpdate",
    # VetProfile
    "VetProfile",
    "VetProfileBase",
    "VetProfileCreate",
    "VetProfilePublic",
    "VetProfileUpdate",
    # VetRequest
    "VetRequest",
    "VetRequestBase",
    "VetRequestCreate",
    "VetRequestPublic",
    "VetRequestsPublic",
    "VetRequestUpdate",
    # VetResponse
    "VetResponse",
    "VetResponseBase",
    "VetResponseCreate",
    "VetResponsePublic",
    "VetResponseUpdate",
]
