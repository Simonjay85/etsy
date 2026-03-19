from fastapi import APIRouter
from app.api.v1.endpoints import (
    ai, listings, keywords, etsy, templates,
    planner, generate, image, jobs
)

api_router = APIRouter()
api_router.include_router(ai.router,        prefix="/ai",        tags=["ai"])
api_router.include_router(listings.router,  prefix="/listings",  tags=["listings"])
api_router.include_router(keywords.router,  prefix="/keywords",  tags=["keywords"])
api_router.include_router(etsy.router,      prefix="/etsy",      tags=["etsy"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(planner.router,   prefix="/planner",   tags=["planner"])
api_router.include_router(generate.router,  prefix="/generate",  tags=["generate"])
api_router.include_router(image.router,     prefix="/image",     tags=["image"])
api_router.include_router(jobs.router,      prefix="/jobs",      tags=["jobs"])
