# V-Vet Triage & Decision-Support Engine — Proposal

**Status:** Draft for team and vet review
**Scope (v1):** Cattle · Tick-borne disease · January Disease (Theileriosis)
**Knowledge source:** *V-VET Triage & Decision Engine Template — January Disease (Theileriosis)*, completed by our field vet

---

## 1. Summary

We want V-Vet to take a farmer's WhatsApp description of a sick animal (text, voice or photo) and turn it into:

1. **Structured findings** stored in our database,
2. **An assessment** of which condition the signs are consistent with, citing the exact parts of our vet-written knowledge base that drove it,
3. **An escalation decision** (emergency, urgent, monitor) and safe next steps for the farmer.

We will not try to write a perfect algorithm up front. Instead, we start from the vet's document, encode it as a **versioned decision graph** (a flowchart stored as data), and run a closely supervised pilot with **10 farmers**, with vets reviewing every case and examining animals on the ground. Every interaction either confirms the graph or exposes a gap. The model drafts improvements; vets approve them; each approved change becomes a new version.

Over time this grows into a robust, vet-validated triage algorithm, built from real farmer conversations rather than guessed in advance.

### What we call it

Externally: a **triage and decision-support engine**, not a diagnostic engine. It indicates what signs are *consistent with* and how urgently a vet is needed; confirmation remains with a vet (examination, and where needed a blood or lymph-node smear). This matches the vet template's own disclaimer, keeps us clear of rules reserving diagnosis to registered vets, and discourages farmers from self-treating on the app's word.

Farmer-facing wording looks like: *"These signs may point to January Disease. A vet should check your animal within 12 hours."*

---

## 2. Why this approach

- **Diagnosis in the field is systematic.** Ask the right questions, collect the right signs, apply known rules. The vet document already captures most of this: a signs dictionary (§5), follow-up questions (§6), and an escalation table (§7).
- **We can't write the full algorithm before seeing real farmers.** We don't yet know how farmers describe signs (e.g. *mbandabvu* for swollen lymph nodes), which questions they can answer, or where they drop off.
- **A model alone is not safe enough; rules alone are too rigid.** So each does what it's good at:

| Responsibility | Who / what |
|---|---|
| Understanding messy farmer language, voice notes, local terms | Model (LLM) |
| Asking natural follow-up questions in the farmer's language | Model |
| Deciding escalation (emergency / urgent / monitor) | **Deterministic rules from the vet document — the model can never lower an escalation** |
| Suggesting the likely condition, with citations | Model, constrained to the knowledge base |
| Confirming diagnoses, approving changes to the graph | Vets |

---

## 3. How it works

### 3.1 Flow of a case

```
Farmer message (text / voice / photo)
        │
        ▼
Extraction ── model maps words to fixed sign IDs, stores findings + farmer's own words
        │
        ▼
Red-flag check ── deterministic; any critical sign → ESCALATE immediately
        │
        ▼
Walk the decision graph
   • finding already known (from free text)? → follow the edge, don't ask
   • finding unknown? → ask the node's question (Yes / No / Not sure)
        │
        ▼
Outcome node ── escalate (with timeframe) / monitor (with follow-up time)
        │
        ▼
Assessment ── suspected condition, supporting & contradicting signs, cited sections
        │
        ▼
Farmer guidance (§9 safe actions)  +  vet notified with case summary (§8)
        │
        ▼
Follow-up at 24h / 48h (§10, §12) ── better / same / worse
        │
        ▼
Vet review ── agree / disagree, actual condition, what was missed
```

### 3.2 The knowledge base

The PDF is converted into a structured file with **stable IDs for every rule and section**, so every decision can cite exactly what drove it (e.g. `JD.S7.R1` = §7, row 1: *lumps + fever → escalate within 12 hours*).

### 3.3 The decision graph (the "flowchart")

The graph is stored as data, not code. Each node **checks a finding** rather than asking a fixed question, so it works whether the farmer writes a paragraph or just says "my cow is sick".

