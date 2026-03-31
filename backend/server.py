import os
import time
import asyncio
import logging
import yfinance as yf
import pandas as pd
from collections import Counter
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from backend.database import (
    get_all_stocks,
    get_cached_analysis,
    save_analysis,
    save_signal_tracking,
    get_signals_tracking_older_than_days,
    update_signal_tracking_result,
)
from backend.price_service import fetch_market_data, fetch_chart_data, fetch_stock_news
from backend.utils_perplexity import fetch_latest_data_perplexity
from backend.utils_groq import analyze_stock_groq, analyze_stock_groq_mixtral, analyze_stock_groq_gemma
from backend.ml_service import predict_signal

app = FastAPI(title="NiftyPulse API")
logger = logging.getLogger(__name__)


MODEL_METADATA = {
    "llama": "Llama 3.3 70B",
    "mixtral": "Mixtral 8x7B",
    "gemma": "Gemma 2 9B",
}


class MultiModelAnalyzeRequest(BaseModel):
    symbol: str


class TrackSignalRequest(BaseModel):
    symbol: str
    signal: str
    price_at_signal: float
    model_id: str

# ---------------------------------------------------------------------------
# In-memory cache utility
# ---------------------------------------------------------------------------
_cache: dict = {}


def get_cached(key: str, ttl_seconds: int, fetch_fn):
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < ttl_seconds:
            return data
    data = fetch_fn()
    _cache[key] = (data, time.time())
    return data


# ---------------------------------------------------------------------------
# Static symbol lists
# ---------------------------------------------------------------------------
INDEX_SYMBOLS = {
    "^NSEI": "NIFTY 50",
    "^NSEBANK": "BANK NIFTY",
    "^CNXIT": "NIFTY IT",
    "^CNXAUTO": "NIFTY AUTO",
    "^CNXFMCG": "NIFTY FMCG",
    "^CNXPHARMA": "NIFTY PHARMA",
    "^CNXMETAL": "NIFTY METAL",
    "^CNXREALTY": "NIFTY REALTY",
    "^BSESN": "SENSEX",
    "^NSMIDCP100": "NIFTY MIDCAP 100",
}

NIFTY50_SYMBOLS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "ITC",
    "SBIN", "BAJFINANCE", "BHARTIARTL", "WIPRO", "ADANIENT", "TATAMOTORS",
    "MARUTI", "SUNPHARMA", "ULTRACEMCO", "AXISBANK", "LT", "NESTLEIND",
    "POWERGRID", "NTPC", "ONGC", "COALINDIA", "TITAN", "HCLTECH",
    "ASIANPAINT", "BAJAJFINSV", "TATASTEEL", "JSWSTEEL", "DRREDDY",
    "CIPLA", "DIVISLAB", "EICHERMOT", "HEROMOTOCO", "BPCL", "BRITANNIA",
    "TECHM", "GRASIM", "APOLLOHOSP", "ADANIPORTS", "HINDALCO", "VEDL",
    "TATACONSUM", "INDUSINDBK", "SBILIFE", "BAJAJ-AUTO", "UPL", "LTIM",
    "HDFCLIFE", "MM",
]

TICKER_STOCKS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "ITC",
    "SBIN", "BAJFINANCE", "BHARTIARTL", "WIPRO", "ADANIENT", "TATAMOTORS",
    "MARUTI", "SUNPHARMA", "ULTRACEMCO", "AXISBANK", "LT", "NESTLEIND",
    "POWERGRID",
]

SECTORS = {
    "IT": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM"],
    "Banking": ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "INDUSINDBK"],
    "Auto": ["TATAMOTORS", "MARUTI", "HEROMOTOCO", "EICHERMOT"],
    "FMCG": ["HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "TATACONSUM"],
    "Pharma": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"],
    "Energy": ["RELIANCE", "ONGC", "BPCL", "NTPC", "POWERGRID", "COALINDIA"],
    "Metals": ["TATASTEEL", "JSWSTEEL", "HINDALCO", "VEDL"],
    "Realty": ["DLF"],
    "Infra": ["LT", "ADANIPORTS", "ADANIENT", "ULTRACEMCO", "GRASIM"],
    "Finance": ["BAJFINANCE", "BAJAJFINSV", "HDFCLIFE", "SBILIFE"],
    "Consumer": ["TITAN", "ASIANPAINT"],
}


# ---------------------------------------------------------------------------
# Data fetching helpers
# ---------------------------------------------------------------------------

