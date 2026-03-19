# CV Studio — Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | https://python.org |
| Node.js | 20+ | https://nodejs.org |
| Docker  | 24+ | https://docker.com (optional but recommended) |
| LibreOffice | 7+ | `apt install libreoffice` / `brew install libreoffice` |

---

## Option A: Docker (recommended, easiest)

```bash
# 1. Clone and enter
git clone <your-repo> cvstudio && cd cvstudio

# 2. Create env file
cp backend/.env.example backend/.env
# Edit backend/.env — add ANTHROPIC_API_KEY at minimum

# 3. Start everything
docker-compose up

# → Frontend:  http://localhost:5173
# → API docs:  http://localhost:8000/docs
# → Celery:    http://localhost:5555  (Flower)
```

---

## Option B: Manual setup

### Backend

```bash
cd backend

# Virtual env
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install deps
pip install -r requirements.txt

# Config
cp .env.example .env
nano .env                         # add ANTHROPIC_API_KEY

# Run database migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.workers.tasks worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local        # set VITE_API_URL=http://localhost:8000
npm run dev
# → http://localhost:5173
```

---

## Minimum config to get started

Edit `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...   # required for AI features
DATABASE_URL=postgresql+asyncpg://cvstudio:cvstudio@localhost:5432/cvstudio
REDIS_URL=redis://localhost:6379/0
STORAGE_PATH=./storage
```

**Without** Etsy API key: all generation, AI listing, and keyword features work.
**Without** Claude API key: generation works, AI features show "API key needed".

---

## Feature checklist

| Feature | Requires |
|---------|---------|
| Upload .docx → color variants | Backend running |
| Generate thumbnails (PNG) | Backend + LibreOffice |
| AI listing (title/desc/tags) | Claude API key |
| AI keyword analysis | Claude API key |
| Etsy OAuth connect | Etsy API key + ETSY_REDIRECT_URI |
| Publish listing to Etsy | Etsy OAuth token |
| R2 cloud storage | Cloudflare account |

---

## Deploy to production

### Backend → Railway

```bash
# Install Railway CLI
npm i -g @railway/cli
railway login

# From project root
railway init
railway up

# Set env vars in Railway dashboard:
# DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY, etc.
```

### Frontend → Netlify

```bash
cd frontend
npm run build

# Via Netlify CLI:
npx netlify deploy --prod --dir dist

# Set in Netlify env:
# VITE_API_URL = https://your-railway-app.up.railway.app
```

### One-server VPS (cheapest, ~$6/mo)

```bash
# On your VPS (Ubuntu 22.04):
git clone <repo> && cd cvstudio

# Install deps
apt install docker.io docker-compose

# Edit .env for production
cp backend/.env.example backend/.env

# Run
docker-compose -f docker-compose.yml up -d
```

---

## Running tests

```bash
cd backend

# Unit tests only (no DB needed)
pytest tests/unit/ -v

# All tests (needs DB + Redis running)
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

---

## Useful commands

```bash
# Re-run migrations after model changes
cd backend && alembic revision --autogenerate -m "add column"
alembic upgrade head

# Watch Celery tasks
celery -A app.workers.tasks flower --port=5555

# Clear all generated output files
rm -rf backend/storage/output/*

# Build frontend for production
cd frontend && npm run build
```
