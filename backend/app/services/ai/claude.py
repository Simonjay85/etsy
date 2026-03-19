"""
Claude AI Service
-----------------
Wraps Anthropic SDK for all AI features:
- Listing generation (title, description, tags)
- Keyword analysis
- SEO scoring
"""
import json
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.schemas.ai import ListingGenResponse, KeywordAnalysisResponse, SEOScoreResponse
from loguru import logger


SYSTEM_PROMPT = """You are an expert Etsy SEO specialist with 5+ years selling digital templates.
You know exactly which keywords rank on Etsy, how to write titles that convert,
and how to craft descriptions that both rank in search and persuade buyers.
Always respond with valid JSON only — no markdown, no preamble."""


class ClaudeService:

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model  = settings.CLAUDE_MODEL

    async def _ask(self, prompt: str, max_tokens: int = 1500) -> dict:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(text)

    async def generate_listing(
        self,
        template_name: str,
        theme_color: str,
        product_type: str = "cv",
        target_industry: str = "general",
        language: str = "en",
    ) -> ListingGenResponse:

        prompt = f"""Generate an Etsy listing for a {product_type} template.

Template: {template_name}
Color: {theme_color}
Target industry: {target_industry}
Language: {language}

Requirements:
- title: exactly ≤140 chars, start with main keyword, include color, "instant download", "A4"
- description: 400-600 chars, use emoji, ━━━ section separators, persuasive tone
- tags: exactly 13 tags, each ≤20 chars, mix high/medium competition keywords
- price_suggestion: float (USD), typical Etsy range $3.99–$8.99

Respond with JSON:
{{
  "title": "...",
  "description": "...",
  "tags": ["tag1", ..., "tag13"],
  "price_suggestion": 4.99,
  "seo_notes": "brief note on keyword strategy"
}}"""

        data = await self._ask(prompt)
        return ListingGenResponse(**data)

    async def analyze_keyword(self, keyword: str, niche: str = "resume template") -> KeywordAnalysisResponse:
        prompt = f"""Analyze this Etsy keyword for the {niche} niche: "{keyword}"

Estimate based on your knowledge of Etsy SEO:
- search_volume: "low" | "medium" | "high"
- competition: integer 0-100 (0=no competition, 100=extremely competitive)
- trend: "rising" | "stable" | "declining"
- long_tail_suggestions: 5 related keywords with less competition
- recommendation: one sentence on whether to target this keyword

JSON response:
{{
  "keyword": "{keyword}",
  "search_volume": "medium",
  "competition": 45,
  "trend": "stable",
  "long_tail_suggestions": ["...", "...", "...", "...", "..."],
  "recommendation": "..."
}}"""

        data = await self._ask(prompt)
        return KeywordAnalysisResponse(**data)

    async def score_listing(self, title: str, tags: list[str], description: str) -> SEOScoreResponse:
        prompt = f"""Score this Etsy listing for SEO quality (0-100).

Title ({len(title)} chars): {title}
Tags ({len(tags)}): {", ".join(tags)}
Description ({len(description)} chars): {description[:300]}...

Evaluate:
- title_score: 0-25 (length, keywords, structure)
- tags_score: 0-25 (count, diversity, relevance)
- description_score: 0-25 (length, keywords, formatting)
- conversion_score: 0-25 (persuasiveness, clarity, call to action)
- issues: list of specific problems found
- improvements: list of specific actionable fixes

JSON:
{{
  "total": 84,
  "title_score": 22,
  "tags_score": 20,
  "description_score": 21,
  "conversion_score": 21,
  "issues": ["..."],
  "improvements": ["..."]
}}"""

        data = await self._ask(prompt)
        return SEOScoreResponse(**data)
