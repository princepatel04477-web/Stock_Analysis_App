import os
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("https://bvrkpzvwmsprsjqxheuf.supabase.co")
SUPABASE_KEY = os.getenv("sb_publishable_34ad_Z61-J9Z0Rvkeq47rg_05AKHjCd")

CSV_PATH = "../data/ALL_EQUITY_FINAL.csv"
CHUNK_SIZE = 500


def upload_stocks():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file")

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load CSV
    df = pd.read_csv(CSV_PATH)
    df.columns = [c.strip() for c in df.columns]

    print(f"Loaded {len(df)} rows from {CSV_PATH}")

    # Fix dates — parse any format and convert to YYYY-MM-DD
    df["DATE OF LISTING"] = pd.to_datetime(
        df["DATE OF LISTING"], dayfirst=False, errors="coerce"
    ).dt.strftime("%Y-%m-%d")

    # Replace NaT with None
    df["DATE OF LISTING"] = df["DATE OF LISTING"].where(
        df["DATE OF LISTING"].notna(), other=None
    )

    print(f"Sample dates after fix: {df['DATE OF LISTING'].head(3).tolist()}")

    # Build records
    records = []
    for _, row in df.iterrows():
        records.append({
            "symbol":          str(row["SYMBOL"]).strip(),
            "company_name":    str(row["NAME OF COMPANY"]).strip(),
            "series":          str(row["SERIES"]).strip(),
            "date_of_listing": row["DATE OF LISTING"],
            "paid_up_value":   int(row["PAID UP VALUE"]) if pd.notna(row["PAID UP VALUE"]) else None,
            "market_lot":      int(row["MARKET LOT"])    if pd.notna(row["MARKET LOT"])    else None,
            "isin_number":     str(row["ISIN NUMBER"]).strip(),
            "face_value":      int(row["FACE VALUE"])    if pd.notna(row["FACE VALUE"])    else None,
        })

    # Upload in chunks
    total = len(records)
    uploaded = 0

    for i in range(0, total, CHUNK_SIZE):
        chunk = records[i : i + CHUNK_SIZE]
        try:
            client.table("stocks").upsert(chunk).execute()
            uploaded += len(chunk)
            print(f"  Uploaded {uploaded}/{total} rows...")
        except Exception as e:
            print(f"  ERROR at chunk {i}-{i+CHUNK_SIZE}: {e}")
            break

    print(f"\n✅ Done! {uploaded}/{total} stocks uploaded to Supabase.")


if __name__ == "__main__":
    upload_stocks()
