# V-Vet Prototype — Functionality Specification

> **Goal:** Get farmers actively using the system to log their livestock data before AI is introduced.  
> Every record a farmer enters today becomes training signal and context for the AI tomorrow.

---

## Role Overview

| Role    | Primary Purpose                                              |
|---------|--------------------------------------------------------------|
| Farmer  | Manage farms, log livestock, record health observations      |
| Vet     | Review farmer-submitted cases and provide diagnoses          |
| Admin   | Register users, oversee all platform activity               |

---

## 🧑‍🌾 Farmer

The farmer portal is the heart of the prototype. Everything is designed around one goal: making it easy and fast for farmers like Mary to log their animals and keep their health records up to date.

---

### 1. Authentication

- Login with email and password
- Password recovery via shortcode link
- Edit personal profile (name, phone, address)

---

### 2. Farm Management

Farmers can have one or more farms.

**Functionality:**
- Create a farm — name, farm type (livestock / dairy / poultry / mixed), address, size in hectares
- View a list of all their farms with a livestock count per farm
- Edit farm details
- Delete a farm
- Click into a farm to see its livestock

---

### 3. Livestock Management

Each animal is registered to a specific farm.

**Functionality:**
- Add an animal — species/category (cattle, sheep, goats, poultry etc.), name, tag number, breed, gender, weight (kg), date of birth, acquisition date, notes
- View all livestock on a farm — filterable by species and health status
- Search livestock by name or tag number
- View an individual animal's full profile
- Edit animal details
- Delete an animal
- Mark an animal's current health status: `Healthy / Sick / Recovering / Deceased`

---

### 4. Health Observations

This is the core data-entry feature. When a farmer notices something wrong with an animal, they log it here.

**Functionality:**
- Log a health observation against any animal
- Fields include: body temperature, heart rate, respiratory rate, appetite level, activity level, symptoms observed, duration of symptoms (in days), milk production (if applicable)
- View the full observation history for any animal in chronological order
- Each observation is timestamped

> **Why this matters:** This becomes the health timeline that the AI will read when it arrives. Every observation logged now is a data point.

---

### 5. Vaccination Tracker

**Functionality:**
- Log a vaccination against an animal — vaccine name, date given, administered by (farmer / vet), next due date
- View upcoming and overdue vaccinations per animal
- View vaccination history per animal

---

### 6. Treatment Log

**Functionality:**
- Log a treatment against an animal — treatment name, drug/medicine used, dosage, date, administered by, outcome notes
- View full treatment history per animal

> **Why this matters:** When the AI later says "Shumba had anaplasmosis 4 months ago, treated with oxytetracycline" — this is where that data comes from.

---

### 7. Vet Request (Case Submission)

When a farmer believes an animal is sick, they can request a vet review.

**Functionality:**
- Submit a vet request for a specific animal — include urgency level (low / medium / high / emergency) and notes describing the problem
- View the status of all submitted requests: `Pending → Assigned → In Review → Completed`
- View the vet's response once a case is completed (diagnosis, treatment recommendation, follow-up instructions)

---

### 8. Farmer Dashboard

A summary view of everything at a glance.

**Functionality:**
- Total farms and total livestock count
- Livestock health breakdown: how many healthy / sick / recovering / deceased
- Animals with overdue vaccinations
- Recent health observations logged
- Status of open vet requests

---

## 🩺 Vet

The vet portal is built around reviewing farmer-submitted cases. Vets do not manage farms or livestock directly — they respond to requests assigned to them by admin.

---

### 1. Authentication

- Login and password recovery (same as farmer)
- Edit profile — licence number, specialisations, years of experience
- Set availability status: `Available / Busy / Unavailable`

---

### 2. Case Queue (Verification Requests)

**Functionality:**
- View all cases assigned to them
- Filter by urgency (emergency first) and status (assigned / in review / completed)
- See key details at a glance: animal name, tag, species, farm name, farmer name, urgency, date submitted

---

### 3. Case Review

When a vet opens a case, they see everything the farmer has logged.

**Functionality:**
- View the animal's full profile (species, breed, weight, age, gender)
- View the farmer's health observations for this case
- View the animal's full health history (all past observations)
- View past treatment logs (what drugs have been used before)
- View vaccination records

