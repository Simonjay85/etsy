from fastapi import APIRouter
router = APIRouter()

@router.get("/{job_id}")
async def get_job_status(job_id: str):
    return {"job_id": job_id, "status": "complete", "progress": 100}
