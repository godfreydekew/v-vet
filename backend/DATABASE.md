# V-Vet — Database Structure

> **Design principle:** Lean and flat. Every table earns its place by serving a page directly. No premature optimisation, no tables that don't map to a real user action in the prototype.

---

## Tech Stack

| Layer | Choice |
|---|---|
| ORM | **SQLModel** (Pydantic + SQLAlchemy hybrid) |
| Database | **PostgreSQL** (Supabase) |
| Migrations | **Alembic** |
| Primary keys | **UUID v4** (all tables) |
| Enum values | Python `Literal` types — validated at the API layer |
| Timestamps | `datetime` with `timezone=True` (UTC stored) |

---

## Table Overview

| Table | Model file | Serves |
|---|---|---|
| `user` | `models/user.py` | All three roles — farmer, vet, admin |
| `vet_profile` | `models/vet_profile.py` | Vet-specific fields (licence, specialisations, availability) |
| `farm` | `models/farm.py` | Farmer's farm management pages |
| `livestock` | `models/livestock.py` | All animal profile and list pages |
| `health_observation` | `models/health_observation.py` | Animal Profile → Health History tab |
| `vaccination` | `models/vaccination.py` | Animal Profile → Vaccinations tab |
| `treatment` | `models/treatment.py` | Animal Profile → Treatments tab |
| `vet_request` | `models/vet_request.py` | Farmer's vet request flow + vet case queue |
| `vet_response` | `models/vet_response.py` | Vet case detail → submit response |

> **Password resets** are handled via JWT tokens (no dedicated table needed — see `app/utils.py`).

---

## Schema

Each entity follows the same four-layer schema pattern:

```
XxxBase      — shared fields (used by all layers)
XxxCreate    — write schema for creation (extends Base, adds FK fields)
XxxUpdate    — write schema for updates (all fields optional)
Xxx          — SQLModel table=True (DB model)
XxxPublic    — read schema returned by API
XxxsPublic   — paginated list response { data: [...], count: int }
```

---

### `user`

Single table for all roles. `role` field drives access control at the application layer.

```python
# models/user.py

UserRole = Literal["farmer", "vet", "admin"]

class User(UserBase, table=True):
    id: uuid.UUID                       # PK, auto-generated UUID v4
    email: EmailStr                     # unique, indexed
    role: UserRole                      # "farmer" | "vet" | "admin"
    is_active: bool                     # default True
    is_superuser: bool                  # default False — full platform access
    is_admin: bool                      # default False — admin dashboard access
    full_name: str | None
    phone_number: str | None
    address: str | None
    hashed_password: str                # Argon2 hash
    created_at: datetime                # UTC
    added_at: datetime | None           # set by admin when manually added
    updated_at: datetime | None
```

**Exposed schemas:**
- `UserCreate` — admin creates user (all fields + plain password)
- `UserRegister` — public signup (email, password, full_name, role)
- `UserUpdate` — admin updates any field
- `UserUpdateMe` — self-service: name, email, phone, address only
- `UpdatePassword` — requires current_password + new_password
- `UserPublic` — response (no hashed_password)
- `UsersPublic` — `{ data: UserPublic[], count: int }`

**Used by:** Login, registration, account settings, admin user management.

---

### `vet_profile`

One row per vet. Extends `user` for vet-specific fields.

```python
# models/vet_profile.py

AvailabilityStatus = Literal["available", "busy", "unavailable"]

class VetProfile(VetProfileBase, table=True):
    __tablename__ = "vet_profile"

    id: uuid.UUID                       # PK
    user_id: uuid.UUID                  # FK → user.id (unique — 1:1)
    licence_number: str | None
    specialisations: str | None         # comma-separated: "Cattle,Sheep,Goats"
    years_experience: int | None
    availability_status: AvailabilityStatus   # default "available"
    created_at: datetime
    updated_at: datetime | None
```

**Used by:** Vet account settings, admin vet list, admin assign-vet modal.

---

### `farm`

Each farm belongs to one farmer.

```python
# models/farm.py

FarmType = Literal["livestock", "dairy", "poultry", "mixed", "crop"]

class Farm(FarmBase, table=True):
    id: uuid.UUID                       # PK
    farmer_id: uuid.UUID                # FK → user.id
    name: str                           # max 150 chars
    farm_type: FarmType
    address: str | None
    city: str | None
    country: str | None
    size_hectares: float | None
    description: str | None
    is_active: bool                     # default True
    created_at: datetime
    updated_at: datetime | None
```

**Used by:** My Farms page, Farm Detail page, admin All Farms page.

---

### `livestock`

Each animal belongs to one farm.

