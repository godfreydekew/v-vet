from fastapi import APIRouter, Header, HTTPException, status

from app.api.deps import SessionDep
from app.core.config import settings
from app.cron import CRON_JOB_REGISTRY

router = APIRouter(prefix="/cron", tags=["cron"])


@router.post("/{job_name}")
def run_cron_job(
    job_name: str,
    session: SessionDep,
    x_cron_secret: str | None = Header(default=None),
) -> dict:
    if not settings.CRON_SECRET or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Cron-Secret header",
        )

    job = CRON_JOB_REGISTRY.get(job_name)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown cron job: {job_name}")

    result = job.run(session=session)
    return {"status": "ok", "job": job_name, "result": result}
