from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("https://bvrkpzvwmsprsjqxheuf.supabase.co")
SUPABASE_KEY = os.getenv("sb_publishable_34ad_Z61-J9Z0Rvkeq47rg_05AKHjCd")

client = create_client(SUPABASE_URL, SUPABASE_KEY)


# -----------------------------
# STOCKS TABLE
# -----------------------------

def get_all_stocks():
    """Returns list of 'SYMBOL - Company Name'"""
    res = (
        client.table("stocks")
        .select("symbol, company_name")
        .order("symbol")
        .execute()
    )

    return [f"{r['symbol']} - {r['company_name']}" for r in res.data]


# -----------------------------
# ANALYSIS CACHE
# -----------------------------

def get_cached_analysis(symbol):
    """Returns latest cached analysis for symbol (last 4 hours)"""
    res = (
        client.table("analysis_cache")
        .select("*")
        .eq("symbol", symbol)
        .order("analyzed_at", desc=True)
        .limit(1)
        .execute()
    )

    return res.data[0] if res.data else None


def save_analysis(data: dict):
    """Saves analysis result into cache"""
    client.table("analysis_cache").insert(data).execute()


# -----------------------------
# PRICE HISTORY
# -----------------------------

def save_price_history(symbol, df):
    """Bulk upsert OHLCV data"""
    records = df[["date", "open", "high", "low", "close", "volume"]].copy()
    records["symbol"] = symbol
    records["date"] = records["date"].astype(str)

    client.table("price_history").upsert(
        records.to_dict("records")
    ).execute()


def get_price_history(symbol, days=180):
    """Fetch historical data"""
    res = (
        client.table("price_history")
        .select("*")
        .eq("symbol", symbol)
        .order("date")
        .execute()
    )

    return res.data