```python
# models/livestock.py

Species      = Literal["cattle", "sheep", "goat", "poultry", "pig", "other"]
Gender       = Literal["male", "female", "unknown"]
HealthStatus = Literal["healthy", "sick", "recovering", "deceased"]

class Livestock(LivestockBase, table=True):
    id: uuid.UUID                       # PK
    farm_id: uuid.UUID                  # FK → farm.id
    name: str | None
    tag_number: str | None
    species: Species
    breed: str | None
    gender: Gender | None
    weight_kg: float | None
    date_of_birth: date | None
    acquired_date: date | None
    health_status: HealthStatus         # default "healthy"
    notes: str | None
    created_at: datetime
    updated_at: datetime | None
```

**Used by:** Farm Detail (livestock list), Animal Profile, farmer dashboard health breakdown, admin All Livestock page.

---

### `health_observation`

One row per observation logged by a farmer against an animal.

```python
# models/health_observation.py

AppetiteLevel   = Literal["normal", "reduced", "poor", "absent"]
ActivityLevel   = Literal["normal", "lethargic", "restless", "aggressive"]
MilkProduction  = Literal["normal", "decreased", "stopped", "not_applicable"]

class HealthObservation(HealthObservationBase, table=True):
    __tablename__ = "health_observation"

    id: uuid.UUID                       # PK
    livestock_id: uuid.UUID             # FK → livestock.id
    logged_by: uuid.UUID                # FK → user.id (the farmer)
    body_temp_celsius: float | None
    heart_rate_bpm: int | None
    respiratory_rate: int | None
    appetite_level: AppetiteLevel | None
    activity_level: ActivityLevel | None
    symptoms: str | None
    symptom_duration_days: int | None
    milk_production: MilkProduction | None
    notes: str | None
    observed_at: datetime               # UTC
```

