from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

class PlannerRequest(BaseModel):
    layout: Literal["weekly","monthly","daily","habit","budget","notes"] = "weekly"
    year: int = 2025
    pages: int = 52
    page_format: Literal["A4","USLetter"] = "A4"
    theme_id: str = "midnight_navy"

@router.post("/generate")
async def generate_planner(req: PlannerRequest):
    return {
        "message": "Planner generation requires Docker deployment with LibreOffice",
        "layout": req.layout,
        "year": req.year,
        "pages": req.pages,
    }
