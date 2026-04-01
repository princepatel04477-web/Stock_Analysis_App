import yfinance as yf
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator
from newsapi import NewsApiClient
import os


def fetch_market_data(symbol: str):
    """
    Fetches live market data from Yahoo Finance and calculates indicators.
    Returns structured dictionary for AI/service layer.
    """

    ticker = symbol.upper().strip()

    # Default to NSE
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period="6mo")

        if df.empty:
            return {"error": f"No market data found for {symbol}"}

        df.reset_index(inplace=True)
        df.columns = [c.lower() for c in df.columns]

        # Ensure we have enough data
        if len(df) < 50:
            return {"error": "Not enough historical data for indicator calculation"}

        # Calculate Indicators
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


def fetch_stock_news(symbol: str):
    """
    Fetches latest 3 news headlines for the stock.
    Requires NEWS_API_KEY in .env
    """

    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        return []

    try:
        newsapi = NewsApiClient(api_key=api_key)
        response = newsapi.get_everything(
            q=symbol,
            language="en",
            sort_by="publishedAt",
            page_size=3,
        )

        articles = response.get("articles", [])
        news_items = []

        for article in articles:
            news_items.append({
                "title": article.get("title"),
                "description": article.get("description"),
            })

        return news_items

    except Exception:
        return []