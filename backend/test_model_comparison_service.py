import os
import tempfile
import unittest

import numpy as np
import pandas as pd

from backend.model_comparison_service import run_model_comparison


class TestModelComparisonService(unittest.TestCase):
    def _create_synthetic_dataset(self, rows: int = 260) -> pd.DataFrame:
        rng = np.random.default_rng(42)
        drift = 0.001
        noise = rng.normal(0, 0.02, size=rows)
        returns = drift + noise
        close = 100 * np.cumprod(1 + returns)
        open_ = close * (1 + rng.normal(0, 0.003, size=rows))
        high = np.maximum(open_, close) * (1 + np.abs(rng.normal(0, 0.004, size=rows)))
        low = np.minimum(open_, close) * (1 - np.abs(rng.normal(0, 0.004, size=rows)))
        volume = rng.integers(1_000_000, 4_000_000, size=rows)

        return pd.DataFrame(
            {
                "open": open_,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume,
            }
        )

    def test_run_model_comparison_returns_metrics_and_plots(self):
        df = self._create_synthetic_dataset()

        with tempfile.TemporaryDirectory() as tmp_dir:
            csv_path = os.path.join(tmp_dir, "mock_stock.csv")
            df.to_csv(csv_path, index=False)

            result = run_model_comparison(symbol="RELIANCE", dataset_path=csv_path)

        self.assertIn("Logistic Regression", result["results"])
        self.assertIn("Random Forest", result["results"])
        self.assertIn("best_model", result)

        for model_name, metrics in result["results"].items():
            self.assertIn("confusion_matrix", metrics)
            self.assertIn("accuracy", metrics)
            self.assertIn("precision", metrics)
            self.assertIn("recall", metrics)
            self.assertIn("f1_score", metrics)
            self.assertGreaterEqual(metrics["accuracy"], 0.0)
            self.assertLessEqual(metrics["accuracy"], 1.0)
            self.assertEqual(len(metrics["confusion_matrix"]), 2)
            self.assertEqual(len(metrics["confusion_matrix"][0]), 2)

            cm_plot = result["plots"]["confusion_matrices"][model_name]
            self.assertIsInstance(cm_plot, str)
            self.assertGreater(len(cm_plot), 20)

        self.assertIsInstance(result["plots"]["metrics_comparison"], str)
        self.assertGreater(len(result["plots"]["metrics_comparison"]), 20)


if __name__ == "__main__":
    unittest.main()
