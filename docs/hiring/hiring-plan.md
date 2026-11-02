# Hiring plan: Software Engineer

**Status:** draft for both founders to review
**Role:** Software Engineer, contract, remote within Zimbabwe, 1-month probation with the potential for a full-time role
**Job post:** https://vvet.org/careers/software-engineer
**Flyer:** `docs/hiring/flyer/software-engineer.png`

This document covers everything from launching the post to the end of the new engineer's probation: what we ask, how we score it, and what happens at each step. Anything marked **Decide** needs both of us to agree before we share the flyer.

---

## 1. Decisions to make before we share the flyer

- [ ] **Pay.** Monthly rate in USD for the contract, and whether probation is paid at the same rate (recommended: yes). See section 9.
- [ ] **Start date.** When we want the person to start.
- [ ] **Who does what.** Who reviews applications, who interviews, who makes the final call (recommended: both of us interview, both must agree to hire).
- [ ] **How fast we reply.** Recommended: review every application within 5 working days of the coding task arriving.
- [ ] **The contract.** We need a contractor agreement that covers pay, notice, confidentiality and that the code they write belongs to V-Vet. Ideally checked by a lawyer.
- [ ] **How many hires.** Recommended: one for now.
- [ ] **The live coding exercise** in Appendix B. Read it and agree it's fair.
- [ ] **Launch checklist** in section 2 is done.

---

## 2. Launch checklist (before the flyer goes out)

