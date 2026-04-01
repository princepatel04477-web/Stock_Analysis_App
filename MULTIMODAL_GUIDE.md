# Multimodal ML Support - Guide

## Overview

This project now supports multiple AI models for stock analysis, including:
- **Llama** (Meta): 3.2 (1B, 3B) and 3.3 (70B via Groq)
- **Mistral** (Mistral AI): 7B and Nemo variants
- **Gemma** (Google): 2B and 7B models
- **Qwen** (Alibaba): 2.5 (7B, 14B) and vision models

### Capabilities

1. **Text-based Analysis**: Generate stock insights using advanced LLMs
2. **Vision Analysis**: Analyze candlestick charts for pattern recognition
3. **Ensemble Predictions**: Combine traditional ML (SVM) with LLM predictions

## Setup

### 1. Install Ollama (for local models)

**Windows:**
```powershell
# Download and install from https://ollama.ai/download/windows
winget install Ollama.Ollama
```

**Linux/Mac:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Pull Required Models

```bash
# Text models (pick what fits your hardware)
ollama pull llama3.2:1b          # Lightweight (1.3GB)
ollama pull llama3.2:3b          # Recommended (2GB)
ollama pull mistral:7b           # Powerful (4.1GB)
ollama pull gemma2:2b            # Fast (1.6GB)
ollama pull qwen2.5:7b           # Multilingual (4.7GB)

# Vision models (for chart analysis)
ollama pull llama3.2-vision      # Chart pattern detection (7.9GB)
ollama pull qwen2-vl             # Alternative vision model (4.7GB)
```

### 3. Install Python Dependencies

```bash
pip install -r backend/requirements.txt
```

This includes:
- `ollama` - Ollama Python client
- `openai` - For Groq API access
- `Pillow` - Image processing
- `matplotlib` - Chart generation
- `mplfinance` - Candlestick charts

### 4. Configure Environment

Copy `.env.example` to `.env` and set:

```bash
# For local Ollama (default)
OLLAMA_HOST=http://localhost:11434

# For cloud-based Groq (optional, faster)
GROQ_API_KEY=your-groq-api-key

# Model preferences
DEFAULT_LLM_MODEL=llama-3.2-3b
DEFAULT_VISION_MODEL=llama-3.2-vision
```

## API Endpoints

### 1. List Available Models

```bash
GET /api/multimodal/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "llama-3.2-3b",
      "name": "llama3.2:3b",
      "family": "llama",
      "provider": "ollama",
      "vision": false
    },
    ...
  ],
  "default_text_model": "llama-3.2-3b",
  "default_vision_model": "llama-3.2-vision"
}
```

### 2. Enhanced Prediction with Model Selection

```bash
GET /api/predict/RELIANCE?model=llama-3.2-3b&temperature=0.7
```

**Parameters:**
- `model`: Model ID (default: `svm`)
- `temperature`: 0.0-1.0 (default: 0.7, lower = more deterministic)

**Response:**
```json
{
  "symbol": "RELIANCE",
  "model": "llama-3.2-3b",
  "prediction": {
    "model": "llama-3.2-3b",
    "model_family": "llama",
    "provider": "ollama",
    "signal": "BUY",
    "analysis": "Reliance Industries shows strong technical momentum...",
    "confidence": 0.82
  }
}
```

### 3. Analyze Stock with LLM

```bash
POST /api/multimodal/analyze
Content-Type: application/json

{
  "symbol": "TCS",
  "model": "mistral-7b",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "symbol": "TCS",
  "analysis": {
    "model": "mistral-7b",
    "signal": "BUY",
    "analysis": "TCS exhibits bullish momentum with RSI at 62...",
    "confidence": 0.78
  }
}
```

### 4. Analyze Chart with Vision

```bash
POST /api/multimodal/analyze-chart
Content-Type: application/json

{
  "symbol": "INFY",
  "model": "llama-3.2-vision",
  "temperature": 0.7,
  "period": "3mo"
}
```

**Response:**
```json
{
  "symbol": "INFY",
  "chart_analysis": {
    "model": "llama-3.2-vision",
    "signal": "BUY",
    "patterns": "Clear ascending triangle pattern forming... Support at ₹1450, resistance at ₹1520...",
    "confidence": 0.85
  },
  "data_points": 60
}
```

### 5. Ensemble Prediction (SVM + LLM)

```bash
GET /api/multimodal/ensemble/HDFCBANK?llm_model=qwen-2.5-7b&temperature=0.7
```

**Response:**
```json
{
  "symbol": "HDFCBANK",
  "ensemble": {
    "signal": "BUY",
    "confidence": 0.84
  },
  "svm_prediction": {
    "signal": "BUY",
    "confidence": 0.81,
    ...
  },
  "llm_prediction": {
    "signal": "BUY",
    "confidence": 0.87,
    ...
  },
  "agreement": true
}
```

## Frontend Usage

### TypeScript/React Examples

