from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import uuid, os
from app.core.config import settings

router = APIRouter()

@router.post("/upload")
async def upload_template(file: UploadFile = File(...)):
    if not file.filename.endswith(".docx"):
        raise HTTPException(400, "Only .docx files supported")
    template_id = str(uuid.uuid4())
    dest = os.path.join(settings.STORAGE_PATH, "templates", f"{template_id}.docx")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"template_id": template_id, "filename": file.filename, "size": len(content)}

@router.post("/batch")
async def batch_generate(request: dict):
    return {"job_id": str(uuid.uuid4()), "status": "queued",
            "message": "Batch generation requires Docker deployment"}

@router.get("/download/{job_id}/zip")
async def download_zip(job_id: str):
    raise HTTPException(404, "Not available in cloud deployment")
