# NiftyPulse — NSE Stock Analysis App

## Project Overview

NiftyPulse is a full-stack stock analysis tool for Indian equities (NSE/BSE). It uses:
- **Perplexity AI** for live market data and news sentiment
- **Groq AI (Llama 3)** for trading signal generation
- **Yahoo Finance (yfinance)** for historical price data and charts
- **Supabase** as the database (stock list + analysis cache)

## Architecture

```
NiftyPulse
├── app/                    # Next.js 14 frontend (App Router)
│   ├── page.tsx            # Main dashboard
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Tailwind CSS
│   ├── lib/
│   │   └── api.ts          # API client (calls FastAPI backend)
│   └── components/
│       ├── SearchBar.tsx
│       ├── StockHeader.tsx
│       ├── TechnicalSnapshot.tsx
│       ├── SignalGauge.tsx
│       ├── PriceChart.tsx  (lightweight-charts v4)
│       └── NewsCard.tsx
├── backend/                # FastAPI Python backend
│   ├── server.py           # FastAPI app + API routes
│   ├── database.py         # Supabase client + queries
│   ├── price_service.py    # yfinance market data + chart data
│   ├── utils_groq.py       # Groq AI analysis
│   └── utils_perplexity.py # Perplexity AI data fetching
├── package.json            # Node.js deps (Next.js 14)
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
└── next.config.js          # Next.js config
```

## Workflows

- **Start application** — `npm run dev` on port 5000 (Next.js frontend)
- **Backend API** — `uvicorn backend.server:app --host 0.0.0.0 --port 8000`

## Required Environment Secrets

| Secret Key | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL (e.g. https://xxx.supabase.co) |
| `SUPABASE_KEY` | Supabase anon/publishable key |
| `GROQ_API_KEY` | Groq AI API key (for Llama 3 analysis) |
| `PERPLEXITY_API_KEY` | Perplexity AI API key (for live market data) |

## Key Notes

- The frontend calls the backend using `NEXT_PUBLIC_API_URL` env var
- Without Supabase secrets, the `/api/stocks` endpoint will return 500
- Without Groq/Perplexity keys, the app falls back to simple rule-based analysis
- The app still works without Perplexity/Groq — uses yfinance data + rule-based signals
- Port 8000 maps to external port 80 (backend accessible from the Replit domain)
- Port 5000 maps to external port 5000 (frontend webview)

## Security Notes

- All API keys are read from environment variables — never hardcoded
- CORS is configured to allow requests from the Replit domain
- The backend has proper error handling and doesn't expose internal errors to clients