```yaml
version: jd-0.1
approved_by: <vet name>          # §13 of the vet template
source: january_disease.pdf

nodes:
  red_flags:                     # §8 — always evaluated first
    type: rule
    any_of: [froth_nose, open_mouth_breathing, cloudy_eye, unable_to_stand]
    yes: ESCALATE_EMERGENCY
    no: lumps
    cites: [JD.S7.R2, JD.S7.R3, JD.S8]

  lumps:
    type: check
    finding: swelling.below_ear_or_shoulder
    ask: "Have you felt or seen hard lumps below the ears or in front of the shoulder?"
    yes: fever
    no: other_signs
    not_sure: fever              # §7 — escalate conservatively
    cites: [JD.S6.Q1]

  fever:
    type: check
    finding: fever
    ask: "Does the animal feel hot, especially at the base of the ears?"
    yes: ESCALATE_12H            # §7 row 1 — Buparvaquone window
    no: MONITOR_DAILY_TEMP
    not_sure: ESCALATE_12H
    cites: [JD.S7.R1]

  other_signs:
    type: check
    finding: red_urine
    ask: "Is the urine red, brown, or the colour of strong tea?"
    yes: POSSIBLE_OTHER_TBD      # e.g. redwater — not in KB yet, route to vet
```

The same file is:
- **rendered as a flowchart** for vets to review, with changes between versions highlighted,
- **executed by a small engine**, so escalation is deterministic and testable,
- **referenced by every case**, which logs the version and exact path taken, e.g.
  `red_flags → lumps (yes, from free text) → fever (not_sure) → ESCALATE_12H @ jd-0.1`.

### 3.4 Where the model's judgement fits

When the graph has no node for a situation, the model uses its judgement, **routes the case to a vet**, and flags it as an **uncovered path**. Uncovered paths and vet disagreements are exactly where the graph should grow next.

### 3.5 Two kinds of memory

Similar to how an assistant keeps notes about a user, but split by risk:

| | Written by | Goes live |
|---|---|---|
| **Case & farmer memory** — herd, dipping schedule and dip tank, local words this farmer uses, past cases | Model, automatically | Immediately |
| **Diagnostic rules** — signs, questions, edges, escalation | Model *proposes* a change | **Only after vet approval**, as a new version |

The model never retrains or rewrites rules on its own. The model stays fixed; the knowledge it reads improves, under vet control.

### 3.6 The improvement loop

1. Every case is reviewed by a vet: agree / disagree, actual condition (confirmed on the ground where possible), missed question or misread sign.
2. Weekly, the model drafts proposed changes from disagreements and uncovered paths, e.g. *"add 'mapundu' as a synonym for lymph node swelling"*, *"ask about urine colour earlier"*.
3. Vets approve or reject each change. Approved changes become a new version (`jd-0.1 → jd-0.2`).
4. All past cases are re-run against the new version as regression tests, so a fix for one case doesn't break another.

Guardrails against bloat: a change needs at least two supporting cases or a clear vet rationale; nodes that never fire get reviewed for removal.

---

## 4. What we need to do

### 4.1 From the vets (before the pilot)

- [ ] **Complete §11 and §12** of the template (monitoring instructions, signs that trigger escalation, follow-up timing). These are currently mostly blank.
- [ ] **Split §8 emergency indicators** into *emergency* vs *urgent (within 24h)*. As written ("any temperature above 39.5°C", "any change in breathing"), nearly every case would escalate.
- [ ] **Tick the "Can farmer see it?" column** in §5, so we only ask questions farmers can answer.
- [ ] **Confirm rules still hold without a thermometer.** Most farmers will answer "feels hot at the base of the ears".
- [ ] **Add local wording** for signs (beyond *mbandabvu*).
- [ ] **Write 20–30 example cases** with the correct outcome. These become our regression tests.
- [ ] **Agree a review routine**: who reviews which cases, how fast, and who approves graph changes.
- [ ] **Confirm on-ground follow-up**: which escalated cases get examined in person, and whether smears can be done on some.

