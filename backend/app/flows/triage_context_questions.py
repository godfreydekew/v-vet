from dataclasses import dataclass


@dataclass(frozen=True)
class QuestionOption:
    id: str
    title: str


@dataclass(frozen=True)
class Question:
    id: str
    prompt: str
    options: list[QuestionOption]
    multi_select: bool = False

    @property
    def uses_list(self) -> bool:
        # WhatsApp quick-reply buttons cap at 3; anything more (or a
        # multi-select "tap each one, then Done" question) needs a list.
        return self.multi_select or len(self.options) > 3


# "Establish basic context" — Step 2 of the triage spec
# (docs/V-VET triage flow and district codes.md). Adding Step 3+ later means
# adding more Question entries here, not new Python classes — see
# app/flows/report_sickness_context.py for the engine that walks this list.
BASIC_CONTEXT_QUESTIONS: list[Question] = [
    Question(
        id="onset_time",
        prompt="When did you first notice that the animal was unwell?",
        options=[
            QuestionOption("today", "Today"),
            QuestionOption("1_2_days", "1-2 days ago"),
            QuestionOption("3_7_days", "3-7 days ago"),
            QuestionOption("more_than_7_days", "More than 7 days ago"),
            QuestionOption("not_sure", "I am not sure"),
        ],
    ),
    Question(
        id="progression",
        prompt="Any change in the animal's condition since you first noticed it was unwell?",
        options=[
            QuestionOption("better", "Better"),
            QuestionOption("worse", "Worse"),
            QuestionOption("same", "About the same"),
        ],
    ),
    Question(
        id="previous_history",
        prompt="Has this animal had a similar problem before?",
        options=[
            QuestionOption("yes", "Yes"),
            QuestionOption("no", "No"),
            QuestionOption("not_sure", "I am not sure"),
        ],
    ),
    Question(
        id="other_affected",
        prompt="Are any other cattle affected?",
        options=[
            QuestionOption("only_this", "No, only this animal"),
            QuestionOption("one_two", "1-2 other animals"),
            QuestionOption("several", "Several animals"),
            QuestionOption("many", "Many animals"),
            QuestionOption("not_sure", "I am not sure"),
        ],
    ),
    Question(
        id="recent_changes",
        prompt="Has anything changed recently? Tap each one that applies, then tap Done.",
        multi_select=True,
        options=[
            QuestionOption("new_animals", "New animals joined the herd"),
            QuestionOption("moved_area", "Moved to a new area"),
            QuestionOption("new_grazing", "New grazing area"),
            QuestionOption("new_feed", "New feed"),
            QuestionOption("new_water", "New water source"),
            QuestionOption("transport", "Recent transport"),
            QuestionOption("vaccination", "Recent vaccination"),
            QuestionOption("dipping", "Recent dipping/tick control"),
            QuestionOption("calving", "Recent calving"),
        ],
    ),
]

_QUESTIONS_BY_ID: dict[str, Question] = {q.id: q for q in BASIC_CONTEXT_QUESTIONS}


def get_question(question_id: str) -> Question | None:
    return _QUESTIONS_BY_ID.get(question_id)


def next_question(question_id: str | None) -> Question | None:
    """The question after `question_id`, or the first question if None."""
    if question_id is None:
        return BASIC_CONTEXT_QUESTIONS[0]
    ids = [q.id for q in BASIC_CONTEXT_QUESTIONS]
    try:
        idx = ids.index(question_id)
    except ValueError:
        return None
    if idx + 1 >= len(BASIC_CONTEXT_QUESTIONS):
        return None
    return BASIC_CONTEXT_QUESTIONS[idx + 1]


# Deterministic mappings from button answers to the values the existing
# triage engine (app/services/triage.py) already understands — the farmer
# picked from a fixed set WE defined, so this is a plain lookup, not the
# free-text parsing the agent is responsible for elsewhere.
ONSET_TO_DURATION_DAYS: dict[str, int | None] = {
    "today": 0,
    "1_2_days": 2,
    "3_7_days": 5,
    "more_than_7_days": 10,
    "not_sure": None,
}

PROGRESSION_TO_TREND: dict[str, str] = {
    "better": "improving",
    "worse": "worsening",
    "same": "stable",
}
