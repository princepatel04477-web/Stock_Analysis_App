import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY environment variables must be set"
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_all_stocks():
    client = get_client()
    res = (
        client.table("stocks")
        .select("symbol, company_name")
        .order("symbol")
        .execute()
    )
    return [f"{r['symbol']} - {r['company_name']}" for r in res.data]


def get_cached_analysis(symbol):
    client = get_client()
    res = (
        client.table("analysis_cache")
        .select("*")
        .eq("symbol", symbol)
        .order("analyzed_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def save_analysis(symbol, analysis, market_data):
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
    client = get_client()
    records = df[["date", "open", "high", "low", "close", "volume"]].copy()
    records["symbol"] = symbol
    records["date"] = records["date"].astype(str)
    client.table("price_history").upsert(records.to_dict("records")).execute()


def get_price_history(symbol, days=180):
    client = get_client()
    res = (
        client.table("price_history")
        .select("*")
        .eq("symbol", symbol)
        .order("date")
        .execute()
    )
    return res.data
