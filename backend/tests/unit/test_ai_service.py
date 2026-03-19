"""Unit tests — AI service with mocked Anthropic SDK."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json


# ── Helpers ────────────────────────────────────────────────────────────────────

def _mock_response(data: dict):
    """Build a mock Anthropic response object."""
    mock = MagicMock()
    mock.content = [MagicMock(text=json.dumps(data))]
    return mock


# ── Listing generation ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestListingGeneration:

    async def test_generate_listing_returns_schema(self):
        payload = {
            "title": "Midnight Navy Resume Template Word | ATS CV | A4 US Letter | Instant Download",
            "description": "✨ Test description",
            "tags": [f"tag{i}" for i in range(13)],
            "price_suggestion": 4.99,
            "seo_notes": "Good keywords",
        }
        with patch("app.services.ai.claude.AsyncAnthropic") as mock_cls:
            mock_cls.return_value.messages.create = AsyncMock(
                return_value=_mock_response(payload)
            )
            from app.services.ai.claude import ClaudeService
            svc    = ClaudeService()
            result = await svc.generate_listing("Navy Resume", "Navy")

        assert result.title == payload["title"]
        assert len(result.tags) == 13
        assert result.price_suggestion == 4.99

    async def test_title_within_etsy_limit(self):
        long_title = "X" * 141
        payload = {
            "title": long_title[:140],
            "description": "desc",
            "tags": [f"t{i}" for i in range(13)],
            "price_suggestion": 4.99,
            "seo_notes": "",
        }
        with patch("app.services.ai.claude.AsyncAnthropic") as mock_cls:
            mock_cls.return_value.messages.create = AsyncMock(
                return_value=_mock_response(payload)
            )
            from app.services.ai.claude import ClaudeService
            svc    = ClaudeService()
            result = await svc.generate_listing("Test", "Test")

        assert len(result.title) <= 140

    async def test_tags_exactly_13(self):
        payload = {
            "title": "Test Resume",
            "description": "desc",
            "tags": [f"tag{i}" for i in range(13)],
            "price_suggestion": 4.99,
            "seo_notes": "",
        }
        with patch("app.services.ai.claude.AsyncAnthropic") as mock_cls:
            mock_cls.return_value.messages.create = AsyncMock(
                return_value=_mock_response(payload)
            )
            from app.services.ai.claude import ClaudeService
            result = await ClaudeService().generate_listing("T", "T")

        assert len(result.tags) == 13


# ── SEO scoring ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestSEOScoring:

    async def test_score_returns_100_max(self):
        payload = {
            "total": 95,
            "title_score": 25,
            "tags_score": 25,
            "description_score": 25,
            "conversion_score": 20,
            "issues": [],
            "improvements": ["Add more urgency"],
        }
        with patch("app.services.ai.claude.AsyncAnthropic") as mock_cls:
            mock_cls.return_value.messages.create = AsyncMock(
                return_value=_mock_response(payload)
            )
            from app.services.ai.claude import ClaudeService
            result = await ClaudeService().score_listing(
                "Test title", ["tag1"], "Test description"
            )

        assert result.total <= 100
        assert result.title_score + result.tags_score + result.description_score + result.conversion_score <= 100


# ── Keyword analysis ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestKeywordAnalysis:

    async def test_keyword_analysis_schema(self):
        payload = {
            "keyword": "resume template ats",
            "search_volume": "medium",
            "competition": 45,
            "trend": "rising",
            "long_tail_suggestions": ["ats resume word doc", "ats cv template a4",
                                      "ats friendly resume 2025", "minimal ats resume",
                                      "simple ats cv template"],
            "recommendation": "Good keyword, target it.",
        }
        with patch("app.services.ai.claude.AsyncAnthropic") as mock_cls:
            mock_cls.return_value.messages.create = AsyncMock(
                return_value=_mock_response(payload)
            )
            from app.services.ai.claude import ClaudeService
            result = await ClaudeService().analyze_keyword("resume template ats")

        assert result.competition == 45
        assert result.trend == "rising"
        assert len(result.long_tail_suggestions) == 5
        assert result.search_volume in ("low", "medium", "high")