- [ ] Merge `feat/public-pages` and deploy.
- [ ] Email settings added in Azure (see `docs/setup/email.md`).
- [ ] One of us applies as a test, gets the coding task email, and the application arrives with the CV.
- [ ] The link preview shows the hiring card (paste the job link into https://developers.facebook.com/tools/debug/).
- [ ] The privacy notice at https://vvet.org/privacy has been read by both of us, ideally checked by a lawyer.
- [ ] A shared place to track candidates (a simple spreadsheet is fine: name, date applied, task received, review score, stage, decision).

---

## 3. Who we're looking for

**Must have**
- Cares about solving real problems in Zimbabwe.
- Has built something on top of an LLM (tool calling, structured output, prompt design), at work or in a serious side project.
- Comfortable working with APIs.
- Writes Python and JavaScript or TypeScript.
- At least 1 to 2 years of development experience, or projects that show they can do the work.
- Lives in Zimbabwe.

**Strong plus**
- Speaks Shona or Ndebele.
- Has used the WhatsApp Business API.

**How they work**
- Comfortable with ambiguity, makes progress without detailed instructions.
- Writes tests and checks that things actually work.
- Communicates clearly in writing.
- Works well independently and asks for help when needed.
- Curious about farmers and how they use the product.

We dropped the degree requirement on purpose. We judge people on what they've built and how they think.

---

## 4. The process at a glance

| Step | What happens | Who | How long |
|---|---|---|---|
| 1. Apply | Candidate fills in the form on the job page | Candidate | About 10 minutes |
| 2. Coding task | Sent automatically by email the moment they apply | Automatic, then candidate | 3 to 4 hours of work, 7 days to send it |
| 3. Review | We read the application and the coding task together | Both founders | Within 5 working days of the task arriving |
| 4. Interview | Task walkthrough, live coding (AI allowed), behavioural questions | Both founders | 75 minutes, video call |
| 5. Decision | We decide, check references, send an offer or a kind no | Both founders | Within 3 working days of the interview |
| 6. Probation | One month on a real piece of the product | New engineer, both founders | 4 weeks |

The job post has no closing date. We review in weekly batches, and close the post when we've hired.

---

## 5. Step by step

### Step 1: Apply

The candidate fills in the form at https://vvet.org/careers/software-engineer:

- Full name, email, phone or WhatsApp number, town or city
- Languages they speak
- CV (PDF or Word, 5 MB at most)
- Links to their projects, GitHub or portfolio
- LinkedIn (optional)
- **"Tell us about something you built on top of an LLM. What went wrong, and how did you fix it?"** This replaces a cover letter.
- They confirm they live in Zimbabwe and that they've read the privacy notice.

**What happens automatically:**
- The candidate gets an email with the coding task and how to submit it.
- We get an email at the careers inbox with all their answers and the CV attached. Replying to it goes straight to the candidate.
- If the coding task email failed to send, our email says so in red, and we send the task by hand.

We don't ask for references at this stage.

### Step 2: Coding task

**What they build:** a small Python API (`POST /extract`) that takes a farmer's WhatsApp message and returns structured findings from a fixed list of 9 signs (like `cloudy_eye`, `red_urine`, `unable_to_stand`), each with a value (`yes`, `no`, `not_sure`) and the farmer's own words, plus whether to escalate.

**The rules we gave them:**
1. Use an LLM to extract findings, and validate its output so only the 9 sign IDs can come back.
2. Only report signs the message actually mentions. Use `not_sure` when the farmer sounds unsure.
3. Decide escalation in plain code, not with the LLM: escalate when `froth_nose_mouth`, `unable_to_stand` or `cloudy_eye` is `yes` or `not_sure`.
4. Tests that run without a network or API key.
5. A README: how to run it, the decisions they made, how they'd measure whether extraction is accurate, and what they'd do with more time.

They get 5 sample messages, including one with Shona. They should spend 3 to 4 hours and send a public GitHub link within 7 days. AI tools are allowed, and they should say how they used them.

The full email is in `backend/app/email-templates/src/careers_coding_task.mjml`.

**If they don't send it:** one friendly reminder on day 6. After 10 days with no reply, we close their application.

### Step 3: Review

Both of us score each application on its own, then compare. Use the scoring sheet below. Each area is scored 1 to 4:

- **1:** not there, or a worry
- **2:** some of it, but weak
- **3:** solid, what we want
- **4:** stands out

**The application**

| Area | What we look for |
|---|---|
| LLM experience | Have they really built on an LLM? The answer to our question should be specific: what they built, what broke, how they found out, what they changed. |
| Projects | Real things they built and finished. Code we can read. |
| Communication | Is the written answer clear and to the point? |

**The coding task**

| Area | What we look for |
|---|---|
| It works | It runs from the README. The sample messages give sensible results. |
| Escalation in code | The escalation rule is plain code, handles `not_sure`, and has tests. |
| Validating the LLM | They don't trust the model blindly. Unknown sign IDs are rejected or dropped, bad JSON is handled. |
| Tests | Tests run offline with the LLM mocked, and test the things that matter. |
| README thinking | A real idea for measuring accuracy (for example, a labelled set of messages and checking results against it). Honest about trade-offs and what's missing. |
| Code quality | Easy to read, sensible structure, no over-engineering. |
| AI use | Says how they used AI tools. The code shows they understood and checked what the AI wrote. |

**Red flags:** the LLM decides escalation; no tests, or tests that need an API key; an API key committed to the repo; a README copied from an AI with nothing specific to their code; a task that doesn't run.

**Moving on to interview:** no 1s in "It works", "Escalation in code" or "Validating the LLM", and an average of 3 or more across the task. Both of us agree.

**After review:** send the interview invite or the "not this time" email (templates in section 10) within 5 working days.

### Step 4: Interview (75 minutes)

Both of us join a video call. One person leads each part, the other takes notes. Tell the candidate in the invite that they can use AI tools in the live coding, and to have their coding task repo ready to share.

| Time | Part | Lead |
|---|---|---|
| 0 to 5 min | Welcome, who we are, what V-Vet does, how the call will go | Founder A |
| 5 to 20 min | Walk through their coding task | Founder B |
| 20 to 45 min | Live coding, AI allowed (Appendix B) | Founder A |
| 45 to 70 min | Behavioural questions | Founder B |
| 70 to 75 min | Their questions, next steps | Both |

#### Part 1: Coding task walkthrough (15 minutes)

Ask them to share their screen and walk us through the repo. Then ask:

1. "Walk us through what happens when a message comes in, from the request to the response."
2. "Why did you decide escalation the way you did?"
3. "What happens if the model returns a sign that isn't on the list, or returns broken JSON?"
4. "How would you know if the extraction got worse after you changed the prompt?"
5. "Which part did you use AI for, and was there anything it got wrong?"
6. "If a farmer writes half in Shona and half in English, what breaks?"

**Good answers:** they know their own code well, explain trade-offs, admit what's weak. **Worrying:** they can't explain parts of their own code.

#### Part 2: Live coding (25 minutes)

The full exercise, with starter code, is in Appendix B. In short:

- **Part A (10 minutes):** fix two bugs in a small escalation function so the failing tests pass.
- **Part B (10 minutes):** add a new rule from our vet's document and write a test for it.
- **Part C (5 minutes, talk only):** how would they let a vet change these rules without a developer?

They can use any AI tool. We're watching how they work, not whether they type fast: do they read the code before changing it, do they run the tests, do they check what the AI gives them, do they talk us through their thinking.

#### Part 3: Behavioural questions (25 minutes)

Ask these in order, and use the follow-ups if the answer is vague. Aim for about 3 minutes each. Ask for real examples, not "what would you do".

1. **"Tell us about something you built that real people used. What did you learn from watching them use it?"**
   *Looking for:* they've shipped to real users and changed things based on what they saw.
   *Follow-up:* "What would you do differently now?"

2. **"Tell us about a time you were stuck on a problem for a long time with no one to ask. What did you do?"**
   *Looking for:* a sensible way of getting unstuck (breaking it down, reading the docs, testing small pieces), and knowing when to ask.
   *Worry:* gave up, or waited for someone to tell them.

3. **"Tell us about a mistake you made that reached users. What happened, and what did you change afterwards?"**
   *Looking for:* honesty, owning it, a concrete change (a test, a check, a habit).
   *Worry:* "I don't really make mistakes", or blaming others.

4. **"Say a vet tells you our WhatsApp bot gave a farmer bad advice about a sick cow. What do you do in the first hour?"**
   *Looking for:* safety first (stop the harm, tell the founders and the vet), then find out what happened from the logs, then fix and add a test.
   *Worry:* jumps straight to changing the prompt without understanding what went wrong.

5. **"Tell us about a time you disagreed with someone about how to build something. How did it end?"**
   *Looking for:* explains their view clearly, listens, can disagree and still commit.

6. **"How do you check that code an AI assistant wrote is actually right? Give us an example where it got something wrong."**
   *Looking for:* reads it, runs it, tests it, and has a real example.
   *Worry:* trusts it without checking.

7. **"You'd be working remotely with the two of us. How do you like to keep people updated, and what do you need from us to do your best work?"**
   *Looking for:* clear habits (short written updates, raising problems early) and realistic needs.

8. **"Why V-Vet, and why this problem?"**
   *Looking for:* a real reason. Connection to farming, Zimbabwe or the people we serve is a plus, not a must.

9. **For Shona or Ndebele speakers: "How would a farmer near you describe a cow that won't eat and is breathing fast, in their own words?"**
   *Looking for:* how real farmers talk. This helps the product and shows how they'd help with language.

#### Part 4: Their questions (5 minutes)

Let them ask anything. Then tell them what happens next and when they'll hear from us (within 3 working days).

#### Interview scoring

Each of us fills this in straight after the call, before we talk to each other:

| Area | Score 1 to 4 | Notes |
|---|---|---|
| Knows their coding task | | |
| Live coding: reads and understands code | | |
| Live coding: tests and checks AI output | | |
| Judgement and safety (question 4) | | |
| Owning mistakes (question 3) | | |
| Working independently (question 2) | | |
| Communication | | |
| Motivation and fit | | |

### Step 5: Decision and offer

**We hire if:** both of us say yes, there are no 1s, and "Judgement and safety" and "Live coding" are 3 or more. If we're unsure, it's a no.

**Then:**
1. Ask for 2 references and call at least one. Ask: what they worked on together, how they handled problems, and whether they'd work with them again.
2. Send the offer by email with: the contract, the monthly rate, the start date, the probation goals (section 6), and how we'll pay.
3. When they accept, send the "not this time" email to the other interviewed candidates.

### Step 6: Probation (1 month)

See section 6.

---

## 6. Probation plan (4 weeks)

The goal is for both sides to find out, on real work, whether this works.

**Every week:** a 30-minute check-in call with both founders. **Every working day:** a short written update (what I did, what I'm doing next, anything blocking me).

| Week | Focus | Done when |
|---|---|---|
| 1 | Get set up and learn the codebase | Runs the backend and frontend locally. Has read the triage engine proposal (`docs/triage-engine-proposal.md`). Has merged 1 or 2 small fixes, for example the existing lint errors in the backend and the type error in `frontend/src/lib/services/s3.service.ts`. Has tested the WhatsApp bot end to end on a test number. |
| 2 and 3 | Build the findings extraction tool (Phase 1 of the triage engine proposal) | A `record_findings` tool the WhatsApp agent can call, that only accepts sign IDs from the vet's signs dictionary. Findings stored in their own table with the farmer's own words. Tests, including the vet's example cases once we have them. Reviewed and merged. |
| 4 | Finish, demo and hand over | Shows it working to both founders and, if possible, one of our vets. Writes short notes on what was built and what's next. |

**End of probation review** (both founders, at the end of week 4). We look at:

- Did they ship working, tested code?
- How was their code to review, and how did they take feedback?
- Did they communicate clearly and raise problems early?
- Were they reliable?

**Outcomes:** offer the full-time role, extend probation by up to a month with clear goals, or end the contract. We tell them which and why in a call, then confirm by email.

---

## 7. Timeline (example)

| When | What |
|---|---|
| Week 0 | Decisions in section 1 made, launch checklist done, flyer shared |
| Weeks 1 to 3 | Applications come in. We review each Friday. |
| Weeks 2 to 4 | Interviews |
| Week 4 or 5 | Offer sent, references checked |
| Week 6 | New engineer starts probation |
| Week 10 | End of probation review |

---

## 8. Where to share the flyer

- LinkedIn: both founders' profiles, and a V-Vet page if we have one.
- WhatsApp: status, and Zimbabwean tech groups we're in.
- University computer science departments and student groups (for example the University of Zimbabwe and NUST), aimed at recent graduates with strong projects.
- Zimbabwean developer communities and meetups.

Use the link https://vvet.org/careers/software-engineer when posting text. The preview card shows automatically.

---

## 9. Pay

**Decide** before launch. We haven't put pay on the post, but candidates will ask in the interview, so we need an answer.

How to decide:
1. Ask a few people in the Zimbabwean tech scene what junior to mid-level remote developers earn on contract.
2. Look at what remote roles open to Zimbabwean developers are offering.
3. Agree a monthly range in USD, and where in the range we'd go for someone who stands out.
4. Agree how we'll pay (bank transfer or mobile money) and who handles it.

Recommended: pay probation at the full rate. It's fairer, and it makes it easier to attract good people.

---

## 10. Email templates

**Interview invite**

> Hi [Name],
>
> Thank you for your application and your coding task for the Software Engineer role at V-Vet. We enjoyed reading it and we'd like to invite you to an interview.
>
> It's a 75-minute video call with both of us. We'll go through your coding task together, do some live coding (you can use any AI tools you normally use), and talk about how you work. Please have your coding task repo ready to share on screen.
>
> Could you let us know which of these times work for you? [times]
>
> Best,
> [Founder names], V-Vet

**Not this time (after review)**

> Hi [Name],
>
> Thank you for applying to V-Vet and for the time you put into the coding task. We've decided not to move forward with your application this time.
>
> [One specific, kind piece of feedback, for example: "We were looking for the escalation rule to be handled in code rather than by the model."]
>
> We'd be glad to hear from you for future roles.
>
> Best,
> [Founder names], V-Vet

**Not this time (after interview)**

> Hi [Name],
>
> Thank you for interviewing with us. We really appreciated your time. We've decided to go with another candidate for this role.
>
> [One or two specific strengths we saw, and one thing to work on.]
>
> If it's all right with you, we'd like to keep your details for future roles. Our privacy notice says we delete applications 6 months after a decision, so just reply if you'd like us to keep yours longer.
>
> Best,
> [Founder names], V-Vet

**Offer (outline)**

> Hi [Name],
>
> We'd love you to join V-Vet as a Software Engineer.
>
> - Contract, remote within Zimbabwe
> - [Monthly rate] USD a month, paid [how and when]
> - Start date: [date]
> - A one-month probation. In it you'll [summary of section 6], with a weekly check-in with both of us.
>
> The contract is attached. Let us know if you have any questions.
>
> Best,
> [Founder names], V-Vet

---

## Appendix A: Coding task review notes

When you open their repo, in this order:

1. Read the README first. Can you run it in under 5 minutes?
2. Run the tests. Do they pass offline?
3. Find where escalation is decided. Is it plain code? Does `not_sure` escalate for red flags?
4. Find where the LLM output is parsed. What happens with an unknown sign or bad JSON?
5. Try the 5 sample messages, if you can run it with a key.
6. Read their notes on measuring accuracy and AI use.

Write 2 or 3 lines of notes per area, so we can compare and give feedback.

---

## Appendix B: Live coding exercise

Share this as a small repo or a gist just before the call. It takes a few minutes to set up with `pip install pytest`.

**`escalation.py`**

```python
RED_FLAGS = {"froth_nose_mouth", "unable_to_stand", "cloudy_eye"}


def decide_escalation(findings: list[dict]) -> dict:
    """Decide whether a case goes to a vet.

    Each finding looks like {"sign_id": "cloudy_eye", "value": "yes"},
    where value is "yes", "no" or "not_sure".
    """
    for finding in findings:
        if finding["sign_id"] in RED_FLAGS and finding["value"] == "yes":
            return {"escalate": True, "reason": f"{finding['sign_id']} reported"}
    return {"escalate": False, "reason": "No red flags"}
```

**`test_escalation.py`**

```python
from escalation import decide_escalation


def test_red_flag_escalates():
    assert decide_escalation([{"sign_id": "cloudy_eye", "value": "yes"}])["escalate"]


def test_no_red_flags_does_not_escalate():
    assert not decide_escalation([{"sign_id": "ticks", "value": "yes"}])["escalate"]


def test_not_sure_on_a_red_flag_escalates():
    # Our vet's rule: if the farmer isn't sure about a serious sign, escalate to be safe.
    assert decide_escalation([{"sign_id": "unable_to_stand", "value": "not_sure"}])["escalate"]


def test_sign_ids_from_the_model_may_have_different_case():
    assert decide_escalation([{"sign_id": "Froth_Nose_Mouth", "value": "Yes"}])["escalate"]
```

**Part A (10 minutes): fix the bugs.** Two tests fail. Ask them to make all four pass.
*What we're watching:* do they run the tests first, read the failures, and make a small, clean fix (normalising case, treating `not_sure` as escalate for red flags)?

**Part B (10 minutes): add a rule.** Read them this rule from our vet's document:

> "Lumps below the ear or in front of the shoulder, together with a fever, means escalate to a vet within 12 hours. If the farmer isn't sure about either, escalate anyway."

Ask them to add it, with tests, and to return a `timeframe` in the result: `"immediately"` for red flags, `"within 12 hours"` for this new rule. The signs are `swelling` and `fever`.
*What we're watching:* do they ask clarifying questions (what if swelling is yes and fever is no?), write tests for the edge cases, and keep red flags taking priority?

**Part C (5 minutes, talk only):** "Our vets will keep adding and changing rules like these. How would you let a vet change them without a developer editing Python?"
*Good answers:* rules stored as data (a file or table) that code reads, versioned, with a vet approving changes and tests run against past cases. This is close to what we're planning in the triage engine proposal.

---

## Open questions for us both

- Pay range and how we pay.
- Start date.
- Who leads which part of the interview.
- Do we want a third person (for example one of our vets) to meet the final candidate?
- Lawyer review of the contract and the privacy notice.
