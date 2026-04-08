"""Model comparison and evaluation pipeline for stock direction classification."""

from __future__ import annotations

import base64
import io
import os
from dataclasses import dataclass
from typing import Any

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split


TARGET_ALIASES = ("target", "label", "signal", "buy_sell", "direction")


@dataclass
class PreparedData:
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series
    X_all: pd.DataFrame
    y_all: pd.Series


def _normalize_symbol(symbol: str) -> str:
    ticker = symbol.upper().strip()
    if not ticker.startswith("^") and not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
    return ticker


def _compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50.0)


def _target_from_series(target: pd.Series) -> pd.Series:
    if target.dtype == bool:
        return target.astype(int)

    if pd.api.types.is_numeric_dtype(target):
        return (target > 0).astype(int)

    lowered = target.astype(str).str.strip().str.lower()
    positive = lowered.isin({"1", "up", "buy", "bullish", "true", "yes"})
    return positive.astype(int)


def _build_features_from_ohlc(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    if "close" not in df.columns:
        raise ValueError("Dataset must contain a 'close' column.")

    close = pd.to_numeric(df["close"], errors="coerce")
    open_col = pd.to_numeric(df.get("open", close), errors="coerce")
    high = pd.to_numeric(df.get("high", close), errors="coerce")
    low = pd.to_numeric(df.get("low", close), errors="coerce")
    volume = pd.to_numeric(df.get("volume", 0), errors="coerce").fillna(0)

    features = pd.DataFrame(index=df.index)
    features["open"] = open_col
    features["high"] = high
    features["low"] = low
    features["close"] = close
    features["volume"] = volume
    features["return_1d"] = close.pct_change()
    features["return_5d"] = close.pct_change(5)
    features["sma_10"] = close.rolling(10, min_periods=10).mean()
    features["sma_20"] = close.rolling(20, min_periods=20).mean()
    features["ema_10"] = close.ewm(span=10, adjust=False).mean()
    features["ema_20"] = close.ewm(span=20, adjust=False).mean()
    features["volatility_10"] = close.pct_change().rolling(10, min_periods=10).std()
    features["rsi_14"] = _compute_rsi(close, period=14)

    target = (close.shift(-1) > close).astype(int)

    cleaned = features.replace([np.inf, -np.inf], np.nan)
    valid = cleaned.notna().all(axis=1) & target.notna()
    cleaned = cleaned.loc[valid]
    target = target.loc[valid]

    if len(cleaned) < 80:
        raise ValueError(
            f"Insufficient rows after feature engineering: {len(cleaned)} rows (minimum 80)."
        )

    if target.nunique() < 2:
        raise ValueError("Target must contain at least 2 classes for model comparison.")

    return cleaned, target


def load_stock_dataset(symbol: str, period: str = "5y") -> pd.DataFrame:
    ticker = _normalize_symbol(symbol)
    history = yf.Ticker(ticker).history(period=period)
    if history.empty:
        raise ValueError(f"No historical data found for symbol: {symbol}")

    history = history.reset_index()
    history.columns = [c.lower() for c in history.columns]
    return history


def load_or_create_dataset(symbol: str, dataset_path: str | None = None) -> tuple[pd.DataFrame, pd.Series]:
    if dataset_path:
        df = pd.read_csv(dataset_path)
        df.columns = [c.strip().lower() for c in df.columns]

        target_col = next((col for col in TARGET_ALIASES if col in df.columns), None)
        if target_col:
            y = _target_from_series(df[target_col])
            candidate_cols = [c for c in df.columns if c != target_col]
            X = df[candidate_cols].select_dtypes(include=[np.number]).copy()
            X = X.replace([np.inf, -np.inf], np.nan).dropna()
            y = y.loc[X.index]

            if len(X) < 80:
                raise ValueError("Dataset file has fewer than 80 valid rows after cleaning.")
            if y.nunique() < 2:
                raise ValueError("Dataset file target must contain at least 2 classes.")
            return X, y

        return _build_features_from_ohlc(df)

    stock_df = load_stock_dataset(symbol)
    return _build_features_from_ohlc(stock_df)


def prepare_data(
    symbol: str,
    dataset_path: str | None = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> PreparedData:
    X, y = load_or_create_dataset(symbol=symbol, dataset_path=dataset_path)

    stratify_y = y if y.nunique() > 1 else None

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify_y,
    )

    return PreparedData(
        X_train=X_train,
        X_test=X_test,
        y_train=y_train,
        y_test=y_test,
        X_all=X,
        y_all=y,
    )


def evaluate_model(model: Any, X_test: pd.DataFrame, y_test: pd.Series) -> dict[str, Any]:
    y_pred = model.predict(X_test)

    average_mode = "binary" if y_test.nunique() == 2 else "weighted"
    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, average=average_mode, zero_division=0))
    recall = float(recall_score(y_test, y_pred, average=average_mode, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average=average_mode, zero_division=0))

    labels = sorted(y_test.unique().tolist())
    cm = confusion_matrix(y_test, y_pred, labels=labels)

    return {
        "confusion_matrix": cm.tolist(),
        "labels": labels,
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
    }


def _fig_to_base64(fig: Any) -> str:
    buffer = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buffer, format="png", dpi=140)
    plt.close(fig)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def plot_confusion_matrix(
    confusion: list[list[int]],
    labels: list[int],
    title: str,
) -> str:
    cm = np.array(confusion)
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    fig.colorbar(im, ax=ax)

    tick_labels = ["DOWN" if int(v) == 0 else "UP" for v in labels]
    ax.set_xticks(range(len(labels)))
    ax.set_yticks(range(len(labels)))
    ax.set_xticklabels(tick_labels)
    ax.set_yticklabels(tick_labels)
    ax.set_ylabel("Actual")
    ax.set_xlabel("Predicted")
    ax.set_title(title)

    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="black")

    return _fig_to_base64(fig)


