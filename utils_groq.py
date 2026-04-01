import requests
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

# Get API key from environment variable
GROQ_API_KEY_DEFAULT = os.getenv("GROQ_API_KEY", "")


def analyze_stock_groq(ticker, market_data, api_key=None):
    if api_key is None:
        api_key = GROQ_API_KEY_DEFAULT
    """
    Uses Groq API with Llama 3 to generate a trading decision.
    """
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

    IMPORTANT: For target_price, you MUST use the analyst_target_price from the market data if available.
    If analyst_target_price is provided in the data, use that exact value as your target_price.
    Only if analyst_target_price is missing or zero, then calculate as:
    - current_price + (current_price * 3-5%) for BUY signals
    - current_price - (current_price * 3-5%) for SELL signals
    """

    payload = {
        "model": "llama-3.3-70b-versatile",  # Using Llama 3.3 70B
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 500,
    }

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        # Clean up markdown if present
        content = re.sub(r"```json\s*", "", content)
        content = re.sub(r"```", "", content).strip()

        # Attempt to find JSON blob if extra text exists
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            content = json_match.group(0)

        return json.loads(content)

    except json.JSONDecodeError:
        return {
            "error": "Failed to parse Groq response into JSON.",
            "raw_content": content,
        }
    except requests.exceptions.HTTPError as e:
        return {"error": f"Groq API HTTP Error: {str(e)}"}
    except Exception as e:
        return {"error": f"Groq API Error: {str(e)}"}