def _fetch_index_data(symbols: list[str]) -> list[dict]:
    """Fetch price + change% for a list of yfinance index symbols."""
    results = []
    for sym in symbols:
        try:
            t = yf.Ticker(sym)
            info = t.fast_info
            price = float(info.last_price)
            prev = float(info.previous_close)
            change_pct = ((price - prev) / prev) * 100 if prev else 0.0
            results.append({
                "symbol": sym,
                "name": INDEX_SYMBOLS.get(sym, sym),
                "price": round(price, 2),
                "change_percent": round(change_pct, 2),
            })
        except Exception:
            pass
    return results


def _fetch_stock_movers(symbols: list[str]) -> list[dict]:
    """Download 2-day OHLCV for a batch of .NS stocks and compute change%."""
    tickers = [s + ".NS" for s in symbols]
    results = []
    try:
        data = yf.download(
            tickers, period="2d", interval="1d",
            group_by="ticker", progress=False, auto_adjust=True,
        )
        for sym in symbols:
            try:
                key = sym + ".NS"
                if len(tickers) == 1:
                    close_col = data["Close"]
                else:
                    close_col = data[key]["Close"]
                close_col = close_col.dropna()
                if len(close_col) >= 2:
                    prev = float(close_col.iloc[-2])
                    curr = float(close_col.iloc[-1])
                    change_pct = ((curr - prev) / prev) * 100 if prev else 0.0
                    vol = 0
                    try:
                        if len(tickers) == 1:
                            vol = int(data["Volume"].iloc[-1])
                        else:
                            vol = int(data[key]["Volume"].iloc[-1])
                    except Exception:
                        pass
                    results.append({
                        "symbol": sym,
                        "price": round(curr, 2),
                        "change_percent": round(change_pct, 2),
                        "volume": vol,
                    })
            except Exception:
                continue
    except Exception:
        pass
    return results


def _do_fetch_ticker() -> dict:
    indices = _fetch_index_data(list(INDEX_SYMBOLS.keys()))
    stock_data = _fetch_stock_movers(TICKER_STOCKS)
    stock_data.sort(key=lambda x: x["change_percent"], reverse=True)
    gainers = stock_data[:5]
    losers = stock_data[-5:][::-1]
    return {"indices": indices, "gainers": gainers, "losers": losers}


def _do_fetch_movers() -> dict:
    data = _fetch_stock_movers(NIFTY50_SYMBOLS)
    gainers = sorted(data, key=lambda x: x["change_percent"], reverse=True)[:10]
    losers = sorted(data, key=lambda x: x["change_percent"])[:10]
    return {"gainers": gainers, "losers": losers}


def _do_fetch_heatmap() -> list:
    all_symbols = []
    for stocks in SECTORS.values():
        all_symbols.extend(stocks)
    # deduplicate
    seen: set = set()
    unique: list = []
    for s in all_symbols:
        if s not in seen:
            seen.add(s)
            unique.append(s)

    tickers = [s + ".NS" for s in unique]
    result = []
    try:
        data = yf.download(
            tickers, period="2d", interval="1d",
            group_by="ticker", progress=False, auto_adjust=True,
        )
        for sector, stocks in SECTORS.items():
            sector_changes = []
            stock_data = []
            for sym in stocks:
                try:
                    key = sym + ".NS"
                    if len(tickers) == 1:
                        close_col = data["Close"]
                    else:
                        close_col = data[key]["Close"]
                    close_col = close_col.dropna()
                    if len(close_col) >= 2:
                        pct = ((float(close_col.iloc[-1]) - float(close_col.iloc[-2])) / float(close_col.iloc[-2])) * 100
                        sector_changes.append(pct)
                        stock_data.append({"symbol": sym, "change_percent": round(pct, 2)})
                except Exception:
                    continue
            if sector_changes:
                result.append({
                    "sector": sector,
                    "avg_change": round(sum(sector_changes) / len(sector_changes), 2),
                    "stocks": sorted(stock_data, key=lambda x: x["change_percent"], reverse=True),
                })
    except Exception:
        pass
    return result


