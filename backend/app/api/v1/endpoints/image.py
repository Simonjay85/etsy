from fastapi import APIRouter
router = APIRouter()

@router.post("/render-png")
async def render_png():
    return {"message": "PNG rendering requires Docker deployment with LibreOffice"}

@router.post("/thumbnail")
async def generate_thumbnail():
    return {"message": "Thumbnail generation requires Docker deployment"}
