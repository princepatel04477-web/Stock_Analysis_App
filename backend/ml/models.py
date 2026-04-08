from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def get_baseline_model():
    """
    Returns a Logistic Regression baseline model.

    Justification:
    Logistic Regression provides a fast, robust, and highly interpretable
    linear baseline for binary classification (UP/DOWN stock prediction).
    It is well-suited to handle simple, linearly separable signal components
    without overfitting and performs well when scaled correctly. Class weights
    are balanced to mitigate any class imbalance typical in market trends.
    """
    return Pipeline([
        ("scaler", StandardScaler()),
        ("model", LogisticRegression(
            class_weight='balanced',
            random_state=42,
            max_iter=1000
        ))
    ])

def get_advanced_model():
    """
    Returns an advanced Random Forest Classifier model.

    Justification:
    Random Forest is an ensemble learning method that builds multiple decision
    trees. It excels at capturing complex, non-linear relationships and interactions
    between technical indicators (like RSI and Momentum) in noisy stock data.
    It inherently provides feature importance, requires less tuning for outliers,
    and is less prone to overfitting than a single complex model, making it a
    superior choice for advanced market movement predictions.
    """
    return Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestClassifier(
            n_estimators=100,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ))
    ])
