from app.cron.base import CronJob
from app.cron.outcome_followup import OutcomeFollowUpJob
from app.cron.sickness_followup import SicknessFollowupJob

# Registry — maps job name (used in POST /cron/{name}) to job instance.
# Adding a new scheduled job means: write a CronJob subclass, add one line here.
CRON_JOB_REGISTRY: dict[str, CronJob] = {
    SicknessFollowupJob.name: SicknessFollowupJob(),
    OutcomeFollowUpJob.name: OutcomeFollowUpJob(),
}
