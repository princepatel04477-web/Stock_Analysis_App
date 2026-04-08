# NiftyPulse - Stock Analysis App with Multimodal AI

A comprehensive Next.js + FastAPI stock analysis application with advanced ML predictions, price alerts, portfolio tracking, and **multimodal AI support** (Llama, Mistral, Gemma, Qwen).

## ✨ Features

- 📊 **Real-time Stock Analysis** - Market data, technical indicators, chart patterns
- 🤖 **ML Predictions** - SVM-based + **LLM-powered** stock signals
- 🧪 **Model Comparison Pipeline** - Logistic Regression vs Random Forest with full evaluation metrics + plots
- 🔔 **Price Alerts** - Get notified when stocks hit target prices
- 💼 **Portfolio Tracking** - Track trades with P&L calculations
- 🎨 **Interactive Charts** - Candlestick charts with technical overlays
- 🧠 **Multimodal AI** - Text and vision-based analysis with multiple LLM models
- 📈 **Market Dashboard** - Indices, gainers, losers, sector heatmaps

## 🆕 Multimodal AI Support

This app now supports multiple AI models via **Groq Cloud API** for enhanced stock analysis:

- **Llama** (Meta): 3.1 (8B, 70B), 3.2 (1B, 3B, Vision), 3.3 (70B)
- **Mistral** (Mistral AI): Mixtral 8x7B
- **Gemma** (Google): 7B, 9B
- **Qwen** (Alibaba): 2.5 (7B, 32B, 72B)

**Capabilities:**
- Text-based stock analysis with advanced LLMs via Groq Cloud
- Vision-based chart pattern recognition (Llama Vision models)
- Ensemble predictions (SVM + LLM combined)
- Ultra-fast inference (< 1 second response time)

👉 **[Quick Start Guide →](./QUICKSTART_MULTIMODAL.md)**
👉 **[Full Multimodal Guide →](./MULTIMODAL_GUIDE.md)**

## Quick Checklist
- [ ] Install Python 3.13 and Node.js LTS
- [ ] Install backend dependencies in a virtual environment
- [ ] Install frontend dependencies with npm
- [ ] Get Groq API key from https://console.groq.com/
- [ ] Start backend in one terminal
- [ ] Start frontend in a second terminal

## 1) Install Dependencies

```powershell
cd C:\Users\Om\Documents\CODES\Stock_Analysis_App-copilot-add-price-alerts-feature

py -3.13 -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r backend\requirements.txt

npm install
```

## 2) Setup Groq API Key

Get your free API key from [Groq Console](https://console.groq.com/):

```bash
# Create .env file
echo "GROQ_API_KEY=your-groq-api-key-here" > .env
```

Or set environment variable:
```powershell
# Windows PowerShell
$env:GROQ_API_KEY="your-groq-api-key-here"
```

## 3) Start Backend (Terminal 1)

```powershell
cd C:\Users\Om\Documents\CODES\Stock_Analysis_App-copilot-add-price-alerts-feature
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000
```

## 4) Start Frontend (Terminal 2)

```powershell
cd C:\Users\Om\Documents\CODES\Stock_Analysis_App-copilot-add-price-alerts-feature
npm run dev
```

## 5) Open the App

- Frontend: http://localhost:5000
- Backend health: http://localhost:8000/health
- API docs: http://localhost:8000/docs

## Optional: Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# Required for database features
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Required for multimodal AI (Groq Cloud)
GROQ_API_KEY=your_groq_key

# Optional AI providers
PERPLEXITY_API_KEY=your_perplexity_key  # For news enrichment

# Model configuration (optional, uses defaults if not set)
DEFAULT_LLM_MODEL=llama-3.1-8b
DEFAULT_VISION_MODEL=llama-3.2-11b-vision
```

## API Endpoints

### Core Stock Analysis
- `GET /api/analyze/{symbol}` - Full stock analysis
- `GET /api/predict/{symbol}` - ML prediction (enhanced with model selection)
- `GET /api/ml/model-comparison/{symbol}` - Baseline vs advanced model benchmarking (confusion matrix, accuracy, precision, recall, F1, ROC, CV)
- `GET /api/history/{symbol}` - Signal history

### Multimodal AI (New!)
- `GET /api/multimodal/models` - List available LLM models
- `POST /api/multimodal/analyze` - Analyze with specific LLM
- `POST /api/multimodal/analyze-chart` - Vision-based chart analysis
- `GET /api/multimodal/ensemble/{symbol}` - Combined SVM + LLM prediction

### Market Data
- `GET /api/market/ticker` - Ticker bar data
- `GET /api/market/summary` - Market overview
- `GET /api/market/indices` - Index data with breadth

### Alerts & Portfolio
- `POST /api/alerts/create` - Create price alert
- `GET /api/alerts/{user_id}` - Get user alerts
- `POST /api/portfolio/buy` - Record buy trade
- `GET /api/portfolio/{user_id}` - Get portfolio

## If PowerShell blocks activation

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts

**Backend:**
- FastAPI
- scikit-learn (SVM ML)
- Ollama / Groq (LLM inference)
- yfinance (market data)
- Supabase (database)

**AI/ML:**
- Traditional: SVM + VADER sentiment + LIME explanations
- Modern: Llama, Mistral, Gemma, Qwen via Ollama/Groq
- Vision: Chart pattern recognition with vision models

## Project Structure

```
├── app/                    # Next.js frontend
│   ├── page.tsx           # Main analysis page
│   ├── alerts/            # Price alerts UI
│   ├── portfolio/         # Portfolio tracking UI
│   └── lib/api.ts         # API client with multimodal types
├── backend/               # FastAPI backend
│   ├── server.py          # API routes + multimodal endpoints
│   ├── ml_service.py      # Traditional SVM ML
│   ├── model_comparison_service.py # Two-model training/evaluation/plots pipeline
│   ├── multimodal_service.py  # LLM + vision models (NEW!)
│   ├── price_service.py   # Market data + indicators
│   └── database.py        # Supabase integration
└── MULTIMODAL_GUIDE.md   # Detailed AI setup guide
```

## Contributing

See [MULTIMODAL_GUIDE.md](./MULTIMODAL_GUIDE.md) for information on adding new models or extending AI capabilities.

## Model Comparison Integration Guide

Use the endpoint below to run a complete stock-direction model comparison pipeline:

```http
GET /api/ml/model-comparison/{symbol}?save_models=false
```

Response includes:
- Two-model comparison (`Logistic Regression` baseline + `Random Forest` advanced)
- Confusion matrix, accuracy, precision, recall, F1 score
- Cross-validation summary
- Base64-encoded plots for confusion matrices, metric comparison bar chart, and ROC curve

Frontend integration point:
- `app/lib/api.ts` → `fetchModelComparison(symbol, saveModels?)`
- Returned type: `ModelComparisonResponse`

## License

MIT License - see LICENSE file for details.

