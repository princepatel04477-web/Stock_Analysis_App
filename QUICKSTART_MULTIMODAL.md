# Quick Start - Multimodal ML Features (Groq Cloud)

## 🚀 Quick Setup (2 minutes)

### 1. Get Groq API Key
```bash
# Sign up at: https://console.groq.com/
# Get your free API key (no credit card required)
```

### 2. Set Environment Variable
```bash
# Add to .env file
GROQ_API_KEY=your-groq-api-key-here
```

### 3. Test It
```bash
# Start backend
cd C:\Users\Om\Documents\CODES\Stock_Analysis_App-copilot-add-price-alerts-feature
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000

# Test the API
curl http://localhost:8000/api/multimodal/models
```

## 📊 Usage Examples

### Get LLM Stock Analysis
```bash
# Fast & recommended (Llama 3.1 8B)
curl "http://localhost:8000/api/predict/RELIANCE?model=llama-3.1-8b"

# Best quality (Llama 3.3 70B)
curl "http://localhost:8000/api/predict/RELIANCE?model=llama-3.3-70b"

# Google's Gemma
curl "http://localhost:8000/api/predict/RELIANCE?model=gemma2-9b"
```

### Get Ensemble Prediction (SVM + LLM)
```bash
curl "http://localhost:8000/api/multimodal/ensemble/TCS?llm_model=llama-3.1-8b"
```

### Analyze Chart with Vision
```bash
curl -X POST http://localhost:8000/api/multimodal/analyze-chart \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "INFY",
    "model": "llama-3.2-11b-vision",
    "period": "3mo"
  }'
```

## 🎯 Model Recommendations (All via Groq Cloud)

| Use Case | Recommended Model | Speed | Quality | API Call |
|----------|------------------|-------|---------|----------|
| **Fast analysis** | llama-3.1-8b | ⚡⚡⚡ | ⭐⭐⭐⭐ | Default |
| **Best quality** | llama-3.3-70b | ⚡⚡ | ⭐⭐⭐⭐⭐ | Premium |
| **Lightweight** | llama-3.2-3b | ⚡⚡⚡ | ⭐⭐⭐ | Budget |
| **Google AI** | gemma2-9b | ⚡⚡⚡ | ⭐⭐⭐⭐ | Alternative |
| **Mixtral** | mixtral-8x7b | ⚡⚡ | ⭐⭐⭐⭐⭐ | Powerful |
| **Qwen (multilang)** | qwen-2.5-72b | ⚡⚡ | ⭐⭐⭐⭐⭐ | Advanced |
| **Chart vision** | llama-3.2-11b-vision | ⚡⚡ | ⭐⭐⭐⭐ | Vision |

**All models run on Groq Cloud** - Ultra-fast inference, no local setup required!

## 🔧 Available Models

### Llama Models (Meta)
- `llama-3.1-8b` ⭐ **Recommended** - Fast & balanced
- `llama-3.2-3b` - Lightweight
- `llama-3.2-1b` - Ultra-light
- `llama-3.1-70b` - High quality
- `llama-3.3-70b` - Latest & best
- `llama-3.2-11b-vision` 👁️ Chart analysis
- `llama-3.2-90b-vision` 👁️ Advanced vision

### Mistral Models
- `mixtral-8x7b` - Mixture of experts, powerful

### Gemma Models (Google)
- `gemma-7b` - Google's 7B model
- `gemma2-9b` - Latest Gemma

### Qwen Models (Alibaba)
- `qwen-2.5-7b` - Multilingual support
- `qwen-2.5-32b` - More capable
- `qwen-2.5-72b` - Most advanced

## 💡 Why Groq Cloud?

✅ **Ultra-fast inference** - 10-100x faster than local models  
✅ **No local setup** - Just an API key, no installation  
✅ **Free tier available** - Great for testing  
✅ **Production-ready** - Reliable uptime  
✅ **Multiple models** - 13 models across 4 families  

## 🔧 Troubleshooting

**"Missing API key"**
```bash
# Set in .env file
echo "GROQ_API_KEY=your-key-here" >> .env

# Or set environment variable
export GROQ_API_KEY=your-key-here  # Linux/Mac
$env:GROQ_API_KEY="your-key-here"  # Windows PowerShell
```

**"Rate limit exceeded"**
- Free tier has rate limits
- Wait a few seconds between requests
- Consider upgrading plan for production

**"Model not found"**
- Check model name matches exactly
- Get list: `curl http://localhost:8000/api/multimodal/models`

## 📚 Full Documentation

See [MULTIMODAL_GUIDE.md](./MULTIMODAL_GUIDE.md) for:
- Complete model comparison
- Advanced configuration
- Frontend integration examples
- Performance optimization tips
- Architecture details

## 🎨 Frontend Integration

```typescript
import { fetchPredictionWithModel, fetchEnsemblePrediction } from '@/lib/api';

// Get LLM prediction (default: llama-3.1-8b)
const result = await fetchPredictionWithModel('RELIANCE', 'llama-3.1-8b');

// Get high-quality prediction
const premium = await fetchPredictionWithModel('TCS', 'llama-3.3-70b');

// Get ensemble (SVM + LLM)
const ensemble = await fetchEnsemblePrediction('TCS', 'mixtral-8x7b');
```

## ⚡ Performance

All models via Groq Cloud deliver:
- **< 1 second** response time for 8B models
- **1-2 seconds** for 70B models
- **Real-time** analysis ready
- **Production-grade** reliability

---

**Need help?** Check [MULTIMODAL_GUIDE.md](./MULTIMODAL_GUIDE.md) or visit [Groq Console](https://console.groq.com/).
