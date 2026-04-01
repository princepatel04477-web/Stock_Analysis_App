"""
Multimodal ML service with support for Llama, Mistral, Gemma, and Qwen models.
Provides text-based analysis and vision-based chart pattern recognition.
"""

import os
import logging
import base64
from io import BytesIO
from typing import Any, Optional, Literal
from enum import Enum

import pandas as pd
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import mplfinance as mpf

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model Configurations
# ---------------------------------------------------------------------------

class ModelProvider(str, Enum):
    OLLAMA = "ollama"
    GROQ = "groq"


class ModelFamily(str, Enum):
    LLAMA = "llama"
    MISTRAL = "mistral"
    GEMMA = "gemma"
    QWEN = "qwen"


# Model definitions with their provider-specific names (Groq Cloud API)
AVAILABLE_MODELS = {
    # Llama models via Groq
    "llama-3.3-70b": {"provider": ModelProvider.GROQ, "name": "llama-3.3-70b-versatile", "family": ModelFamily.LLAMA, "vision": False},
    "llama-3.2-1b": {"provider": ModelProvider.GROQ, "name": "llama-3.2-1b-preview", "family": ModelFamily.LLAMA, "vision": False},
    "llama-3.2-3b": {"provider": ModelProvider.GROQ, "name": "llama-3.2-3b-preview", "family": ModelFamily.LLAMA, "vision": False},
    "llama-3.1-8b": {"provider": ModelProvider.GROQ, "name": "llama-3.1-8b-instant", "family": ModelFamily.LLAMA, "vision": False},
    "llama-3.1-70b": {"provider": ModelProvider.GROQ, "name": "llama-3.1-70b-versatile", "family": ModelFamily.LLAMA, "vision": False},
    
    # Mistral/Mixtral models via Groq
    "mixtral-8x7b": {"provider": ModelProvider.GROQ, "name": "mixtral-8x7b-32768", "family": ModelFamily.MISTRAL, "vision": False},
    
    # Gemma models via Groq
    "gemma-7b": {"provider": ModelProvider.GROQ, "name": "gemma-7b-it", "family": ModelFamily.GEMMA, "vision": False},
    "gemma2-9b": {"provider": ModelProvider.GROQ, "name": "gemma2-9b-it", "family": ModelFamily.GEMMA, "vision": False},
    
    # Qwen models via Groq
    "qwen-2.5-7b": {"provider": ModelProvider.GROQ, "name": "qwen2.5-7b-instruct", "family": ModelFamily.QWEN, "vision": False},
    "qwen-2.5-32b": {"provider": ModelProvider.GROQ, "name": "qwen2.5-32b-instruct", "family": ModelFamily.QWEN, "vision": False},
    "qwen-2.5-72b": {"provider": ModelProvider.GROQ, "name": "qwen2.5-72b-instruct", "family": ModelFamily.QWEN, "vision": False},
    
    # Vision model via Groq
    "llama-3.2-11b-vision": {"provider": ModelProvider.GROQ, "name": "llama-3.2-11b-vision-preview", "family": ModelFamily.LLAMA, "vision": True},
    "llama-3.2-90b-vision": {"provider": ModelProvider.GROQ, "name": "llama-3.2-90b-vision-preview", "family": ModelFamily.LLAMA, "vision": True},
}

DEFAULT_MODEL = "llama-3.1-8b"
DEFAULT_VISION_MODEL = "llama-3.2-11b-vision"


# ---------------------------------------------------------------------------
# LLM Provider Classes
# ---------------------------------------------------------------------------