**Used by:** Animal Profile → Health History tab, vet case detail (farmer's observations).

---

### `vaccination`

One row per vaccination event per animal.

```python
# models/vaccination.py

AdministeredBy = Literal["farmer", "vet", "other"]

class Vaccination(VaccinationBase, table=True):
    id: uuid.UUID                       # PK
    livestock_id: uuid.UUID             # FK → livestock.id
    logged_by: uuid.UUID                # FK → user.id
    vaccine_name: str                   # max 150 chars
    date_given: date
    administered_by: AdministeredBy
    next_due_date: date | None
    notes: str | None
    created_at: datetime
```

**Used by:** Animal Profile → Vaccinations tab, farmer dashboard (overdue vaccinations).

---

### `treatment`

One row per treatment event per animal.

```python
# models/treatment.py

AdministeredBy = Literal["farmer", "vet", "other"]

class Treatment(TreatmentBase, table=True):
    id: uuid.UUID                       # PK
    livestock_id: uuid.UUID             # FK → livestock.id
    logged_by: uuid.UUID                # FK → user.id
    treatment_name: str                 # max 150 chars
    drug_used: str | None               # max 150 chars
    dosage: str | None                  # e.g. "5ml per 100kg"
    date_given: date
    administered_by: AdministeredBy
    outcome_notes: str | None
    created_at: datetime
```

**Used by:** Animal Profile → Treatments tab, vet case detail (treatment history).

---

### `vet_request`

One row per case submitted by a farmer. Tracks the full lifecycle.

```python
# models/vet_request.py

RequestStatus = Literal["pending", "assigned", "in_review", "completed", "cancelled"]
UrgencyLevel  = Literal["low", "medium", "high", "emergency"]

class VetRequest(VetRequestBase, table=True):
    __tablename__ = "vet_request"

    id: uuid.UUID                       # PK
    livestock_id: uuid.UUID             # FK → livestock.id
    farm_id: uuid.UUID                  # FK → farm.id
    farmer_id: uuid.UUID                # FK → user.id
    vet_id: uuid.UUID | None            # FK → user.id — NULL until admin assigns
    status: RequestStatus               # default "pending"
    urgency: UrgencyLevel               # default "medium"
    farmer_notes: str | None
    submitted_at: datetime
    assigned_at: datetime | None
    completed_at: datetime | None
    updated_at: datetime | None
```

**Used by:** Farmer My Vet Requests page, vet case queue, admin Verification Requests page (assign vet).

---

### `vet_response`

One row per completed case. Stores the vet's diagnosis and recommendations.

```python
# models/vet_response.py

ResponseType    = Literal["accept", "accept_supplement", "rediagnose"]
ConfidenceLevel = Literal["low", "medium", "high"]

class VetResponse(VetResponseBase, table=True):
    __tablename__ = "vet_response"

    id: uuid.UUID                       # PK
    vet_request_id: uuid.UUID           # FK → vet_request.id (unique — 1:1)
    vet_id: uuid.UUID                   # FK → user.id
    response_type: ResponseType
    diagnosis: str | None
    treatment_recommendation: str | None
    drug_name: str | None
    dosage: str | None
    confidence_level: ConfidenceLevel   # default "high"
    follow_up_required: bool            # default False
    follow_up_date: date | None
    vet_notes: str | None
    responded_at: datetime
```

**Used by:** Vet case detail (submit response), farmer vet request detail (view response), vet follow-up tracker.

---

## Relationships at a Glance

```
user
 ├── vet_profile         (1:1 — vets only)
 ├── farm                (1:many — farmers only)
 │    └── livestock      (1:many)
 │         ├── health_observation  (1:many)
 │         ├── vaccination         (1:many)
 │         ├── treatment           (1:many)
 │         └── vet_request         (1:many)
 │              └── vet_response   (1:1)
 └── [password reset via JWT tokens — no table]
```

---

## Enums Reference

| Field | Values |
|---|---|
| `user.role` | `farmer` `vet` `admin` |
| `vet_profile.availability_status` | `available` `busy` `unavailable` |
| `farm.farm_type` | `livestock` `dairy` `poultry` `mixed` `crop` |
| `livestock.species` | `cattle` `sheep` `goat` `poultry` `pig` `other` |
| `livestock.gender` | `male` `female` `unknown` |
| `livestock.health_status` | `healthy` `sick` `recovering` `deceased` |
| `health_observation.appetite_level` | `normal` `reduced` `poor` `absent` |
| `health_observation.activity_level` | `normal` `lethargic` `restless` `aggressive` |
| `health_observation.milk_production` | `normal` `decreased` `stopped` `not_applicable` |
| `vaccination.administered_by` | `farmer` `vet` `other` |
| `treatment.administered_by` | `farmer` `vet` `other` |
| `vet_request.status` | `pending` `assigned` `in_review` `completed` `cancelled` |
| `vet_request.urgency` | `low` `medium` `high` `emergency` |
| `vet_response.response_type` | `accept` `accept_supplement` `rediagnose` |
| `vet_response.confidence_level` | `low` `medium` `high` |

---

## API Endpoints (Users)

All endpoints under `/api/v1/`.

### Authentication (`api/routes/login.py`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/login/access-token` | Public | OAuth2 login → returns JWT |
| `POST` | `/login/test-token` | Bearer | Verify token, returns current user |
| `POST` | `/password-recovery/{email}` | Public | Send password reset email |
| `POST` | `/reset-password/` | Public | Reset with token |
| `POST` | `/password-recovery-html-content/{email}` | Superuser | Preview reset email HTML |

### User CRUD (`api/routes/users.py`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/users/signup` | Public | Self-registration |
| `GET` | `/users/me` | Bearer | Get own profile |
| `PATCH` | `/users/me` | Bearer | Update own profile (name, email, phone, address) |
| `PATCH` | `/users/me/password` | Bearer | Change own password |
| `DELETE` | `/users/me` | Bearer | Delete own account |
| `GET` | `/users/` | Superuser | List all users (paginated) |
| `POST` | `/users/` | Superuser | Admin-create a user |
| `GET` | `/users/{user_id}` | Bearer | Get user by ID (self or superuser) |
| `PATCH` | `/users/{user_id}` | Superuser | Admin-update any user |
| `DELETE` | `/users/{user_id}` | Superuser | Admin-delete any user |

---

## Frontend Alignment

The frontend `User` interface in `AuthContext.tsx` expects these fields from the API:

| Frontend field | Backend field | Notes |
|---|---|---|
| `id` | `id` | UUID as string |
| `name` | `full_name` | Frontend maps `full_name → name` on integration |
| `email` | `email` | ✓ Direct match |
| `role` | `role` | ✓ Added — `"farmer" \| "vet" \| "admin"` |
| `phone` | `phone_number` | Frontend maps `phone_number → phone` on integration |
| `address` | `address` | ✓ Direct match |

The frontend currently uses mock authentication. When integrating with the backend:
1. `POST /api/v1/login/access-token` with `username=email&password=password` (form data)
2. Store the returned `access_token` (JWT) in localStorage
3. Send `Authorization: Bearer <token>` on all subsequent requests
4. `GET /api/v1/login/test-token` to restore session on page reload

---

## Notes on AI Readiness

When AI is integrated, it will read from these tables without any schema changes:

- `health_observation` → symptom input for triage
- `treatment` → drug history to avoid repeat prescriptions
- `vaccination` → immunisation context
- `vet_response` → past confirmed diagnoses as ground truth labels
