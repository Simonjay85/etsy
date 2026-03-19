from pydantic import BaseModel, Field
from typing import Literal, Optional


# ── Generate ──────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    template_id: str
    themes: list[str] = Field(default_factory=lambda: ["midnight_navy", "forest_green"])
    fonts: list[str]  = Field(default_factory=lambda: ["Calibri"])
    pages: list[str]  = Field(default_factory=lambda: ["A4", "USLetter"])
    product_type: Literal["cv", "planner", "cover_letter"] = "cv"
    include_cover_letter: bool = False

class GenerateResponse(BaseModel):
    job_id: str
    status: str
    total: int


# ── Jobs ──────────────────────────────────────────────────────────────────────
class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int = 0
    message: str = ""
    download_url: Optional[str] = None


# ── AI / Listings ─────────────────────────────────────────────────────────────
class ListingGenRequest(BaseModel):
    template_name: str
    theme_color: str = "Midnight Navy"
    product_type: Literal["cv", "planner", "cover_letter"] = "cv"
    target_industry: str = "general"
    language: Literal["en", "vi"] = "en"

class ListingGenResponse(BaseModel):
    title: str
    description: str
    tags: list[str]
    price_suggestion: float = 4.99
    seo_notes: str = ""

class KeywordAnalysisRequest(BaseModel):
    keyword: str
    niche: str = "resume template"

class KeywordAnalysisResponse(BaseModel):
    keyword: str
    search_volume: Literal["low", "medium", "high"]
    competition: int
    trend: Literal["rising", "stable", "declining"]
    long_tail_suggestions: list[str]
    recommendation: str

class SEOScoreRequest(BaseModel):
    title: str
    tags: list[str]
    description: str

class SEOScoreResponse(BaseModel):
    total: int
    title_score: int
    tags_score: int
    description_score: int
    conversion_score: int
    issues: list[str]
    improvements: list[str]


# ── Image ─────────────────────────────────────────────────────────────────────
class ThumbnailRequest(BaseModel):
    job_id: str
    preview_pngs: list[str]
    title: str
    style: Literal["single", "grid", "mockup"] = "mockup"
    dark: bool = True

class ThumbnailResponse(BaseModel):
    path: str
    url: str
