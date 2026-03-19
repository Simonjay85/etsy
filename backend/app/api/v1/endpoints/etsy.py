from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import os
from app.core.config import settings

router = APIRouter()

@router.get("/status")
async def etsy_status():
    return {"connected": False, "has_token": False,
            "api_key_set": bool(settings.ETSY_API_KEY)}

@router.get("/shop")
async def get_shop():
    return {"message": "Configure ETSY_API_KEY to connect shop"}

class PublishRequest(BaseModel):
    shop_id: str
    title: str
    description: str
    tags: list[str]
    price: float = 4.99

@router.post("/publish")
async def publish_listing(req: PublishRequest):
    if not settings.ETSY_API_KEY:
        raise HTTPException(400, "ETSY_API_KEY not configured")
    return {"status": "draft", "message": "Etsy publish coming soon"}
