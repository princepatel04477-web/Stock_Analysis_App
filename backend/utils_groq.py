import requests
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY_DEFAULT = os.getenv("GROQ_API_KEY", "")


def _analyze_stock_groq_with_model(ticker, market_data, model, api_key=None):
    if api_key is None:
        api_key = GROQ_API_KEY_DEFAULT

    if not api_key:
        return {"error": "Groq API Key is missing."}

    url = "https://api.groq.com/openai/v1/chat/completions"

    system_prompt = (
        "You are an expert Indian Financial Advisor AI. "
        "Analyze the provided stock market data and generate a trading signal (BUY, SELL, HOLD). "
        "You must output ONLY valid JSON without any markdown formatting."
    )

    user_prompt = f"""
    Analyze this market data for {ticker} (NSE):
    {json.dumps(market_data, indent=2)}

    Required Output Format (JSON Only):
    {{
        "signal": "BUY" | "SELL" | "HOLD" | "STRONG BUY" | "STRONG SELL",
        "target_price": <float>,
        "reasoning": ["point 1", "point 2", "point 3"],
        "summary": "Short executive summary."
    }}

    Logic:
    - RSI < 30 + Positive Sentiment -> STRONG BUY
    - Price > SMA20 + Positive Sentiment -> BUY
    - Price < SMA20 + Negative Sentiment -> SELL
    - RSI > 70 + Negative Sentiment -> STRONG SELL
    - RSI > 70 -> SELL/HOLD
    - Mixed signals or neutral -> HOLD

    IMPORTANT: For target_price, use analyst_target_price from market data if available.
    Only if analyst_target_price is missing or zero, calculate as:
    - current_price + (current_price * 3-5%) for BUY signals
    - current_price - (current_price * 3-5%) for SELL signals
    """

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 500,
    }

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        content = re.sub(r"```json\s*", "", content)
        content = re.sub(r"```", "", content).strip()

        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            content = json_match.group(0)

        return json.loads(content)

    except json.JSONDecodeError:
        return {"error": "Failed to parse Groq response into JSON."}
    except requests.exceptions.HTTPError as e:
        return {"error": f"Groq API HTTP Error: {str(e)}"}
    except Exception as e:
        return {"error": f"Groq API Error: {str(e)}"}


def analyze_stock_groq(ticker, market_data, api_key=None):
    return _analyze_stock_groq_with_model(
        ticker=ticker,
        market_data=market_data,
        model="llama-3.3-70b-versatile",
        api_key=api_key,
    )


def analyze_stock_groq_mixtral(ticker, market_data, api_key=None):
    return _analyze_stock_groq_with_model(
        ticker=ticker,
        market_data=market_data,
        model="mixtral-8x7b-32768",
        api_key=api_key,
    )


def analyze_stock_groq_gemma(ticker, market_data, api_key=None):
    return _analyze_stock_groq_with_model(
        ticker=ticker,
        market_data=market_data,
        model="gemma2-9b-it",
        api_key=api_key,
    )