**Vet Response:**
- Submit a diagnosis — accept the farmer's assessment, supplement it, or re-diagnose
- Add treatment recommendation (drug, dosage, method)
- Add vet notes
- Set follow-up required (yes/no) and follow-up date
- Mark case as completed

---

### 4. Follow-up Tracker

**Functionality:**
- View all animals flagged for follow-up with due dates
- Mark a follow-up as completed once done

---

### 5. Vet Dashboard

**Functionality:**
- Total cases: assigned, in review, completed
- Cases by urgency level
- Cases by livestock species
- Recent activity (last 30 days)

---

## 🔧 Admin

The admin portal is for platform oversight and user management. Admins do not interact with livestock data directly but can see everything.

---

### 1. Authentication

- Login and password recovery
- Edit own profile

---

### 2. User Management

**Functionality:**
- Register new farmers — name, email, phone, address
- Register new vets — name, email, phone, licence number, specialisations, years of experience
- View list of all farmers
- View list of all vets (including their availability status and verification status)
- Edit any user's details

---

### 3. Verification Request Management

This is the admin's most critical operational task — making sure sick animals get a vet assigned quickly.

**Functionality:**
- View all verification requests across the platform
- Filter by status, urgency, farm, and farmer
- Assign a vet to a pending request (admin selects from available vets)
- View request details: animal, farm, farmer, urgency, farmer notes

---

### 4. Platform Overview

**Functionality:**
- View all farms on the platform (searchable and filterable by farm type, location, farmer)
- View all livestock on the platform (filterable by species, health status)
- View all verification requests (filterable by status and urgency)

---

### 5. Admin Dashboard

**Functionality:**
- Total users (farmers and vets)
- Total farms and total livestock
- Verification request volume by status
- Platform activity over the last 30 days

---

## Pages Summary

### Farmer Pages

| Page                        | Core Action                                      |
|-----------------------------|--------------------------------------------------|
| Dashboard                   | Herd health snapshot, open cases, reminders      |
| My Farms                    | List and manage farms                            |
| Farm Detail                 | View livestock on a specific farm                |
| Add / Edit Farm             | Farm CRUD                                        |
| Livestock List              | Browse and filter animals on a farm              |
| Animal Profile              | Full record: details, health history, treatments, vaccinations |
| Add / Edit Animal           | Livestock CRUD                                   |
| Log Health Observation      | Submit health data for an animal                 |
| Log Vaccination             | Record a vaccine                                 |
| Log Treatment               | Record a treatment                               |
| Submit Vet Request          | Request vet review for a sick animal             |
| My Vet Requests             | Track status of all submitted cases              |
| Account Settings            | Edit profile and password                        |

### Vet Pages

| Page                        | Core Action                                      |
|-----------------------------|--------------------------------------------------|
| Dashboard                   | Cases summary, follow-up alerts                  |
| Case Queue                  | All assigned cases, sortable by urgency          |
| Case Detail                 | Full animal history + submit vet response        |
| Follow-up Tracker           | Animals due for follow-up                        |
| Account Settings            | Edit profile, availability, specialisations      |

### Admin Pages

| Page                        | Core Action                                      |
|-----------------------------|--------------------------------------------------|
| Dashboard                   | Platform-wide stats                              |
| Farmers                     | View and register farmers                        |
| Vets                        | View and register vets                           |
| All Farms                   | Oversee all farms                                |
| All Livestock               | Oversee all animals                              |
| Verification Requests       | View and assign vet requests                     |
| Account Settings            | Edit own profile                                 |

---

## What is deliberately excluded from the prototype

The following features are planned for after AI integration and are **not** in scope for the prototype:

- AI symptom triage and diagnosis
- Automated disease outbreak alerts
- Automated vaccination reminders and push notifications
- WhatsApp / SMS / USSD interfaces
- Voice input and multilingual transcription
- Disease surveillance map
- Confidence-scored AI assessments

---

## Why this scope

Every piece of data entered in the prototype — health observations, treatments, vaccinations, vet responses — becomes the foundation the AI model will use. The prototype is not a stepping stone to be discarded. It is the data collection engine that makes V-Vet's AI meaningful the moment it is switched on.