class OllamaProvider:
    """Interface to Ollama for local model inference."""
    
    def __init__(self, host: Optional[str] = None):
        self.host = host or os.getenv("OLLAMA_HOST", "http://localhost:11434")
        try:
            import ollama
            self.client = ollama.Client(host=self.host)
        except ImportError:
            logger.warning("ollama-python not installed. Install with: pip install ollama")
            self.client = None
    
    def generate_text(self, model: str, prompt: str, temperature: float = 0.7) -> Optional[str]:
        """Generate text completion using Ollama."""
        if not self.client:
            return None
        
        try:
            response = self.client.chat(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": temperature}
            )
            return response["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama generation failed for {model}: {e}")
            return None
    
    def generate_with_image(self, model: str, prompt: str, image_data: bytes, temperature: float = 0.7) -> Optional[str]:
        """Generate completion with image input using vision-capable Ollama model."""
        if not self.client:
            return None
        
        try:
            # Convert image bytes to base64
            image_b64 = base64.b64encode(image_data).decode('utf-8')
            
            response = self.client.chat(
                model=model,
                messages=[{
                    "role": "user",
                    "content": prompt,
                    "images": [image_b64]
                }],
                options={"temperature": temperature}
            )
            return response["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama vision generation failed for {model}: {e}")
            return None
    
    def list_models(self) -> list[str]:
        """List available models in Ollama."""
        if not self.client:
            return []
        
        try:
            models = self.client.list()
            return [m["name"] for m in models.get("models", [])]
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
            return []


class GroqProvider:
    """Interface to Groq Cloud API for fast inference."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = None
        
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://api.groq.com/openai/v1"
                )
            except ImportError:
                logger.warning("openai package not installed for Groq. Install with: pip install openai")
    
    def generate_text(self, model: str, prompt: str, temperature: float = 0.7) -> Optional[str]:
        """Generate text completion using Groq."""
        if not self.client:
            return None
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=1024
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq generation failed for {model}: {e}")
            return None


# ---------------------------------------------------------------------------
# Chart Generation
# ---------------------------------------------------------------------------

def generate_candlestick_chart(df: pd.DataFrame, symbol: str) -> bytes:
    """
    Generate a candlestick chart image from OHLCV data.
    
    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with columns: date, open, high, low, close, volume
    symbol : str
        Stock symbol for chart title
    
    Returns
    -------
    bytes
        PNG image data
    """
    try:
        # Prepare data for mplfinance
        chart_df = df.copy()
        
        # Ensure date column is datetime and set as index
        if 'date' in chart_df.columns:
            chart_df['date'] = pd.to_datetime(chart_df['date'])
            chart_df.set_index('date', inplace=True)
        
        # Rename columns to match mplfinance requirements
        chart_df = chart_df.rename(columns={
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        })
        
        # Take last 60 trading days for better visualization
        chart_df = chart_df.tail(60)
        
        # Create chart
        fig, axes = mpf.plot(
            chart_df,
            type='candle',
            style='charles',
            title=f'{symbol} - Candlestick Chart',
            ylabel='Price',
            volume=True,
            figsize=(12, 8),
            returnfig=True
        )
        
        # Save to bytes
        buf = BytesIO()
        fig.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        image_bytes = buf.read()
        
        plt.close(fig)
        
        return image_bytes
        
    except Exception as e:
        logger.error(f"Failed to generate chart for {symbol}: {e}")
        raise


# ---------------------------------------------------------------------------
# Prompt Templates
# ---------------------------------------------------------------------------

STOCK_ANALYSIS_PROMPT = """You are an expert stock market analyst. Analyze the following stock data and provide insights.

Stock Symbol: {symbol}
Current Price: ${current_price:.2f}
52-Week High: ${high_52w:.2f}
52-Week Low: ${low_52w:.2f}
Market Cap: {market_cap}
PE Ratio: {pe_ratio}
Dividend Yield: {div_yield}%

Recent Price Action:
{price_summary}

Technical Indicators:
- RSI: {rsi:.2f}
- MACD: {macd:.2f}
- SMA(20): ${sma_20:.2f}
- SMA(50): ${sma_50:.2f}

Please provide:
1. Overall market sentiment (Bullish/Bearish/Neutral)
2. Key technical levels to watch
3. Short-term trading recommendation
4. Risk factors to consider

Keep your analysis concise and actionable (max 250 words)."""

CHART_PATTERN_PROMPT = """You are an expert technical analyst specializing in chart pattern recognition.

