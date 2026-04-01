from supadata.config import get_supabase

def get_all_stocks():
    client = get_supabase()
    res = client.table("stocks").select("symbol, company_name").order("symbol").execute()
    return res.data

def get_cached_analysis(symbol):
    client = get_supabase()
    res = (
        client.table("analysis_cache")
        .select("*")
        .eq("symbol", symbol)
        .order("analyzed_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None

def save_analysis(data):
    client = get_supabase()
    client.table("analysis_cache").insert(data).execute()