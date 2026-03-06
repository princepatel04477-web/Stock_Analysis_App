import yfinance as yf
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator
import os


def fetch_market_data(symbol: str):
    ticker = symbol.upper().strip()

    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period="6mo")

        if df.empty:
            return {"error": f"No market data found for {symbol}"}

        df.reset_index(inplace=True)
        df.columns = [c.lower() for c in df.columns]

        if len(df) < 50:
            return {"error": "Not enough historical data for indicator calculation"}

        rsi = RSIIndicator(df["close"], window=14).rsi().iloc[-1]
        sma_20 = SMAIndicator(df["close"], window=20).sma_indicator().iloc[-1]
        sma_50 = SMAIndicator(df["close"], window=50).sma_indicator().iloc[-1]

        current_price = df["close"].iloc[-1]
        previous_close = df["close"].iloc[-2]

        change_percent = ((current_price - previous_close) / previous_close) * 100

        return {
            "current_price": float(current_price),
            "rsi_14": float(rsi),
            "sma_20": float(sma_20),
            "sma_50": float(sma_50),
            "change_percent": float(change_percent),
        }

    except Exception as e:
        return {"error": str(e)}


def fetch_chart_data(symbol: str):
    ticker = symbol.upper().strip()
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period="6mo")

        if df.empty:
            return None

        df.reset_index(inplace=True)
        df.columns = [c.lower() for c in df.columns]

        if len(df) >= 20:
            df["sma_20"] = SMAIndicator(close=df["close"], window=20).sma_indicator()
        else:
            df["sma_20"] = None

        if len(df) >= 50:
            df["sma_50"] = SMAIndicator(close=df["close"], window=50).sma_indicator()
        else:
            df["sma_50"] = None

        candles = []
        for _, row in df.iterrows():
            candles.append({
                "date": str(row["date"])[:10],
                "open": float(row["open"]) if pd.notna(row["open"]) else 0,
                "high": float(row["high"]) if pd.notna(row["high"]) else 0,
                "low": float(row["low"]) if pd.notna(row["low"]) else 0,
                "close": float(row["close"]) if pd.notna(row["close"]) else 0,
                "volume": int(row["volume"]) if pd.notna(row["volume"]) else 0,
                "sma_20": float(row["sma_20"]) if pd.notna(row.get("sma_20")) else None,
                "sma_50": float(row["sma_50"]) if pd.notna(row.get("sma_50")) else None,
            })

        return candles

    except Exception:
        return None


def fetch_stock_news(symbol: str):
    try:
        ticker = symbol.upper().strip()
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            ticker_yf = f"{ticker}.NS"
        else:
            ticker_yf = ticker

        stock = yf.Ticker(ticker_yf)
        news_list = stock.news or []

        headlines = []
        for n in news_list[:3]:
            if "content" in n and "title" in n["content"]:
                headlines.append(n["content"]["title"])
            elif "title" in n:
                headlines.append(n["title"])

        return [{"title": h, "description": ""} for h in headlines]
    except Exception:
        return []
