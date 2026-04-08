"""LLM-vs-LLM comparison service using historical price movement as ground truth."""

from __future__ import annotations

import base64
import logging
from io import BytesIO
from typing import Any

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score

from .multimodal_service import AVAILABLE_MODELS, GroqProvider, ModelProvider, OpenRouterProvider

logger = logging.getLogger(__name__)


def _symbol_for_yf(symbol: str) -> str:
    symbol = symbol.upper().strip()
    return symbol if symbol.endswith(".NS") else f"{symbol}.NS"


def _img_to_b64(fig: Any) -> str:
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded


def _fetch_history(symbol: str, period: str) -> pd.DataFrame:
    ticker = _symbol_for_yf(symbol)
    hist = yf.Ticker(ticker).history(period=period, interval="1d")
    if hist is None or hist.empty:
        raise ValueError(f"No historical data found for {symbol}")
    df = hist.reset_index()
    keep = [c for c in ["Date", "Open", "High", "Low", "Close", "Volume"] if c in df.columns]
    df = df[keep].copy()
    df.columns = [c.lower() for c in df.columns]
    return df.dropna().reset_index(drop=True)


def _build_prompt(symbol: str, window_df: pd.DataFrame) -> str:
    close_prices = [round(float(v), 2) for v in window_df["close"].tail(10).tolist()]
    last_open = float(window_df["open"].iloc[-1])
    last_high = float(window_df["high"].iloc[-1])
    last_low = float(window_df["low"].iloc[-1])
    last_close = float(window_df["close"].iloc[-1])
    last_volume = int(window_df["volume"].iloc[-1])
    sma5 = float(window_df["close"].tail(5).mean())
    sma10 = float(window_df["close"].tail(10).mean())

    return (
        f"You are evaluating {symbol}. "
        "Predict next trading day's close direction versus today's close. "
        "Return only one word: UP or DOWN.\n"
        f"Recent closes (oldest->latest): {close_prices}\n"
        f"Latest OHLCV: O={last_open:.2f}, H={last_high:.2f}, L={last_low:.2f}, C={last_close:.2f}, V={last_volume}\n"
        f"SMA5={sma5:.2f}, SMA10={sma10:.2f}\n"
        "Answer strictly as UP or DOWN."
    )


def _ask_model(model_id: str, prompt: str, temperature: float) -> str:
    config = AVAILABLE_MODELS.get(model_id)
    if not config:
        raise ValueError(f"Unknown model: {model_id}")

    provider = config["provider"]
    provider_model_name = config["name"]

    text: str | None = None
    if provider == ModelProvider.GROQ:
        text = GroqProvider().generate_text(provider_model_name, prompt, temperature)
    elif provider == ModelProvider.OPENROUTER:
        text = OpenRouterProvider().generate_text(provider_model_name, prompt, temperature)
    else:
        raise ValueError("Only Groq and OpenRouter models are supported for this comparison")

    if not text:
        raise ValueError(f"No response from model {model_id}")

    t = text.strip().upper()
    if "DOWN" in t and "UP" not in t:
        return "DOWN"
    if "UP" in t and "DOWN" not in t:
        return "UP"
    # Fallback: first token/line heuristic
    first = t.split()[0] if t.split() else ""
    return "DOWN" if first.startswith("D") else "UP"


def _evaluate(y_true: list[int], y_pred: list[int]) -> dict[str, Any]:
    labels = [0, 1]
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    return {
        "labels": labels,
        "confusion_matrix": cm.tolist(),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "accuracy_percent": round(float(accuracy_score(y_true, y_pred) * 100), 2),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
    }


def _plot_confusion(model_name: str, cm: list[list[int]]) -> str:
    arr = np.array(cm)
    fig, ax = plt.subplots(figsize=(4.2, 3.6))
    im = ax.imshow(arr, interpolation="nearest", cmap=plt.cm.Blues)
    ax.set_title(f"{model_name} Confusion Matrix")
    ax.set_xticks([0, 1], labels=["DOWN", "UP"])
    ax.set_yticks([0, 1], labels=["DOWN", "UP"])
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(arr[i, j]), ha="center", va="center", color="black")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    return _img_to_b64(fig)