Analyze this candlestick chart and identify:
1. Chart patterns (e.g., head and shoulders, double top/bottom, triangles, flags, wedges)
2. Support and resistance levels
3. Trend direction (uptrend, downtrend, sideways)
4. Potential breakout or breakdown zones
5. Trading recommendations based on the patterns

Provide a concise analysis (max 200 words) with specific price levels where applicable."""


# ---------------------------------------------------------------------------
# Main Analysis Functions
# ---------------------------------------------------------------------------

def analyze_stock_with_llm(
    symbol: str,
    market_data: dict[str, Any],
    model_id: str = DEFAULT_MODEL,
    temperature: float = 0.7
) -> dict[str, Any]:
    """
    Analyze stock using specified LLM model.
    
    Parameters
    ----------
    symbol : str
        Stock symbol
    market_data : dict
        Market data including price, indicators, fundamentals
    model_id : str
        Model identifier from AVAILABLE_MODELS
    temperature : float
        Sampling temperature
    
    Returns
    -------
    dict
        Analysis results with signal, insights, and model info
    """
    try:
        if model_id not in AVAILABLE_MODELS:
            raise ValueError(f"Unknown model: {model_id}. Available: {list(AVAILABLE_MODELS.keys())}")
        
        model_config = AVAILABLE_MODELS[model_id]
        provider_type = model_config["provider"]
        model_name = model_config["name"]
        
        # Build prompt
        prompt = STOCK_ANALYSIS_PROMPT.format(
            symbol=symbol,
            current_price=market_data.get("current_price", 0),
            high_52w=market_data.get("high_52w", 0),
            low_52w=market_data.get("low_52w", 0),
            market_cap=market_data.get("market_cap", "N/A"),
            pe_ratio=market_data.get("pe_ratio", "N/A"),
            div_yield=market_data.get("dividend_yield", 0),
            price_summary=market_data.get("price_summary", "No recent data"),
            rsi=market_data.get("rsi", 50),
            macd=market_data.get("macd", 0),
            sma_20=market_data.get("sma_20", 0),
            sma_50=market_data.get("sma_50", 0),
        )
        
        # Get provider and generate
        response_text = None
        
        if provider_type == ModelProvider.OLLAMA:
            provider = OllamaProvider()
            response_text = provider.generate_text(model_name, prompt, temperature)
        elif provider_type == ModelProvider.GROQ:
            provider = GroqProvider()
            response_text = provider.generate_text(model_name, prompt, temperature)
        
        if not response_text:
            raise ValueError(f"Failed to get response from {provider_type} provider")
        
        # Extract signal from response (simple keyword matching)
        signal = extract_signal_from_text(response_text)
        
        return {
            "model": model_id,
            "model_family": model_config["family"],
            "provider": provider_type,
            "signal": signal,
            "analysis": response_text,
            "confidence": estimate_confidence(response_text),
        }
        
    except Exception as e:
        logger.exception(f"LLM analysis failed for {symbol} with {model_id}")
        return {
            "model": model_id,
            "signal": "NEUTRAL",
            "analysis": f"Analysis failed: {str(e)}",
            "confidence": 0.0,
            "error": str(e),
        }


def analyze_chart_with_vision(
    symbol: str,
    chart_image: bytes,
    model_id: str = DEFAULT_VISION_MODEL,
    temperature: float = 0.7
) -> dict[str, Any]:
    """
    Analyze candlestick chart using vision-capable LLM.
    
    Parameters
    ----------
    symbol : str
        Stock symbol
    chart_image : bytes
        PNG image data of candlestick chart
    model_id : str
        Vision-capable model identifier
    temperature : float
        Sampling temperature
    
    Returns
    -------
    dict
        Chart analysis with patterns, levels, and recommendations
    """
    try:
        if model_id not in AVAILABLE_MODELS:
            raise ValueError(f"Unknown model: {model_id}")
        
        model_config = AVAILABLE_MODELS[model_id]
        
        if not model_config.get("vision"):
            raise ValueError(f"Model {model_id} does not support vision")
        
        provider_type = model_config["provider"]
        model_name = model_config["name"]
        
        prompt = CHART_PATTERN_PROMPT
        response_text = None
        
        # Groq supports vision via OpenAI-compatible API
        if provider_type == ModelProvider.GROQ:
            provider = GroqProvider()
            # Use OpenAI vision format
            try:
                from openai import OpenAI
                client = OpenAI(
                    api_key=provider.api_key,
                    base_url="https://api.groq.com/openai/v1"
                )
                
                # Convert image to base64
                import base64
                image_b64 = base64.b64encode(chart_image).decode('utf-8')
                
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_b64}"
                                }
                            }
                        ]
                    }],
                    temperature=temperature,
                    max_tokens=1024
                )
                response_text = response.choices[0].message.content
            except Exception as e:
                logger.error(f"Groq vision API failed: {e}")
                raise
                
        elif provider_type == ModelProvider.OLLAMA:
            provider = OllamaProvider()
            response_text = provider.generate_with_image(model_name, prompt, chart_image, temperature)
        else:
            raise ValueError(f"Vision not supported for provider: {provider_type}")
        
        if not response_text:
            raise ValueError("Failed to get vision model response")
        
        signal = extract_signal_from_text(response_text)
        
        return {
            "model": model_id,
            "model_family": model_config["family"],
            "provider": provider_type,
            "signal": signal,
            "patterns": response_text,
            "confidence": estimate_confidence(response_text),
        }
        
    except Exception as e:
        logger.exception(f"Vision analysis failed for {symbol} with {model_id}")
        return {
            "model": model_id,
            "signal": "NEUTRAL",
            "patterns": f"Vision analysis failed: {str(e)}",
            "confidence": 0.0,
            "error": str(e),
        }


# ---------------------------------------------------------------------------
# Utility Functions
# ---------------------------------------------------------------------------

def extract_signal_from_text(text: str) -> Literal["BUY", "SELL", "NEUTRAL"]:
    """Extract trading signal from LLM response text using keyword matching."""
    text_lower = text.lower()
    
    # Count bullish vs bearish indicators
    bullish_keywords = ["bullish", "buy", "long", "uptrend", "breakout", "support holding", "accumulate"]
    bearish_keywords = ["bearish", "sell", "short", "downtrend", "breakdown", "resistance", "distribute"]
    
    bullish_count = sum(1 for kw in bullish_keywords if kw in text_lower)
    bearish_count = sum(1 for kw in bearish_keywords if kw in text_lower)
    
    if bullish_count > bearish_count and bullish_count >= 2:
        return "BUY"
    elif bearish_count > bullish_count and bearish_count >= 2:
        return "SELL"
    else:
        return "NEUTRAL"


def estimate_confidence(text: str) -> float:
    """
    Estimate confidence level from LLM response based on language strength.
    Returns value between 0.0 and 1.0.
    """
    text_lower = text.lower()
    
    # Strong confidence indicators
    strong_words = ["definitely", "certainly", "clear", "strong", "confirmed", "obvious"]
    weak_words = ["might", "could", "possibly", "uncertain", "mixed", "unclear"]
    
    strong_count = sum(1 for w in strong_words if w in text_lower)
    weak_count = sum(1 for w in weak_words if w in text_lower)
    
    # Base confidence
    confidence = 0.6
    
    # Adjust based on language
    confidence += (strong_count * 0.1)
    confidence -= (weak_count * 0.1)
    
    # Clamp to [0.3, 0.95]
    return max(0.3, min(0.95, confidence))


def get_available_models() -> list[dict[str, Any]]:
    """Return list of available models with their capabilities."""
    return [
        {
            "id": model_id,
            "name": config["name"],
            "family": config["family"],
            "provider": config["provider"],
            "vision": config["vision"],
        }
        for model_id, config in AVAILABLE_MODELS.items()
    ]


def get_model_info(model_id: str) -> Optional[dict[str, Any]]:
    """Get detailed info about a specific model."""
    if model_id not in AVAILABLE_MODELS:
        return None
    
    config = AVAILABLE_MODELS[model_id]
    return {
        "id": model_id,
        "name": config["name"],
        "family": config["family"],
        "provider": config["provider"],
        "vision": config["vision"],
    }
