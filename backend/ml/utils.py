import yfinance as yf
import pandas as pd
import numpy as np

def fetch_stock_data(symbol: str, period: str = "5y") -> pd.DataFrame:
    """Fetch historical OHLCV data for a given symbol using yfinance."""
    ticker = symbol.upper().strip()
    if not ticker.startswith("^") and not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"

    stock = yf.Ticker(ticker)
    df = stock.history(period=period)

    if df.empty:
        raise ValueError(f"No historical data found for {symbol}")

    df.reset_index(inplace=True)
    df.columns = [c.lower() for c in df.columns]

    required_cols = ["close", "open", "high", "low", "volume"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    for col in required_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["close"])
    df = df[df["close"] > 0]
    df = df[np.isfinite(df["close"])]
    df = df.reset_index(drop=True)

    return df

def create_features_and_labels(df: pd.DataFrame, horizon: int = 1) -> pd.DataFrame:
    """
    Compute technical indicators and target labels.
    Label: 1 if close[t+horizon] > close[t] else 0
    """
    if len(df) < 50:
        raise ValueError(f"Insufficient data: need at least 50 rows, got {len(df)}")

    df = df.copy()

    # Calculate Features
    df["sma_20"] = df["close"].rolling(window=20, min_periods=20).mean()
    df["sma_50"] = df["close"].rolling(window=50, min_periods=50).mean()
    df["ema_20"] = df["close"].ewm(span=20, adjust=False, min_periods=20).mean()

    # RSI (Relative Strength Index)
    delta = df["close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df["rsi_14"] = 100 - (100 / (1 + rs))

    # Momentum
    df["momentum_10"] = df["close"].pct_change(periods=10)

    # Volatility
    df["volatility_20"] = df["close"].pct_change().rolling(window=20).std()

    # Target Variable (1 if up, 0 if down)
    df["target"] = (df["close"].shift(-horizon) > df["close"]).astype(int)

    # Clean data
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna()

    return df

def prepare_ml_data(symbol: str, horizon: int = 1):
    """
    End-to-end data preparation for ML models.
    Returns (X, y, latest_features)
    """
    df = fetch_stock_data(symbol)
    df = create_features_and_labels(df, horizon)

    feature_cols = ["sma_20", "sma_50", "ema_20", "rsi_14", "momentum_10", "volatility_20"]

    X = df[feature_cols].values
    y = df["target"].values

    # The last row is kept for inference (target is technically unknown for real future)
    latest_features = X[-1].reshape(1, -1)

    # Exclude the last row from training/testing since its label is not strictly "historical"
    X = X[:-1]
    y = y[:-1]

    return X, y, latest_features, feature_cols