def _do_fetch_indices() -> dict:
    index_syms = list(INDEX_SYMBOLS.keys()) + ["^INDIAVIX"]
    indices_data = []
    for sym in index_syms:
        try:
            t = yf.Ticker(sym)
            info = t.fast_info
            price = float(info.last_price)
            prev = float(info.previous_close)
            change_pct = ((price - prev) / prev) * 100 if prev else 0.0
            indices_data.append({
                "symbol": sym,
                "name": INDEX_SYMBOLS.get(sym, "INDIA VIX" if sym == "^INDIAVIX" else sym),
                "price": round(price, 2),
                "change_percent": round(change_pct, 2),
            })
        except Exception:
            pass

    # Reuse the movers cache when available to avoid a redundant batch download
    movers_data = get_cached("movers", 300, _do_fetch_movers)
    all_stocks = movers_data.get("gainers", []) + movers_data.get("losers", [])
    advances = sum(1 for s in all_stocks if s["change_percent"] > 0)
    declines = sum(1 for s in all_stocks if s["change_percent"] < 0)
    unchanged = len(all_stocks) - advances - declines

    return {
        "indices": indices_data,
        "breadth": {"advances": advances, "declines": declines, "unchanged": unchanged},
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Market data endpoints
# ---------------------------------------------------------------------------


@app.get("/api/market/ticker")
def market_ticker():
    """Return Indian indices + top-5 gainers & losers. Cached 2 minutes."""
    return get_cached("ticker", 120, _do_fetch_ticker)


@app.get("/api/market/movers")
def market_movers():
    """Return top-10 gainers & losers from Nifty 50. Cached 5 minutes."""
    return get_cached("movers", 300, _do_fetch_movers)


@app.get("/api/market/heatmap")
def market_heatmap():
    """Return sectoral avg change for 11 sectors. Cached 10 minutes."""
    return get_cached("heatmap", 600, _do_fetch_heatmap)


@app.get("/api/market/indices")
def market_indices():
    """Return all index values + VIX + market breadth. Cached 2 minutes."""
    return get_cached("indices", 120, _do_fetch_indices)


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


def enrich_market_data(symbol: str, market_data: dict):
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

    return market_data


def calculate_confidence(market_data, signal):
    rsi = market_data.get("rsi_14", 50)
    price = market_data.get("current_price", 0)
    sma20 = market_data.get("sma_20", 0)
    sma50 = market_data.get("sma_50", 0)
    sentiment = market_data.get("sentiment", "Neutral")

    indicators_agreeing = 0
    total_indicators = 4

    if signal in ["BUY", "STRONG BUY"]:
        if rsi < 50:
            indicators_agreeing += 1
        if price > sma20:
            indicators_agreeing += 1
        if price > sma50:
            indicators_agreeing += 1
        if sentiment == "Positive":
            indicators_agreeing += 1
    elif signal in ["SELL", "STRONG SELL"]:
        if rsi > 50:
            indicators_agreeing += 1
        if price < sma20:
            indicators_agreeing += 1
        if price < sma50:
            indicators_agreeing += 1
        if sentiment == "Negative":
            indicators_agreeing += 1
    else:
        indicators_agreeing = 2

    confidence = round((indicators_agreeing / total_indicators) * 100)
    return confidence


def fetch_live_price(symbol: str):
    ticker = symbol.upper().strip()
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
    try:
        stock = yf.Ticker(ticker)
        info = stock.fast_info
        return float(info.last_price)
    except Exception as exc:
        logger.warning("Failed to fetch live price for %s: %s", symbol, exc)
        return None


def sanitize_market_data_for_response(market_data: dict) -> dict:
    sentiment = market_data.get("sentiment", "Neutral")
    if sentiment not in {"Positive", "Negative", "Neutral"}:
        sentiment = "Neutral"

    return {
        "current_price": float(market_data.get("current_price", 0) or 0),
        "rsi_14": float(market_data.get("rsi_14", 0) or 0),
        "sma_20": float(market_data.get("sma_20", 0) or 0),
        "sma_50": float(market_data.get("sma_50", 0) or 0),
        "change_percent": float(market_data.get("change_percent", 0) or 0),
        "sentiment": sentiment,
        "analyst_target_price": float(market_data.get("analyst_target_price", 0) or 0),
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

    market_data = enrich_market_data(symbol, market_data)

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
        "market_data": sanitize_market_data_for_response(market_data),
        "analysis": analysis,
        "chart_data": chart_data,
        "from_cache": False,
    }


@app.post("/api/analyze/multi-model")
async def analyze_multi_model(payload: MultiModelAnalyzeRequest):
    symbol = payload.symbol.upper().strip()

    market_data = fetch_market_data(symbol)
    if "error" in market_data:
        raise HTTPException(status_code=400, detail=market_data["error"])

    market_data = enrich_market_data(symbol, market_data)
    groq_key = os.getenv("GROQ_API_KEY", "")

    if not groq_key:
        raise HTTPException(status_code=400, detail="Groq API Key is missing.")

    async def run_model(model_id, model_name, fn):
        analysis = await asyncio.to_thread(fn, symbol, market_data, groq_key)
        if "error" in analysis:
            analysis = generate_simple_analysis(symbol, market_data)

        signal = analysis.get("signal", "HOLD")
        confidence = calculate_confidence(market_data, signal)
        target_price = analysis.get("target_price", market_data.get("current_price", 0))
        try:
            target_price = float(target_price)
        except (TypeError, ValueError):
            target_price = market_data.get("current_price", 0)

        return {
            "model_name": model_name,
            "model_id": model_id,
            "signal": signal,
            "target_price": target_price,
            "confidence": confidence,
            "reasoning": analysis.get("reasoning", []),
            "summary": analysis.get("summary", ""),
        }

    models = await asyncio.gather(
        run_model("llama", MODEL_METADATA["llama"], analyze_stock_groq),
        run_model("mixtral", MODEL_METADATA["mixtral"], analyze_stock_groq_mixtral),
        run_model("gemma", MODEL_METADATA["gemma"], analyze_stock_groq_gemma),
    )

    signals = [m["signal"] for m in models]
    consensus_signal = Counter(signals).most_common(1)[0][0]
    avg_confidence = round(sum(m["confidence"] for m in models) / len(models)) if models else 0
    models_agreeing = sum(1 for m in models if m["signal"] == consensus_signal)

    return {
        "symbol": symbol,
        "market_data": sanitize_market_data_for_response(market_data),
        "models": models,
        "consensus": {
            "signal": consensus_signal,
            "confidence": avg_confidence,
            "models_agreeing": models_agreeing,
            "total_models": len(models),
        },
    }


@app.post("/api/signals/track")
def track_signal(payload: TrackSignalRequest):
    symbol = payload.symbol.upper().strip()
    signal = payload.signal.upper().strip()
    model_id = payload.model_id.lower().strip()

    try:
        record = save_signal_tracking(
            symbol=symbol,
            signal=signal,
            price_at_signal=payload.price_at_signal,
            model_id=model_id,
        )
        return {"status": "tracked", "data": record}
    except Exception as e:
        logger.exception("Failed to track signal for %s (%s)", symbol, model_id)
        raise HTTPException(status_code=500, detail="Failed to track signal")


@app.get("/api/signals/accuracy/{model_id}")
def signals_accuracy(model_id: str):
    model_key = model_id.lower().strip()
    rows = get_signals_tracking_older_than_days(model_key, 7)

    total = 0
    correct = 0
    returns = []

    for row in rows:
        symbol = (row.get("symbol") or "").upper().strip()
        signal = (row.get("signal") or "").upper().strip()
        price_at_signal = row.get("price_at_signal")
        signal_id = row.get("id")

        if not symbol or price_at_signal in (None, 0):
            continue

        current_price = fetch_live_price(symbol)
        if current_price in (None, 0):
            continue

        return_percent = ((float(current_price) - float(price_at_signal)) / float(price_at_signal)) * 100

        if signal in ("BUY", "STRONG BUY"):
            was_correct = current_price > price_at_signal
        elif signal in ("SELL", "STRONG SELL"):
            was_correct = current_price < price_at_signal
        else:
            was_correct = abs(return_percent) < 2

        total += 1
        if was_correct:
            correct += 1
        returns.append(return_percent)

        if signal_id:
            try:
                update_signal_tracking_result(signal_id, current_price, was_correct, return_percent)
            except Exception as exc:
                logger.warning("Failed to update signal tracking row %s: %s", signal_id, exc)

    win_rate = round((correct / total) * 100, 1) if total else 0.0
    avg_return = round(sum(returns) / len(returns), 1) if returns else 0.0

    return {
        "model_id": model_key,
        "model_name": MODEL_METADATA.get(model_key, model_key.upper()),
        "total_signals": total,
        "correct": correct,
        "win_rate": win_rate,
        "avg_return": avg_return,
    }


@app.get("/api/predict/{symbol}")
def predict(symbol: str):
    """Return SVM-based ML prediction with LIME explanations."""
    symbol = symbol.upper().strip()

    # Gather news text for sentiment — reuse Perplexity if available
    news_text = ""
    perplexity_key = os.getenv("PERPLEXITY_API_KEY", "")
    if perplexity_key:
        try:
            perp_data = fetch_latest_data_perplexity(symbol, perplexity_key)
            if "error" not in perp_data:
                news_text = perp_data.get("news_summary", "")
        except Exception:
            pass

    if not news_text:
        try:
            news_items = fetch_stock_news(symbol)
            news_text = " ".join([item["title"] for item in news_items[:5]])
        except Exception:
            pass

    result = predict_signal(symbol, news_text)
    return {"symbol": symbol, "prediction": result}


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


@app.get("/health")
def health():
    return {"status": "ok"}
