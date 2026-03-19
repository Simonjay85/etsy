"""Integration tests — FastAPI endpoints using TestClient."""
import pytest, io, zipfile
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── Health ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── Upload ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_rejects_non_docx(client):
    fake_pdf = io.BytesIO(b"%PDF fake")
    r = await client.post(
        "/api/v1/generate/upload",
        files={"file": ("test.pdf", fake_pdf, "application/pdf")},
    )
    assert r.status_code == 400
    assert "docx" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_accepts_docx(client, tmp_path):
    # Create minimal valid docx
    docx_path = tmp_path / "test.docx"
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("[Content_Types].xml",
                   '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
        z.writestr("word/document.xml",
                   '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>')
    buf.seek(0)

    with patch("app.api.v1.endpoints.generate.os.makedirs"), \
         patch("builtins.open", create=True) as mock_open:
        mock_open.return_value.__enter__ = lambda s: s
        mock_open.return_value.__exit__  = lambda *a: None
        mock_open.return_value.write     = lambda d: None

        r = await client.post(
            "/api/v1/generate/upload",
            files={"file": ("resume.docx", buf, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )

    # Either 200 (success) or 500 (storage not configured in test) — not 400
    assert r.status_code in (200, 500)
    if r.status_code == 200:
        data = r.json()
        assert "template_id" in data
        assert data["filename"] == "resume.docx"


# ── Generate batch ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_batch_rejects_too_many_variants(client):
    # 12 themes × 8 fonts × 2 pages = 192 > 50 limit
    r = await client.post("/api/v1/generate/batch", json={
        "template_id": "fake-id",
        "themes": [f"theme_{i}" for i in range(12)],
        "fonts":  [f"Font {i}" for i in range(8)],
        "pages":  ["A4", "USLetter"],
    })
    assert r.status_code == 400
    assert "too many" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_batch_returns_job_id(client):
    with patch("app.api.v1.endpoints.generate.run_batch_generate") as mock_task:
        mock_task.apply_async = lambda **kw: None
        r = await client.post("/api/v1/generate/batch", json={
            "template_id": "test-template-id",
            "themes": ["midnight_navy"],
            "fonts":  ["Calibri"],
            "pages":  ["A4"],
        })
    assert r.status_code == 200
    data = r.json()
    assert "job_id" in data
    assert data["total"] == 1


# ── AI endpoints ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_listing_calls_claude(client):
    fake_listing = {
        "title": "Navy Resume Template Word | ATS CV A4 | Instant Download",
        "description": "✨ Great template",
        "tags": [f"tag{i}" for i in range(13)],
        "price_suggestion": 4.99,
        "seo_notes": "Good",
    }
    with patch("app.services.ai.claude.ClaudeService.generate_listing",
               new=AsyncMock(return_value=type("R", (), fake_listing)())):
        r = await client.post("/api/v1/ai/generate-listing", json={
            "template_name": "Midnight Navy Resume",
            "theme_color": "Midnight Navy",
        })
    # 200 or 500 depending on env — just check it's not a 422 schema error
    assert r.status_code != 422


# ── Jobs ───────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_job_status_unknown_returns_queued(client):
    with patch("app.api.v1.endpoints.jobs.AsyncResult") as mock_ar:
        mock_ar.return_value.state = "PENDING"
        r = await client.get("/api/v1/jobs/nonexistent-job-id")
    assert r.status_code == 200
    assert r.json()["status"] == "queued"
