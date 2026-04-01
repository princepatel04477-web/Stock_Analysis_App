# AGENTS.md

## Mission-Critical Orientation
- Active app is **Next.js frontend + FastAPI backend**; treat `app/` and `backend/` as the source of truth.
- Frontend calls relative `/api/*` URLs from `app/lib/api.ts`; Next rewrites to FastAPI via `next.config.js` (`/api/:path* -> http://localhost:8000/api/:path*`).
- Core analysis path: UI (`app/page.tsx`) -> `fetchAnalysis()` (`app/lib/api.ts`) -> `/api/analyze/{symbol}` (`backend/server.py`) -> `backend/price_service.py` + optional Perplexity/Groq enrichment.
- Alerts and portfolio are server-backed features: `app/alerts/page.tsx` and `app/portfolio/page.tsx` call `/api/alerts/*` and `/api/portfolio/*` in `backend/server.py`.

## Service Boundaries and Data Flow
- `backend/server.py` is the API composition layer (routing, caching, orchestration, fallback logic).
- `backend/price_service.py` owns market/indicator/pattern computations (RSI/SMA/MACD/Bollinger + candle pattern and support/resistance detection).
- `backend/ml_service.py` owns ML signal prediction (SVM + VADER + LIME) for `/api/predict/{symbol}`.
- `backend/database.py` is the only backend DB abstraction; it uses Supabase and falls back to `ALL_EQUITY_FINAL.csv` for stock list only.
- In-memory cache `_cache` in `backend/server.py` is used for market widgets (`/api/market/*`) with TTLs from 120s to 600s.

## Working Conventions in This Repo
- Frontend pages are client components with local state and inline style-heavy UI (`"use client"`; see `app/alerts/page.tsx`, `app/portfolio/page.tsx`).
- Keep API types centralized in `app/lib/api.ts`; extend interfaces there before wiring new UI fields.
- Backend returns graceful fallbacks instead of hard failures when AI providers are unavailable (e.g., `generate_simple_analysis` in `backend/server.py`).
- User identity for alerts/portfolio is local-storage based (`niftypulse_user_id`), not auth-session based on frontend.
- Preserve `.NS` ticker normalization behavior in backend services unless endpoint explicitly handles index symbols (e.g., `^NSEI` in market summary/indices).

## Dev Workflows (Windows PowerShell)
- Install backend deps from `backend/requirements.txt` and frontend deps from `package.json`.
- Run backend:
  - `python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000`
- Run frontend:
  - `npm run dev` (serves Next on port `5000`).
- Health check:
  - `http://localhost:8000/health`

## Testing Patterns You Should Follow
- Backend tests use `unittest` + `fastapi.testclient` + heavy mocking of external systems (see `backend/test_alerts_endpoints.py`, `backend/test_portfolio_endpoints.py`).
- Prefer fake Supabase query/client objects in tests over live DB access.
- Run backend tests with:
  - `python -m unittest discover -s backend -p "test_*.py"`

## Integrations and Environment Variables
- Required for DB-backed features: `SUPABASE_URL`, `SUPABASE_KEY`.
- Optional AI enrichments: `GROQ_API_KEY`, `PERPLEXITY_API_KEY`.
- External dependencies with runtime/network impact: `yfinance`, Supabase, Groq API, Perplexity API, NLTK VADER download in `backend/ml_service.py`.

## Legacy/Do-Not-Extend Areas
- Root-level Streamlit-era files (`app.py`, root `requirements.txt`, `pyproject.toml`, `repository.py`) are legacy/conflicting with current Next+FastAPI runtime.
- For new features, do not add logic there; implement in `app/` + `backend/` unless explicitly asked otherwise.

