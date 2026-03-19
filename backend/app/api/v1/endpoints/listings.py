from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def list_listings():
    return {"listings": []}

@router.post("/")
async def create_listing(listing: dict):
    return {"created": True}
