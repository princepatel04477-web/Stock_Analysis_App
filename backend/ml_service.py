"""
SVM-based stock prediction engine with VADER sentiment and LIME explanations.
"""

import logging
from typing import Any, Optional

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import lime.lime_tabular

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# VADER sentiment helper
# ---------------------------------------------------------------------------

_vader: Optional[Any] = None


def _get_vader() -> Any:
    """Lazy-load VADER to avoid import-time NLTK downloads."""
    global _vader
    if _vader is None:
        import nltk
        nltk.download("vader_lexicon", quiet=True)
        from nltk.sentiment.vader import SentimentIntensityAnalyzer
        _vader = SentimentIntensityAnalyzer()
    return _vader


def compute_sentiment_score(text: str) -> float:
    """Return VADER compound score in [-1, 1] for *text*."""
    if not text or not text.strip():
        return 0.0
    return float(_get_vader().polarity_scores(text)["compound"])


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

FEATURE_NAMES: list[str] = ["sma_20", "ema_20", "momentum", "sentiment"]


def _build_features(df: pd.DataFrame, sentiment: float) -> pd.DataFrame:
    """Compute SMA(20), EMA(20), momentum, and attach a fixed sentiment."""
    if len(df) < 30:
        raise ValueError(f"Insufficient data: need at least 30 rows, got {len(df)}")
    
    out = pd.DataFrame(index=df.index)
    
    # Ensure close column exists and is numeric
    if "close" not in df.columns:
        raise ValueError("DataFrame missing 'close' column")
    
    # Convert to numeric and drop any remaining NaN in close
    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    
    # Calculate features with forward-fill for any gaps
    out["sma_20"] = df["close"].rolling(window=20, min_periods=20).mean()
    out["ema_20"] = df["close"].ewm(span=20, adjust=False, min_periods=20).mean()
    out["momentum"] = df["close"].pct_change(periods=10)
    
    # Replace inf values with NaN, then forward fill
    out = out.replace([np.inf, -np.inf], np.nan)
    
    # Sentiment should be finite
    if not np.isfinite(sentiment):
        sentiment = 0.0
    out["sentiment"] = sentiment
    
    return out


def _build_labels(df: pd.DataFrame, horizon: int = 5) -> pd.Series:
    """1 if close[t+horizon] > close[t] else 0."""
    future = df["close"].shift(-horizon)
    return (future > df["close"]).astype(int)


# ---------------------------------------------------------------------------
# Training & prediction
# ---------------------------------------------------------------------------

