import os
import csv
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Local fallback for stock search when Supabase is not configured.
STOCKS_CSV_PATH = Path(__file__).resolve().parent.parent / "ALL_EQUITY_FINAL.csv"


def get_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_KEY", "")

    if not supabase_url or not supabase_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY environment variables must be set"
        )

    return create_client(supabase_url, supabase_key)


def _load_stocks_from_csv():
    if not STOCKS_CSV_PATH.exists():
        return []

    stocks = []
    with STOCKS_CSV_PATH.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            symbol = (row.get("symbol") or "").strip()
            company_name = (row.get("company_name") or "").strip()
            if symbol and company_name:
                stocks.append(f"{symbol} - {company_name}")

    return stocks


def get_all_stocks():
    try:
        client = get_client()
        res = (
            client.table("stocks")
            .select("symbol, company_name")
            .order("symbol")
            .execute()
        )
        if res.data:
            return [f"{r['symbol']} - {r['company_name']}" for r in res.data]
    except Exception:
        pass

    fallback = _load_stocks_from_csv()
    if fallback:
        return fallback

    raise RuntimeError("Unable to load stocks from Supabase or local CSV")


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
