import yfinance as yf
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator, MACD, EMAIndicator
from ta.volatility import BollingerBands
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

        if len(df) >= 9:
            df["ema_9"] = EMAIndicator(
                close=df["close"], window=9
            ).ema_indicator()
        else:
            df["ema_9"] = None

        if len(df) >= 21:
            df["ema_21"] = EMAIndicator(
                close=df["close"], window=21
            ).ema_indicator()
        else:
            df["ema_21"] = None

        if len(df) >= 26:
            macd = MACD(
                close=df["close"],
                window_slow=26,
                window_fast=12,
                window_sign=9
            )
            df["macd"] = macd.macd()
            df["macd_signal"] = macd.macd_signal()
            df["macd_diff"] = macd.macd_diff()
        else:
            df["macd"] = None
            df["macd_signal"] = None
            df["macd_diff"] = None

        if len(df) >= 20:
            bb = BollingerBands(
                close=df["close"], window=20, window_dev=2
            )
            df["bb_upper"] = bb.bollinger_hband()
            df["bb_middle"] = bb.bollinger_mavg()
            df["bb_lower"] = bb.bollinger_lband()
            df["bb_width"] = bb.bollinger_wband()
        else:
            df["bb_upper"] = None
            df["bb_middle"] = None
            df["bb_lower"] = None
            df["bb_width"] = None

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
                "ema_9": float(row["ema_9"]) if pd.notna(row.get("ema_9")) else None,
                "ema_21": float(row["ema_21"]) if pd.notna(row.get("ema_21")) else None,
                "macd": float(row["macd"]) if pd.notna(row.get("macd")) else None,
                "macd_signal": float(row["macd_signal"]) if pd.notna(row.get("macd_signal")) else None,
                "macd_diff": float(row["macd_diff"]) if pd.notna(row.get("macd_diff")) else None,
                "bb_upper": float(row["bb_upper"]) if pd.notna(row.get("bb_upper")) else None,
                "bb_middle": float(row["bb_middle"]) if pd.notna(row.get("bb_middle")) else None,
                "bb_lower": float(row["bb_lower"]) if pd.notna(row.get("bb_lower")) else None,
            })

        return candles

    except Exception:
        return None


def detect_patterns(candles):
    patterns = []
    if len(candles) < 5:
        return patterns

    for i in range(2, len(candles)):
        c = candles[i]
        prev = candles[i - 1]

        body = abs(c["close"] - c["open"])
        range_ = c["high"] - c["low"]
        if range_ == 0:
            continue
        body_ratio = body / range_

        if body_ratio < 0.1:
            patterns.append({
                "date": c["date"],
                "pattern": "Doji",
                "type": "neutral",
                "description": "Indecision - possible reversal"
            })

        lower_shadow = min(c["open"], c["close"]) - c["low"]
        upper_shadow = c["high"] - max(c["open"], c["close"])
        if (
            lower_shadow > 2 * body and
            upper_shadow < body * 0.3 and
            c["close"] > c["open"]
        ):
            patterns.append({
                "date": c["date"],
                "pattern": "Hammer",
                "type": "bullish",
                "description": "Bullish reversal signal"
            })

        if (
            upper_shadow > 2 * body and
            lower_shadow < body * 0.3 and
            c["close"] < c["open"]
        ):
            patterns.append({
                "date": c["date"],
                "pattern": "Shooting Star",
                "type": "bearish",
                "description": "Bearish reversal signal"
            })

        if (
            prev["close"] < prev["open"] and
            c["close"] > c["open"] and
            c["open"] < prev["close"] and
            c["close"] > prev["open"]
        ):
            patterns.append({
                "date": c["date"],
                "pattern": "Bullish Engulfing",
                "type": "bullish",
                "description": "Strong bullish reversal"
            })

        if (
            prev["close"] > prev["open"] and
            c["close"] < c["open"] and
            c["open"] > prev["close"] and
            c["close"] < prev["open"]
        ):
            patterns.append({
                "date": c["date"],
                "pattern": "Bearish Engulfing",
                "type": "bearish",
                "description": "Strong bearish reversal"
            })

    return patterns[-10:]


def detect_support_resistance(candles):
    if len(candles) < 20:
        return {"support": [], "resistance": []}

    closes = [c["close"] for c in candles]
    highs = [c["high"] for c in candles]
    lows = [c["low"] for c in candles]

    resistance_levels = []
    support_levels = []
    tolerance = 0.02

    for i in range(2, len(candles) - 2):
        if (
            highs[i] > highs[i - 1] and
            highs[i] > highs[i - 2] and
            highs[i] > highs[i + 1] and
            highs[i] > highs[i + 2]
        ):
            level = round(highs[i], 2)
            if not any(abs(r - level) / level < tolerance for r in resistance_levels):
                resistance_levels.append(level)

        if (
            lows[i] < lows[i - 1] and
            lows[i] < lows[i - 2] and
            lows[i] < lows[i + 1] and
            lows[i] < lows[i + 2]
        ):
            level = round(lows[i], 2)
            if not any(abs(s - level) / level < tolerance for s in support_levels):
                support_levels.append(level)

    current_price = closes[-1]
    resistance_levels = sorted([r for r in resistance_levels if r > current_price])[:3]
    support_levels = sorted([s for s in support_levels if s < current_price], reverse=True)[:3]

    return {
        "support": support_levels,
        "resistance": resistance_levels,
        "current_price": current_price
    }


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