def _fetch_training_data(symbol: str) -> pd.DataFrame:
    """Fetch ~5.5 years of daily OHLCV via yfinance."""
    ticker = symbol.upper().strip()
    # Do NOT append .NS for index symbols (start with ^) or already-suffixed tickers
    if not ticker.startswith("^") and not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"

    stock = yf.Ticker(ticker)
    df = stock.history(period="5y")
    if df.empty:
        raise ValueError(f"No historical data found for {symbol}")

    df.reset_index(inplace=True)
    df.columns = [c.lower() for c in df.columns]

    # Ensure we have required columns
    required_cols = ["close"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Convert close to numeric and drop NaN
    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    
    # Drop rows where close price is NaN or zero or inf
    df = df.dropna(subset=["close"])
    df = df[df["close"] > 0]
    df = df[np.isfinite(df["close"])]
    df = df.reset_index(drop=True)
    
    if len(df) < 100:
        raise ValueError(f"Insufficient valid data: need at least 100 rows, got {len(df)}")

    # Trim to ~5.5 years (5.5 * 252 ~ 1386 trading days)
    if len(df) > 1386:
        df = df.tail(1386).reset_index(drop=True)

    return df


def predict_signal(symbol: str, news_text: str = "") -> dict[str, Any]:
    """
    Train an SVM (RBF kernel) on 5.5 yr OHLCV data + VADER sentiment and
    return a prediction with LIME explanations.

    Returns
    -------
    dict with keys: signal, confidence, explanation, lime_features
    """
    try:
        # --- data -----------------------------------------------------------
        df = _fetch_training_data(symbol)
        sentiment = compute_sentiment_score(news_text)
        features = _build_features(df, sentiment)
        labels = _build_labels(df)

        # Drop rows with NaN from rolling windows / future shift
        # Combine valid indices from both features and labels
        valid_features = features.dropna().index
        valid_labels = labels.dropna().index
        valid = valid_features.intersection(valid_labels)
        
        if len(valid) < 60:
            raise ValueError(f"Insufficient valid data after cleaning: {len(valid)} rows (need at least 60)")
        
        X = features.loc[valid].values.astype(np.float64)
        y = labels.loc[valid].values.astype(int)

        # Final NaN/Inf safety check — remove any remaining bad rows
        finite_mask = np.isfinite(X).all(axis=1) & np.isfinite(y)
        X = X[finite_mask]
        y = y[finite_mask]
        
        if len(X) < 60:
            raise ValueError(f"Insufficient finite data after final cleaning: {len(X)} rows (need at least 60)")

        # Verify X has no NaN or Inf before training
        if not np.isfinite(X).all():
            nan_cols = [FEATURE_NAMES[i] for i in range(X.shape[1]) if not np.isfinite(X[:, i]).all()]
            raise ValueError(f"Features contain NaN/Inf in columns: {nan_cols}")

        # --- train SVM -------------------------------------------------------
        pipe = Pipeline([
            ("scaler", StandardScaler()),
            ("svm", SVC(kernel="rbf", probability=True, random_state=42)),
        ])
        pipe.fit(X, y)

        # --- predict latest row ----------------------------------------------
        latest = X[-1].reshape(1, -1)

        # Safety: verify latest row is finite
        if not np.isfinite(latest).all():
            raise ValueError("Latest feature row contains NaN or Inf values")

        proba = pipe.predict_proba(latest)[0]
        pred_class = int(pipe.predict(latest)[0])
        confidence = float(np.max(proba))

        # Map prediction to signal
        if pred_class == 1:
            signal = "BUY" if confidence >= 0.6 else "NEUTRAL"
        else:
            signal = "SELL" if confidence >= 0.6 else "NEUTRAL"

        # --- LIME explanation ------------------------------------------------
        # Wrap LIME in try-catch since it can fail with certain data distributions
        top_features = []
        try:
            # Verify training data is clean before LIME
            if not np.isfinite(X).all():
                raise ValueError("Training data contains NaN/Inf, skipping LIME")
            
            explainer = lime.lime_tabular.LimeTabularExplainer(
                training_data=X,
                feature_names=FEATURE_NAMES,
                class_names=["SELL", "BUY"],
                mode="classification",
            )
            exp = explainer.explain_instance(
                latest.flatten(), 
                pipe.predict_proba, 
                num_features=4,
            )
            lime_list = exp.as_list()  # [(feature_desc, weight), ...]
            top_features = [
                {"feature": name, "weight": round(float(weight), 4)}
                for name, weight in lime_list[:3]
            ]
        except Exception as lime_error:
            logger.warning(f"LIME explanation failed for {symbol}: {lime_error}")
            # Provide simple feature importance based on current values
            top_features = [
                {"feature": "sma_20", "weight": 0.0},
                {"feature": "ema_20", "weight": 0.0},
                {"feature": "momentum", "weight": 0.0},
            ]

        # --- volatility label ------------------------------------------------
        # Use the filtered df rows that correspond to the valid index
        valid_close = df.loc[valid[finite_mask]]["close"] if len(valid) == len(finite_mask) else df["close"].iloc[valid]
        recent_returns = valid_close.pct_change().tail(20).std()
        if pd.isna(recent_returns):
            volatility = "N/A"
        elif recent_returns > 0.03:
            volatility = "High"
        elif recent_returns > 0.015:
            volatility = "Medium"
        else:
            volatility = "Low"

        # Use the last row of the *filtered* features (X[-1]) to read sma_20
        current_price = float(df["close"].iloc[-1])
        # X[-1] column order: sma_20, ema_20, momentum, sentiment
        sma_20_val = float(X[-1][0])  # index 0 = sma_20 (before scaling, raw value from features)

        # Re-read from filtered features for accuracy (X is post-StandardScaler order but pre-fit)
        filtered_features = features.loc[valid]
        filtered_features = filtered_features[np.isfinite(filtered_features.values).all(axis=1)]
        sma_20_val = float(filtered_features["sma_20"].iloc[-1])

        return {
            "signal": signal,
            "confidence": round(confidence, 4),
            "explanation": {
                "sentiment_weight": round(sentiment, 4),
                "price_above_sma": bool(current_price > sma_20_val),
                "volatility": volatility,
            },
            "lime_features": top_features,
        }

    except Exception as e:
        logger.exception("ML prediction failed for %s", symbol)
        return {
            "signal": "NEUTRAL",
            "confidence": 0.0,
            "explanation": {
                "sentiment_weight": 0.0,
                "price_above_sma": False,
                "volatility": "N/A",
            },
            "lime_features": [],
            "error": str(e),
        }
