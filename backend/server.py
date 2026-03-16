import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.database import get_all_stocks, get_cached_analysis, save_analysis
from backend.price_service import fetch_market_data, fetch_chart_data, fetch_stock_news
from backend.utils_perplexity import fetch_latest_data_perplexity
from backend.utils_groq import analyze_stock_groq
from backend.ml_service import predict_signal

app = FastAPI(title="NiftyPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_simple_analysis(ticker, market_data):
    curr_price = market_data.get("current_price", 0)
    rsi = market_data.get("rsi_14", 50)
    sma_20 = market_data.get("sma_20", 0)
    change_pct = market_data.get("change_percent", 0)

    signal = "HOLD"
    reasoning = []

    if rsi < 30:
        signal = "BUY"
        reasoning.append(f"RSI at {rsi:.1f} indicates oversold conditions")
    elif rsi > 70:
        signal = "SELL"
        reasoning.append(f"RSI at {rsi:.1f} indicates overbought conditions")
    else:
        reasoning.append(f"RSI at {rsi:.1f} is neutral")

    if curr_price > sma_20:
        if signal == "HOLD":
            signal = "BUY"
        reasoning.append(f"Price (₹{curr_price:.2f}) is above 20-day SMA (₹{sma_20:.2f})")
    else:
        if signal == "HOLD":
            signal = "SELL"
        reasoning.append(f"Price (₹{curr_price:.2f}) is below 20-day SMA (₹{sma_20:.2f})")

    if change_pct > 2:
        reasoning.append(f"Strong positive momentum (+{change_pct:.2f}%)")
    elif change_pct < -2:
        reasoning.append(f"Strong negative momentum ({change_pct:.2f}%)")

    if signal in ["BUY", "STRONG BUY"]:
        target_price = curr_price * 1.05
    elif signal in ["SELL", "STRONG SELL"]:
        target_price = curr_price * 0.95
    else:
        target_price = curr_price

    return {
        "signal": signal,
        "target_price": target_price,
        "reasoning": reasoning,
        "summary": f"Based on technical indicators, {ticker} shows a {signal} signal. "
                   f"Current price is ₹{curr_price:.2f} with RSI at {rsi:.1f}.",
    }


@app.get("/api/stocks")
def get_stocks():
    try:
        stocks = get_all_stocks()
        return stocks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analyze/{symbol}")
def analyze(symbol: str):
    symbol = symbol.upper().strip()

    market_data = fetch_market_data(symbol)
    if "error" in market_data:
        raise HTTPException(status_code=400, detail=market_data["error"])

    perplexity_key = os.getenv("PERPLEXITY_API_KEY", "")
    if perplexity_key:
        perplexity_data = fetch_latest_data_perplexity(symbol, perplexity_key)
        if "error" not in perplexity_data:
            market_data.update({
                "sentiment": perplexity_data.get("sentiment", "Neutral"),
                "analyst_target_price": perplexity_data.get("analyst_target_price", 0),
                "analyst_rating": perplexity_data.get("analyst_rating", "N/A"),
                "news_summary": perplexity_data.get("news_summary", ""),
                "company_name": perplexity_data.get("company_name", symbol),
                "sector": perplexity_data.get("sector", ""),
            })
        else:
            market_data.setdefault("sentiment", "Neutral")
    else:
        news_items = fetch_stock_news(symbol)
        news_summary = "\n".join([f"- {item['title']}" for item in news_items[:3]])
        market_data["news_summary"] = news_summary or "No recent news available."
        market_data["sentiment"] = "Neutral"
        market_data["analyst_target_price"] = 0
        market_data["analyst_rating"] = "N/A"
        market_data["company_name"] = symbol
        market_data["sector"] = ""

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        analysis = analyze_stock_groq(symbol, market_data, groq_key)
        if "error" in analysis:
            analysis = generate_simple_analysis(symbol, market_data)
    else:
        analysis = generate_simple_analysis(symbol, market_data)

    chart_data = fetch_chart_data(symbol) or []

    try:
        save_analysis(symbol, analysis, market_data)
    except Exception:
        pass

    return {
        "symbol": symbol,
        "market_data": market_data,
        "analysis": analysis,
        "chart_data": chart_data,
        "from_cache": False,
    }


@app.get("/api/history/{symbol}")
def history(symbol: str, limit: int = 10):
    try:
        from backend.database import get_cached_analysis
        cached = get_cached_analysis(symbol.upper())
        if cached:
            return [cached]
        return []
    except Exception:
        return []


@app.get("/api/predict/{symbol}")
def predict(symbol: str):
    symbol = symbol.upper().strip()

    # Gather news text for VADER sentiment (reuse perplexity/yfinance data)
    news_text = ""
    perplexity_key = os.getenv("PERPLEXITY_API_KEY", "")
    if perplexity_key:
        pdata = fetch_latest_data_perplexity(symbol, perplexity_key)
        if "error" not in pdata:
            news_text = pdata.get("news_summary", "")
    else:
        from backend.price_service import fetch_stock_news
        news_items = fetch_stock_news(symbol)
        news_text = " ".join(item["title"] for item in news_items[:3])

    try:
        result = predict_signal(symbol, news_text)
        return {"symbol": symbol, "prediction": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
