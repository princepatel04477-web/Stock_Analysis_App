import requests
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "")


def fetch_latest_data_perplexity(ticker, api_key=None):
    if api_key is None:
        api_key = PERPLEXITY_API_KEY

    if not api_key:
        return {"error": "Perplexity API Key is missing."}

    url = "https://api.perplexity.ai/chat/completions"

    system_prompt = (
        "You are a real-time financial data engine. "
        "Retrieve the latest trading data for the requested stock on the NSE (National Stock Exchange of India). "
        "You must return the response in strict JSON format. "
        "Do not include markdown formatting like ```json ... ```. Just the raw JSON."
    )

    user_prompt = (
        f"Get the latest market data for {ticker} (NSE India). "
        "I need the following fields in the JSON response:\n"
        "- current_price: (float) The latest trading price in INR.\n"
        "- change_percent: (float) The percentage change today.\n"
        "- rsi_14: (float) The Relative Strength Index (14-day). If not found, estimate or set to 50.\n"
        "- sma_20: (float) The 20-day Simple Moving Average.\n"
        "- sma_50: (float) The 50-day Simple Moving Average.\n"
        "- analyst_target_price: (float) The average analyst target price from brokerages/research reports.\n"
        "- analyst_rating: (string) The consensus analyst rating like 'Buy', 'Hold', 'Sell', 'Strong Buy', etc.\n"
        "- news_summary: (string) A concise summary of the latest 3 important news headlines impacting the stock.\n"
        "- sentiment: (string) 'Positive', 'Negative', or 'Neutral' based on the news."
    )

    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
    }

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        content = re.sub(r"```json\s*", "", content)
        content = re.sub(r"```", "", content).strip()

        data = json.loads(content)
        return data

    except json.JSONDecodeError:
        return {"error": "Failed to parse Perplexity response into JSON."}
    except Exception as e:
        return {"error": f"API Error: {str(e)}"}
