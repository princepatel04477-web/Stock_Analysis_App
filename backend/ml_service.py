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
    out = pd.DataFrame(index=df.index)
    out["sma_20"] = df["close"].rolling(window=20).mean()
    out["ema_20"] = df["close"].ewm(span=20, adjust=False).mean()
    out["momentum"] = df["close"].pct_change(periods=10)
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
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"

    stock = yf.Ticker(ticker)
    # Use '5y' (supported by yfinance) then extend slightly via max if needed
    df = stock.history(period="5y")
    if df.empty:
        raise ValueError(f"No historical data found for {symbol}")

    df.reset_index(inplace=True)
    df.columns = [c.lower() for c in df.columns]

    # Drop rows where close price is NaN or zero (common in Indian stock data gaps)
    df = df.dropna(subset=["close"])
    df = df[df["close"] > 0].reset_index(drop=True)

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
        valid = features.dropna().index.intersection(labels.dropna().index)
        X = features.loc[valid].values.astype(np.float64)
        y = labels.loc[valid].values.astype(int)

        # Final NaN/Inf safety check — remove any remaining bad rows
        finite_mask = np.isfinite(X).all(axis=1)
        X = X[finite_mask]
        y = y[finite_mask]

        if len(X) < 60:
            raise ValueError("Insufficient data points for training")

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
        explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=X,
            feature_names=FEATURE_NAMES,
            class_names=["SELL", "BUY"],
            mode="classification",
        )
        exp = explainer.explain_instance(
            latest.flatten(), pipe.predict_proba, num_features=4,
        )
        lime_list = exp.as_list()  # [(feature_desc, weight), ...]
        top_features = [
            {"feature": name, "weight": round(float(weight), 4)}
            for name, weight in lime_list[:3]
        ]

        # --- volatility label ------------------------------------------------
        recent_returns = df["close"].pct_change().tail(20).std()
        if pd.isna(recent_returns):
            volatility = "N/A"
        elif recent_returns > 0.03:
            volatility = "High"
        elif recent_returns > 0.015:
            volatility = "Medium"
        else:
            volatility = "Low"

        current_price = float(df["close"].iloc[-1])
        sma_20_val = float(features["sma_20"].iloc[-1]) if pd.notna(features["sma_20"].iloc[-1]) else current_price

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