### 4.2 Engineering

**Phase 1 — Foundation (rough estimate: 2–3 weeks)**
- [ ] Convert the PDF into a structured knowledge file with stable section IDs (`backend/app/assistant/knowledge/`).
- [ ] Build `jd-0.1` decision graph from §5–§8, reviewed by vets against the original document.
- [ ] Graph engine: walk nodes, skip known findings, apply red-flag rules first, return outcome + path.
- [ ] `record_findings` tool for the model: accepts only sign IDs from the dictionary, stores value (yes / no / not sure), location where relevant, and the farmer's exact words.
- [ ] Database: findings table (one row per finding, linked to `TriageSession`), case notes / farmer memory, assessment (suspected condition, supporting/contradicting signs, citations, graph version, path), vet verdict.
- [ ] Assessment output schema, with escalation filled by the engine, never by the model.
- [ ] Hook into the existing report-sickness flow and context questions (`flows/triage_context_questions.py`).
- [ ] Regression tests from the vets' example cases.

**Phase 2 — Vet tooling (rough estimate: 1–2 weeks)**
- [ ] Case review screen in the admin/vet dashboard: farmer's words, extracted findings, path taken, verdict, and agree/disagree + actual condition + notes.
- [ ] Flowchart view of the current graph version, with diffs for proposed changes.
- [ ] Proposed-changes queue with approve / reject and version bump.
- [ ] Uncovered-path report.

**Phase 3 — Pilot (December–March, rainy season)**
- [ ] Onboard 10 farmers, explain what the service does and does not do.
- [ ] Weekly graph review with vets.
- [ ] Track: missed emergencies, agreement with vets, time to escalation, questions per case, where farmers stop replying, animal outcomes.

**Phase 4 — Expand (ongoing)**
- [ ] Add Redwater (Babesiosis), Anaplasmosis and Heartwater as vet templates arrive, turning "possible other TBD" into a real differential.

Timing matters: the vet template puts the January Disease peak at December–March. Launching the pilot in the next few weeks catches the season; launching in April may yield very few cases.

---

## 5. How we'll know it's working

| Measure | Target direction |
|---|---|
| Emergencies the vet would have escalated but the engine didn't | **Zero.** This is the most important number |
| Agreement between engine assessment and vet (on-ground where possible) | Increasing version over version |
| Cases hitting an uncovered path | Decreasing over time |
| Questions asked per case | Under 5 where possible (template guidance) |
| Farmers who stop replying mid-triage | Low; investigate where drop-off happens |
| Time from first message to vet escalation | As short as possible for emergencies |

---

## 6. Risks and how we handle them

| Risk | Mitigation |
|---|---|
| Vet review time becomes the bottleneck | One-screen case review; weekly batched change proposals |
| Graph bloats with one-off rules | Two-case or clear-rationale rule for changes; prune unused nodes |
| Farmers can't answer (no thermometer, can't feel lymph nodes) | "Not sure" on every question with conservative handling; questions vetted for observability |
| Farmers report late, when the animal is already critical | Expect it early on; encourage early reporting separately from the engine |
| Non-January-Disease cases forced into the January Disease profile | "Possible other TBD → vet" path from day one (e.g. red urine) |
| Farmers self-treat on the app's word (e.g. Diminazene, which is ineffective here) | "Consistent with", never "diagnosed"; vet-only actions (§9) never given as farmer instructions |
| Mandatory reporting under the Animal Health Act | Notify vets/DVS per §8 within 24h; include required info (sick vs dead count, signs, last dip date and product, location/dip tank) |

---

## 7. Open questions

- Which vets review cases, and what turnaround can they commit to?
- How many escalated cases can be examined in person, and can smears be taken on some?
- Who signs off a new graph version: one vet or two?
- What does the farmer get if escalation is recommended but no vet can reach them in time?
- Which languages do the 10 pilot farmers use?
