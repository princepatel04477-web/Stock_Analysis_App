import os
import time
import logging
from datetime import datetime, timezone
from typing import Literal
import yfinance as yf
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from backend.database import get_all_stocks, get_cached_analysis, save_analysis
from backend.price_service import fetch_market_data, fetch_chart_data, fetch_stock_news
from backend.utils_perplexity import fetch_latest_data_perplexity
from backend.utils_groq import analyze_stock_groq
from backend.ml_service import predict_signal

app = FastAPI(title="NiftyPulse API")
logger = logging.getLogger(__name__)

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


class CreateAlertRequest(BaseModel):
    user_id: str
    symbol: str
    company_name: str | None = None
    alert_type: str
    target_price: float = Field(gt=0)
    condition: Literal["above", "below"]


@app.post("/api/alerts/create")
def create_alert(alert: CreateAlertRequest):
    from backend.database import get_client
    client = get_client()
    client.table("price_alerts").insert({
        "user_id": alert.user_id,
        "symbol": alert.symbol,
        "company_name": alert.company_name,
        "alert_type": alert.alert_type,
        "target_price": alert.target_price,
        "condition": alert.condition,
    }).execute()
    return {"success": True}


@app.get("/api/alerts/{user_id}")
def get_alerts(user_id: str):
    from backend.database import get_client
    from backend.price_service import fetch_market_data
    client = get_client()
    res = client.table("price_alerts") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    alerts = res.data or []
    enriched = []
    for alert in alerts:
        try:
            market = fetch_market_data(alert["symbol"])
            if "error" not in market:
                alert["current_price"] = market.get("current_price")
        except Exception:
            pass
        enriched.append(alert)
    return enriched


@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: str):
    from backend.database import get_client
    client = get_client()
    client.table("price_alerts") \
        .delete() \
        .eq("id", alert_id) \
        .execute()
    return {"success": True}


@app.get("/api/alerts/check/{user_id}")
def check_alerts(user_id: str):
    from backend.database import get_client
    from backend.price_service import fetch_market_data
    client = get_client()

    alerts = client.table("price_alerts") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("is_triggered", False) \
        .execute().data

    triggered = []
    for alert in alerts:
        data = fetch_market_data(alert["symbol"])
        if "error" in data:
            logger.warning("Alert check skipped for symbol=%s due to market data error", alert["symbol"])
            continue
        try:
            current = float(data["current_price"])
        except (TypeError, ValueError, KeyError):
            continue
        hit = False
        if alert["condition"] == "above" and current >= alert["target_price"]:
            hit = True
        elif alert["condition"] == "below" and current <= alert["target_price"]:
            hit = True

        if hit:
            client.table("price_alerts") \
                .update({
                    "is_triggered": True,
                    "triggered_at": datetime.now(timezone.utc).isoformat()
                }) \
                .eq("id", alert["id"]) \
                .execute()
            triggered.append({
                "id": alert.get("id"),
                "symbol": alert.get("symbol"),
                "target_price": alert.get("target_price"),
                "current_price": current
            })

    return {"triggered": triggered}


@app.post("/api/portfolio/buy")
def portfolio_buy(trade: dict):
    from backend.database import get_client
    from backend.price_service import fetch_market_data
    try:
        client = get_client()
        data = fetch_market_data(trade["symbol"])
        price = float(trade.get("price") or data.get("current_price", 0))
        client.table("virtual_portfolio").insert({
            "user_id": trade["user_id"],
            "symbol": trade["symbol"],
            "company_name": trade.get("company_name", ""),
            "quantity": int(trade["quantity"]),
            "buy_price": price,
        }).execute()
        return {"success": True, "buy_price": price}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create portfolio trade")


@app.post("/api/portfolio/sell/{trade_id}")
def portfolio_sell(trade_id: str, data: dict):
    from backend.database import get_client
    from backend.price_service import fetch_market_data
    try:
        client = get_client()
        trade_rows = client.table("virtual_portfolio") \
            .select("*").eq("id", trade_id).execute().data
        if not trade_rows:
            raise HTTPException(status_code=404, detail="Trade not found")
        trade = trade_rows[0]
        market = fetch_market_data(trade["symbol"])
        sell_price = float(data.get("price") or market.get("current_price", 0))
        client.table("virtual_portfolio").update({
            "is_open": False,
            "sell_price": sell_price,
            "sell_date": datetime.now(timezone.utc).isoformat()
        }).eq("id", trade_id).execute()
        pnl = (sell_price - float(trade["buy_price"])) * int(trade["quantity"])
        return {"success": True, "sell_price": sell_price, "pnl": pnl}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to close portfolio trade")


@app.get("/api/portfolio/{user_id}")
def get_portfolio(user_id: str):
    from backend.database import get_client
    from backend.price_service import fetch_market_data
    try:
        client = get_client()
        open_trades = client.table("virtual_portfolio") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("is_open", True) \
            .execute().data
        closed_trades = client.table("virtual_portfolio") \
            .select("*") \
            .eq("user_id", user_id) \
            .eq("is_open", False) \
            .execute().data

        total_invested = 0
        total_current = 0
        enriched = []
        enriched_closed = []

        for t in open_trades:
            buy_price = float(t.get("buy_price") or 0)
            quantity = int(t.get("quantity") or 0)
            data = fetch_market_data(t["symbol"])
            current = float(data.get("current_price", buy_price))
            invested = buy_price * quantity
            current_val = current * quantity
            pnl = current_val - invested
            pnl_pct = (pnl / invested) * 100 if invested > 0 else 0

            total_invested += invested
            total_current += current_val

            enriched.append({
                **t,
                "buy_price": buy_price,
                "quantity": quantity,
                "current_price": current,
                "invested": round(invested, 2),
                "current_value": round(current_val, 2),
                "pnl": round(pnl, 2),
                "pnl_percent": round(pnl_pct, 2)
            })

        for t in closed_trades:
            buy_price = float(t.get("buy_price") or 0)
            quantity = int(t.get("quantity") or 0)
            invested = buy_price * quantity
            sell_price = float(t.get("sell_price") or 0)
            sell_value = sell_price * quantity
            pnl = sell_value - invested
            pnl_pct = (pnl / invested) * 100 if invested > 0 else 0
            enriched_closed.append({
                **t,
                "buy_price": buy_price,
                "quantity": quantity,
                "sell_price": sell_price,
                "invested": round(invested, 2),
                "final_value": round(sell_value, 2),
                "pnl": round(pnl, 2),
                "pnl_percent": round(pnl_pct, 2),
            })

        total_pnl = total_current - total_invested
        return {
            "trades": enriched,
            "closed_trades": enriched_closed,
            "summary": {
                "total_invested": round(total_invested, 2),
                "total_current": round(total_current, 2),
                "total_pnl": round(total_pnl, 2),
                "total_pnl_percent": round(
                    (total_pnl / total_invested * 100)
                    if total_invested > 0 else 0, 2
                )
            }
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch portfolio")


@app.get("/health")
def health():
    return {"status": "ok"}
