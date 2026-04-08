import base64
import io
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import (
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_curve,
    auc,
    ConfusionMatrixDisplay
)

def evaluate_model(model, X_test, y_test, model_name="Model"):
    """
    Evaluates a trained model and returns key metrics.
    Handles division by zero using zero_division=0.
    """
    y_pred = model.predict(X_test)

    # Calculate Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    # Compute probability for ROC if possible
    y_prob = None
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
    elif hasattr(model, "decision_function"):
        y_prob = model.decision_function(X_test)

    return {
        "name": model_name,
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1),
        "confusion_matrix": cm.tolist(),
        "y_prob": y_prob
    }

def get_base64_image(fig):
    """Convert matplotlib figure to base64 string for API response."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches='tight')
    buf.seek(0)
    img_b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return f"data:image/png;base64,{img_b64}"

def plot_confusion_matrix(cm, title="Confusion Matrix"):
    """Creates a heatmap style confusion matrix and returns base64 image."""
    fig, ax = plt.subplots(figsize=(6, 5))
    cm_arr = np.array(cm)

    disp = ConfusionMatrixDisplay(confusion_matrix=cm_arr, display_labels=['DOWN/SELL', 'UP/BUY'])
    disp.plot(cmap=plt.cm.Blues, ax=ax, values_format='d')
    ax.set_title(title)

    return get_base64_image(fig)

def plot_metric_comparison(eval1, eval2):
    """Creates a grouped bar chart comparing the metrics of two models."""
    metrics = ['Accuracy', 'Precision', 'Recall', 'F1 Score']
    m1_scores = [eval1['accuracy'], eval1['precision'], eval1['recall'], eval1['f1_score']]
    m2_scores = [eval2['accuracy'], eval2['precision'], eval2['recall'], eval2['f1_score']]

    x = np.arange(len(metrics))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8, 6))
    bars1 = ax.bar(x - width/2, m1_scores, width, label=eval1['name'], color='#4C72B0')
    bars2 = ax.bar(x + width/2, m2_scores, width, label=eval2['name'], color='#55A868')

    ax.set_ylabel('Scores')
    ax.set_title('Model Performance Comparison')
    ax.set_xticks(x)
    ax.set_xticklabels(metrics)
    ax.legend()
    ax.set_ylim([0, 1.1])

    # Add values on top of bars
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:.2f}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3),  # 3 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom')

    return get_base64_image(fig)

def plot_roc_curve(y_test, eval1, eval2):
    """Plots ROC curves for both models if probabilities are available."""
    fig, ax = plt.subplots(figsize=(8, 6))

    has_curve = False

    for evaluation in [eval1, eval2]:
        if evaluation.get('y_prob') is not None:
            has_curve = True
            fpr, tpr, _ = roc_curve(y_test, evaluation['y_prob'])
            roc_auc = auc(fpr, tpr)
            ax.plot(fpr, tpr, lw=2, label=f"{evaluation['name']} (AUC = {roc_auc:.2f})")

    if not has_curve:
        # Return empty/placeholder if models don't support probabilities
        plt.close(fig)
        return None

    ax.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate')
    ax.set_ylabel('True Positive Rate')
    ax.set_title('Receiver Operating Characteristic (ROC)')
    ax.legend(loc="lower right")

    return get_base64_image(fig)
