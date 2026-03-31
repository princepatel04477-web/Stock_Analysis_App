# Project111 Run Guide (Windows PowerShell)

## Quick Checklist
- [ ] Install Python 3.13 and Node.js LTS
- [ ] Install backend dependencies in a virtual environment
- [ ] Install frontend dependencies with npm
- [ ] Start backend in one terminal
- [ ] Start frontend in a second terminal

## 1) Install Dependencies

```powershell
cd C:\Users\Om\Downloads\Project111_fff\Project111

py -3.13 -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r backend\requirements.txt

npm install
```

## 2) Start Backend (Terminal 1)

```powershell
cd C:\Users\Om\Downloads\Project111_fff\Project111
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000
```

## 3) Start Frontend (Terminal 2)

```powershell
cd C:\Users\Om\Downloads\Project111_fff\Project111
npm run dev
```

## 4) Open the App

- Frontend: http://localhost:5000
- Backend health: http://localhost:8000/health

## Optional: Environment Variables

Set these if you want Supabase/AI-powered features fully enabled:

```powershell
$env:SUPABASE_URL="your_supabase_url"
$env:SUPABASE_KEY="your_supabase_key"
$env:GROQ_API_KEY="your_groq_key"
$env:PERPLEXITY_API_KEY="your_perplexity_key"
```

## Supabase SQL for Signal Accuracy Tracking

Run this SQL in Supabase to enable model signal tracking and 7-day accuracy metrics:

```sql
create table public.signals_tracking (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  symbol text not null,
  model_id text not null,
  signal text not null,
  price_at_signal numeric not null,
  current_price numeric,
  was_correct boolean,
  return_percent numeric,
  signal_date timestamp with time zone default now(),
  checked_at timestamp with time zone
);
```

## If PowerShell blocks activation

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```
