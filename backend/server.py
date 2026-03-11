import os
import time
import yfinance as yf
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.database import get_all_stocks, get_cached_analysis, save_analysis
from backend.price_service import fetch_market_data, fetch_chart_data, fetch_stock_news
from backend.utils_perplexity import fetch_latest_data_perplexity
from backend.utils_groq import analyze_stock_groq

app = FastAPI(title="NiftyPulse API")

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

    # Compute market breadth from Nifty 50 stocks
    movers = _fetch_stock_movers(NIFTY50_SYMBOLS)
    advances = sum(1 for s in movers if s["change_percent"] > 0)
    declines = sum(1 for s in movers if s["change_percent"] < 0)
    unchanged = len(movers) - advances - declines

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


@app.get("/health")
def health():
    return {"status": "ok"}
