# CV Studio — Full-Stack Etsy Template Manager

AI-powered platform to generate, manage, and publish CV/digital planner templates on Etsy.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Python 3.11 + FastAPI + Celery + Redis |
| Image | LibreOffice + Pillow (DOCX → PNG → Etsy thumbnail) |
| DOCX | python-docx (generation + color swap) |
| AI | Claude API (title, description, tags, SEO scoring) |
| Database | PostgreSQL + SQLAlchemy (via Supabase) |
| Storage | Cloudflare R2 (S3-compatible, free tier) |
| Deploy | Frontend → Netlify · Backend → Railway |

## Quick Start

```bash
# 1. Clone and setup
git clone <repo>
cd cvstudio

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your keys
uvicorn app.main:app --reload

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local  # set VITE_API_URL
npm run dev
```

Open http://localhost:5173

## Features

- **Upload & Generate** — upload any .docx, auto-detect colors, generate variants across 12 themes × 8 fonts × A4/Letter
- **Digital Planner** — build multi-page planners from scratch with customizable layouts
- **Image Engine** — render DOCX → high-quality PNG → Etsy-spec 2000×2000 thumbnails
- **AI Listings** — Claude auto-writes title, description, 13 tags, SEO score for every variant
- **Keyword Tracker** — track competition and ranking for your Etsy keywords
- **Etsy Sync** — publish listings directly via Etsy API

## Project Structure

```
cvstudio/
├── frontend/          # React + Vite app
├── backend/           # FastAPI + Celery
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── services/  # Business logic
│   │   │   ├── docx/  # python-docx generation
│   │   │   ├── image/ # LibreOffice + Pillow
│   │   │   ├── ai/    # Claude API
│   │   │   └── etsy/  # Etsy API client
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── workers/   # Celery background tasks
│   └── storage/       # Local file cache
├── shared/            # Shared types/constants
└── docs/              # API docs, guides
```