def plot_metric_comparison(results: dict[str, dict[str, Any]]) -> str:
    models = list(results.keys())
    metrics = ["accuracy", "precision", "recall", "f1_score"]

    fig, ax = plt.subplots(figsize=(8, 5))
    x = np.arange(len(metrics))
    width = 0.35

    for idx, model_name in enumerate(models):
        values = [results[model_name][m] for m in metrics]
        shift = (idx - (len(models) - 1) / 2) * width
        ax.bar(x + shift, values, width=width, label=model_name)

    ax.set_xticks(x)
    ax.set_xticklabels([m.replace("_", " ").title() for m in metrics])
    ax.set_ylim(0, 1.0)
    ax.set_ylabel("Score")
    ax.set_title("Model Metrics Comparison")
    ax.legend()

    return _fig_to_base64(fig)


def plot_roc_curve(roc_payload: dict[str, tuple[np.ndarray, np.ndarray, float]]) -> str | None:
    if not roc_payload:
        return None

    fig, ax = plt.subplots(figsize=(7, 5))
    for model_name, (fpr, tpr, auc_score) in roc_payload.items():
        ax.plot(fpr, tpr, label=f"{model_name} (AUC={auc_score:.3f})")

    ax.plot([0, 1], [0, 1], "k--", linewidth=1)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curve Comparison")
    ax.legend(loc="lower right")

    return _fig_to_base64(fig)


def run_cross_validation(model: Any, X: pd.DataFrame, y: pd.Series) -> dict[str, float]:
    min_class_count = int(y.value_counts().min())
    cv_splits = max(2, min(5, min_class_count))
    cv = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)

    scores = cross_validate(
        model,
        X,
        y,
        cv=cv,
        scoring=["accuracy", "precision_weighted", "recall_weighted", "f1_weighted"],
        n_jobs=1,
    )

    return {
        "accuracy": round(float(np.mean(scores["test_accuracy"])), 4),
        "precision": round(float(np.mean(scores["test_precision_weighted"])), 4),
        "recall": round(float(np.mean(scores["test_recall_weighted"])), 4),
        "f1_score": round(float(np.mean(scores["test_f1_weighted"])), 4),
    }


def save_models(models: dict[str, Any], model_dir: str) -> dict[str, str]:
    os.makedirs(model_dir, exist_ok=True)
    paths: dict[str, str] = {}
    for name, model in models.items():
        file_name = name.lower().replace(" ", "_") + ".joblib"
        model_path = os.path.join(model_dir, file_name)
        joblib.dump(model, model_path)
        paths[name] = model_path
    return paths


def run_model_comparison(
    symbol: str,
    dataset_path: str | None = None,
    save_trained_models: bool = False,
    model_dir: str | None = None,
) -> dict[str, Any]:
    prepared = prepare_data(symbol=symbol, dataset_path=dataset_path)

    models: dict[str, Any] = {
        "Logistic Regression": LogisticRegression(max_iter=2000, class_weight="balanced"),
        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=8,
            random_state=42,
            class_weight="balanced_subsample",
        ),
    }

    results: dict[str, dict[str, Any]] = {}
    confusion_plots: dict[str, str] = {}
    roc_payload: dict[str, tuple[np.ndarray, np.ndarray, float]] = {}
    fitted_models: dict[str, Any] = {}

    for name, model in models.items():
        model.fit(prepared.X_train, prepared.y_train)
        fitted_models[name] = model

        eval_result = evaluate_model(model, prepared.X_test, prepared.y_test)
        results[name] = eval_result
        confusion_plots[name] = plot_confusion_matrix(
            confusion=eval_result["confusion_matrix"],
            labels=eval_result["labels"],
            title=f"{name} Confusion Matrix",
        )

        if prepared.y_test.nunique() == 2 and hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(prepared.X_test)[:, 1]
            fpr, tpr, _ = roc_curve(prepared.y_test, y_prob)
            auc_score = float(roc_auc_score(prepared.y_test, y_prob))
            roc_payload[name] = (fpr, tpr, auc_score)

    metric_plot = plot_metric_comparison(results)
    roc_plot = plot_roc_curve(roc_payload)

    cross_validation = {
        name: run_cross_validation(model, prepared.X_all, prepared.y_all)
        for name, model in models.items()
    }

    saved_paths: dict[str, str] = {}
    if save_trained_models:
        output_dir = model_dir or os.path.join(os.getcwd(), "backend", "saved_models")
        saved_paths = save_models(fitted_models, output_dir)

    best_model = max(results.items(), key=lambda item: item[1]["f1_score"])[0]

    return {
        "symbol": symbol.upper().strip(),
        "model_rationale": {
            "baseline": "Logistic Regression: strong, interpretable baseline for directional classification.",
            "advanced": "Random Forest: captures non-linear interactions common in noisy stock features.",
        },
        "dataset": {
            "rows": int(len(prepared.X_all)),
            "features": int(prepared.X_all.shape[1]),
            "class_distribution": {
                "down": int((prepared.y_all == 0).sum()),
                "up": int((prepared.y_all == 1).sum()),
            },
        },
        "results": results,
        "cross_validation": cross_validation,
        "best_model": best_model,
        "plots": {
            "confusion_matrices": confusion_plots,
            "metrics_comparison": metric_plot,
            "roc_curve": roc_plot,
        },
        "saved_models": saved_paths,
    }
