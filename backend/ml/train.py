import os
import joblib
from sklearn.model_selection import train_test_split, cross_val_score

from .utils import prepare_ml_data
from .models import get_baseline_model, get_advanced_model
from .evaluate import (
    evaluate_model,
    plot_confusion_matrix,
    plot_metric_comparison,
    plot_roc_curve
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_compare(symbol: str, horizon: int = 1):
    """
    Complete pipeline to fetch data, train models, evaluate, and compare.
    """
    # 1. Load and Prepare Data
    X, y, latest_features, feature_cols = prepare_ml_data(symbol, horizon)

    # 2. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False # Don't shuffle time series
    )

    # 3. Initialize Models
    baseline_model = get_baseline_model()
    advanced_model = get_advanced_model()

    # Optional: Cross Validation on Advanced Model
    cv_scores = cross_val_score(advanced_model, X_train, y_train, cv=5, scoring='accuracy')

    # 4. Train Models
    baseline_model.fit(X_train, y_train)
    advanced_model.fit(X_train, y_train)

    # Save models
    joblib.dump(baseline_model, os.path.join(MODELS_DIR, f"{symbol}_baseline.pkl"))
    joblib.dump(advanced_model, os.path.join(MODELS_DIR, f"{symbol}_advanced.pkl"))

    # 5. Evaluate Models
    eval_baseline = evaluate_model(baseline_model, X_test, y_test, model_name="Logistic Regression")
    eval_advanced = evaluate_model(advanced_model, X_test, y_test, model_name="Random Forest")

    # Clean up y_prob from output dictionary as it's not JSON serializable easily and not needed in final API output
    prob_base = eval_baseline.pop("y_prob", None)
    prob_adv = eval_advanced.pop("y_prob", None)

    # Reattach for plotting
    eval_baseline["y_prob"] = prob_base
    eval_advanced["y_prob"] = prob_adv

    # 6. Generate Visualizations
    cm_base_img = plot_confusion_matrix(eval_baseline["confusion_matrix"], title="Logistic Regression CM")
    cm_adv_img = plot_confusion_matrix(eval_advanced["confusion_matrix"], title="Random Forest CM")

    comparison_img = plot_metric_comparison(eval_baseline, eval_advanced)
    roc_img = plot_roc_curve(y_test, eval_baseline, eval_advanced)

    # Remove y_prob before returning final dict
    eval_baseline.pop("y_prob", None)
    eval_advanced.pop("y_prob", None)

    # Calculate latest prediction for both models
    base_pred = int(baseline_model.predict(latest_features)[0])
    adv_pred = int(advanced_model.predict(latest_features)[0])

    return {
        "symbol": symbol,
        "latest_signal": {
            "logistic_regression": "BUY/UP" if base_pred == 1 else "SELL/DOWN",
            "random_forest": "BUY/UP" if adv_pred == 1 else "SELL/DOWN"
        },
        "cross_validation_accuracy_rf": round(float(cv_scores.mean()), 4),
        "metrics": {
            "baseline": eval_baseline,
            "advanced": eval_advanced
        },
        "visualizations": {
            "baseline_cm": cm_base_img,
            "advanced_cm": cm_adv_img,
            "metric_comparison": comparison_img,
            "roc_curve": roc_img
        }
    }