```typescript
import {
  fetchMultimodalModels,
  fetchPredictionWithModel,
  analyzeStockWithLLM,
  analyzeChartWithVision,
  fetchEnsemblePrediction
} from '@/lib/api';

// List available models
const { models } = await fetchMultimodalModels();

// Get prediction with specific model
const result = await fetchPredictionWithModel('RELIANCE', 'llama-3.2-3b', 0.7);

// Analyze stock with LLM
const llmAnalysis = await analyzeStockWithLLM({
  symbol: 'TCS',
  model: 'mistral-7b',
  temperature: 0.6
});

// Analyze chart with vision
const chartAnalysis = await analyzeChartWithVision({
  symbol: 'INFY',
  model: 'llama-3.2-vision',
  period: '6mo'
});

// Get ensemble prediction
const ensemble = await fetchEnsemblePrediction('HDFCBANK', 'qwen-2.5-7b');
```

## Model Comparison

| Model | Size | Speed | Quality | Vision | Best For |
|-------|------|-------|---------|--------|----------|
| **llama-3.2-1b** | 1.3GB | ⚡⚡⚡ | ⭐⭐⭐ | ❌ | Quick analysis, low-end hardware |
| **llama-3.2-3b** | 2GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | ❌ | **Recommended default** |
| **llama-3.3-70b** | Cloud | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ❌ | Highest quality (requires Groq API) |
| **mistral-7b** | 4.1GB | ⚡⚡ | ⭐⭐⭐⭐ | ❌ | Balanced performance |
| **gemma-2b** | 1.6GB | ⚡⚡⚡ | ⭐⭐⭐ | ❌ | Fast, Google-optimized |
| **gemma-7b** | 5GB | ⚡⚡ | ⭐⭐⭐⭐ | ❌ | Better reasoning |
| **qwen-2.5-7b** | 4.7GB | ⚡⚡ | ⭐⭐⭐⭐ | ❌ | Multilingual, detailed |
| **llama-3.2-vision** | 7.9GB | ⚡ | ⭐⭐⭐⭐ | ✅ | **Chart analysis** |
| **qwen-2.5-vl** | 4.7GB | ⚡ | ⭐⭐⭐⭐ | ✅ | Alternative vision model |

## Performance Tips

1. **Hardware Requirements:**
   - Minimum: 8GB RAM (1B-3B models)
   - Recommended: 16GB RAM (7B models)
   - Vision models: 16GB+ RAM

2. **Speed Optimization:**
   - Use smaller models (1B-3B) for real-time analysis
   - Enable Ollama GPU acceleration if available
   - Use Groq API for cloud-based speed

3. **Quality vs Speed:**
   - Production: Use ensemble predictions (SVM + LLM)
   - Quick checks: Use llama-3.2-3b or gemma-2b
   - Deep analysis: Use qwen-2.5-7b or llama-3.3-70b (Groq)

## Troubleshooting

### Ollama not responding
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Test with a simple prompt
ollama run llama3.2:3b "Hello"
```

### Model not found
```bash
# Pull the model
ollama pull llama3.2:3b

# Verify it's available
ollama list | grep llama
```

### Out of memory errors
- Use smaller models (1B-2B)
- Close other applications
- Reduce context window in prompts

### Slow inference
- Check GPU availability: `ollama run llama3.2:3b --verbose`
- Use cloud models via Groq for faster results
- Consider model quantization

## Examples

### CLI Testing

```bash
# List models
curl http://localhost:8000/api/multimodal/models

# Get prediction with Llama
curl "http://localhost:8000/api/predict/RELIANCE?model=llama-3.2-3b"

# Analyze with Mistral
curl -X POST http://localhost:8000/api/multimodal/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol": "TCS", "model": "mistral-7b"}'

# Vision analysis
curl -X POST http://localhost:8000/api/multimodal/analyze-chart \
  -H "Content-Type: application/json" \
  -d '{"symbol": "INFY", "model": "llama-3.2-vision", "period": "6mo"}'

# Ensemble prediction
curl "http://localhost:8000/api/multimodal/ensemble/HDFCBANK?llm_model=qwen-2.5-7b"
```

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     FastAPI Backend             │
│  - server.py (API routes)       │
│  - multimodal_service.py (core) │
└─────────┬───────────────────────┘
          │
    ┌─────┴──────┐
    ▼            ▼
┌────────┐  ┌──────────┐
│ Ollama │  │   Groq   │
│ (Local)│  │  (Cloud) │
└────────┘  └──────────┘
    │            │
    └─────┬──────┘
          ▼
    ┌──────────────┐
    │  LLM Models  │
    │  - Llama     │
    │  - Mistral   │
    │  - Gemma     │
    │  - Qwen      │
    └──────────────┘
```

## Future Enhancements

- [ ] Model fine-tuning on Indian stock market data
- [ ] Streaming responses for real-time analysis
- [ ] Multi-stock comparison with LLMs
- [ ] Custom model training on historical signals
- [ ] Advanced chart annotations from vision models
- [ ] Portfolio optimization using LLMs

## License

This multimodal extension maintains the same license as the main project.
