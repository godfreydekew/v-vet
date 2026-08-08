from abc import ABC, abstractmethod

from sqlmodel import Session


class CronJob(ABC):
    """A named, scheduled job triggered via POST /api/v1/cron/{name}."""

    name: str

    @abstractmethod
    def run(self, *, session: Session) -> dict:
        """Executes the job once. Returns a small JSON-serializable summary."""
        ...
