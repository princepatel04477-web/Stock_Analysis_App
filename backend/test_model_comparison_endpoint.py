import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.server import app


class TestModelComparisonEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("backend.server.run_model_comparison")
    def test_model_comparison_endpoint_returns_payload(self, mock_compare):
        mock_compare.return_value = {
            "symbol": "RELIANCE",
            "model_rationale": {
                "baseline": "baseline reason",
                "advanced": "advanced reason",
            },
            "dataset": {
                "rows": 100,
                "features": 8,
                "class_distribution": {"down": 45, "up": 55},
            },
            "results": {
                "Logistic Regression": {
                    "confusion_matrix": [[10, 2], [3, 15]],
                    "labels": [0, 1],
                    "accuracy": 0.83,
                    "precision": 0.84,
                    "recall": 0.83,
                    "f1_score": 0.83,
                }
            },
            "cross_validation": {},
            "best_model": "Logistic Regression",
            "plots": {
                "confusion_matrices": {"Logistic Regression": "abc"},
                "metrics_comparison": "def",
                "roc_curve": None,
            },
            "saved_models": {},
        }

        response = self.client.get("/api/ml/model-comparison/RELIANCE")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["symbol"], "RELIANCE")
        self.assertIn("results", body)
        self.assertIn("plots", body)


if __name__ == "__main__":
    unittest.main()
