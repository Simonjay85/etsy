from fastapi import APIRouter, HTTPException
from app.schemas.ai import (
    ListingGenRequest, ListingGenResponse,
    KeywordAnalysisRequest, KeywordAnalysisResponse,
    SEOScoreRequest, SEOScoreResponse,
)
from app.services.ai.claude import ClaudeService

router  = APIRouter()
claude  = ClaudeService()


@router.post("/generate-listing", response_model=ListingGenResponse)
async def generate_listing(req: ListingGenRequest):
    """
    Generate Etsy listing content for a template variant.
    Returns SEO-optimized title (≤140 chars), description, 13 tags.
    """
    return await claude.generate_listing(
        template_name=req.template_name,
        theme_color=req.theme_color,
        product_type=req.product_type,   # "cv" | "planner" | "cover_letter"
        target_industry=req.target_industry,
        language=req.language,           # "en" | "vi"
    )


@router.post("/analyze-keyword", response_model=KeywordAnalysisResponse)
async def analyze_keyword(req: KeywordAnalysisRequest):
    """
    Estimate competition level, search volume, and related long-tail keywords
    for a given Etsy search term.
    """
    return await claude.analyze_keyword(keyword=req.keyword, niche=req.niche)


@router.post("/seo-score", response_model=SEOScoreResponse)
async def score_seo(req: SEOScoreRequest):
    """
    Score an Etsy listing (title + tags + description) for SEO quality.
    Returns score 0–100 and a list of improvement suggestions.
    """
    return await claude.score_listing(
        title=req.title,
        tags=req.tags,
        description=req.description,
    )


@router.post("/bulk-listings")
async def bulk_generate_listings(template_ids: list[str], product_type: str = "cv"):
    """Generate listings for multiple templates at once (background task)."""
    from app.workers.tasks import run_bulk_listing_gen
    from app.workers.tasks import run_bulk_listing_gen
    task = run_bulk_listing_gen.apply_async(
        kwargs={"template_ids": template_ids, "product_type": product_type}
    )
    return {"job_id": task.id, "count": len(template_ids)}


@router.get("/health")
async def ai_health():
    """Quick check that Claude API key is configured."""
    from app.core.config import settings
    has_key = bool(settings.ANTHROPIC_API_KEY)
    if not has_key:
        return {"ok": False, "reason": "ANTHROPIC_API_KEY not set"}
    try:
        svc = claude
        await svc._ask("Reply OK", max_tokens=5)
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "reason": str(e)}
