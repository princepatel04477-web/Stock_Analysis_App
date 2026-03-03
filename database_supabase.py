import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = ("https://bvrkpzvwmsprsjqxheuf.supabase.co")
SUPABASE_KEY = ("sb_publishable_34ad_Z61-J9Z0Rvkeq47rg_05AKHjCd")

def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_all_stocks():
    """Returns list of 'SYMBOL - Company Name' strings for the selectbox"""
    client = get_client()
    res = client.table("stocks").select("symbol, company_name").order("symbol").execute()
    return [f"{r['symbol']} - {r['company_name']}" for r in res.data]

def get_cached_analysis(symbol):
    """Returns latest cached analysis for a symbol (within last 4 hours)"""
    client = get_client()
    res = (
        client.table("analysis_cache")
        .select("*")
        .eq("symbol", symbol)
        .gte("analyzed_at", "now() - interval '4 hours'")
        .order("analyzed_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None

def save_analysis(symbol, analysis, market_data):
    """Saves AI analysis result to cache"""
    client = get_client()
    client.table("analysis_cache").insert({
        "symbol": symbol,
        "signal": analysis.get("signal"),
        "target_price": analysis.get("target_price"),
        "summary": analysis.get("summary"),
        "reasoning": analysis.get("reasoning"),
        "sentiment": market_data.get("sentiment"),
        "rsi_14": market_data.get("rsi_14"),
        "sma_20": market_data.get("sma_20"),
        "sma_50": market_data.get("sma_50"),
    }).execute()

def save_price_history(symbol, df):
    """Bulk-saves OHLCV data from a DataFrame"""
    client = get_client()
    records = df[["date", "open", "high", "low", "close", "volume"]].copy()
    records["symbol"] = symbol
    records["date"] = records["date"].astype(str)
    client.table("price_history").upsert(records.to_dict("records")).execute()

def get_price_history(symbol, days=180):
    """Fetches historical prices for charting"""
    client = get_client()
    res = (
        client.table("price_history")
        .select("*")
        .eq("symbol", symbol)
        .gte("date", f"now() - interval '{days} days'")
        .order("date")
        .execute()
    )
    return res.data