def _plot_frequency_accuracy(results: dict[str, dict[str, Any]], predictions: dict[str, list[int]]) -> str:
    model_names = list(results.keys())
    acc_values = [results[n]["accuracy_percent"] for n in model_names]
    up_freq = [round((sum(predictions[n]) / max(len(predictions[n]), 1)) * 100, 2) for n in model_names]
    down_freq = [round(100 - up, 2) for up in up_freq]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4))
    ax1.bar(model_names, acc_values, color=["#39FF14", "#58A6FF"])
    ax1.set_ylim(0, 100)
    ax1.set_title("Accuracy % by Model")
    ax1.set_ylabel("Percent")
    for i, v in enumerate(acc_values):
        ax1.text(i, min(v + 1, 99), f"{v:.2f}%", ha="center", fontsize=9)

    x = np.arange(len(model_names))
    w = 0.35
    ax2.bar(x - w / 2, down_freq, width=w, label="Pred DOWN %", color="#F85149")
    ax2.bar(x + w / 2, up_freq, width=w, label="Pred UP %", color="#39FF14")
    ax2.set_xticks(x, model_names)
    ax2.set_ylim(0, 100)
    ax2.set_title("Prediction Frequency %")
    ax2.set_ylabel("Percent")
    ax2.legend()
    fig.tight_layout()
    return _img_to_b64(fig)


def run_llm_model_comparison(
    symbol: str,
    model_a: str,
    model_b: str,
    period: str = "6mo",
    sample_size: int = 20,
    temperature: float = 0.2,
) -> dict[str, Any]:
    if model_a == model_b:
        raise ValueError("Please choose two different models")

    for model_id in (model_a, model_b):
        model_config = AVAILABLE_MODELS.get(model_id)
        if not model_config:
            raise ValueError(f"Unknown model: {model_id}")
        if model_config["provider"] not in {ModelProvider.GROQ, ModelProvider.OPENROUTER}:
            raise ValueError(f"Model {model_id} is not a Groq/OpenRouter model")
        if model_config.get("vision"):
            raise ValueError(f"Model {model_id} is vision-only; choose text models")

    df = _fetch_history(symbol=symbol, period=period)
    if len(df) < 30:
        raise ValueError("Not enough historical data for reliable comparison")

    window_size = 20
    last_index = len(df) - 2  # we need t+1 for ground truth
    start_index = max(window_size - 1, last_index - sample_size + 1)

    y_true: list[int] = []
    model_predictions: dict[str, list[int]] = {model_a: [], model_b: []}

    for idx in range(start_index, last_index + 1):
        window = df.iloc[idx - window_size + 1: idx + 1]
        today_close = float(df.iloc[idx]["close"])
        next_close = float(df.iloc[idx + 1]["close"])
        truth = 1 if next_close > today_close else 0
        y_true.append(truth)

        prompt = _build_prompt(symbol.upper(), window)
        for model_id in (model_a, model_b):
            try:
                pred_text = _ask_model(model_id, prompt, temperature=temperature)
                pred = 1 if pred_text == "UP" else 0
            except Exception as e:
                logger.warning("Model call failed for %s at idx %s: %s", model_id, idx, e)
                # Deterministic fallback: momentum of last day in window
                prev_close = float(window["close"].iloc[-2])
                last_close = float(window["close"].iloc[-1])
                pred = 1 if last_close > prev_close else 0
            model_predictions[model_id].append(pred)

    results = {
        model_a: _evaluate(y_true, model_predictions[model_a]),
        model_b: _evaluate(y_true, model_predictions[model_b]),
    }

    metric_winners = {
        "accuracy": max(results.items(), key=lambda x: x[1]["accuracy"])[0],
        "precision": max(results.items(), key=lambda x: x[1]["precision"])[0],
        "recall": max(results.items(), key=lambda x: x[1]["recall"])[0],
        "f1_score": max(results.items(), key=lambda x: x[1]["f1_score"])[0],
    }
    suggested_model = metric_winners["f1_score"]

    confusion_plots = {
        model_a: _plot_confusion(model_a, results[model_a]["confusion_matrix"]),
        model_b: _plot_confusion(model_b, results[model_b]["confusion_matrix"]),
    }
    frequency_chart = _plot_frequency_accuracy(results, model_predictions)

    return {
        "symbol": symbol.upper(),
        "ground_truth": "historical_price_movement",
        "models_compared": [model_a, model_b],
        "evaluation_samples": len(y_true),
        "results": results,
        "metric_recommendations": metric_winners,
        "suggested_model": suggested_model,
        "plots": {
            "confusion_matrices": confusion_plots,
            "frequency_accuracy_chart": frequency_chart,
        },
    }

