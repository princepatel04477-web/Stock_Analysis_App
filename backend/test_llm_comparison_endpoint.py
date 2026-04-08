import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.server import app


class TestLLMComparisonEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("backend.server.run_llm_model_comparison")
    def test_compare_models_returns_report(self, mock_compare):
        mock_compare.return_value = {
            "symbol": "RELIANCE",
            "ground_truth": "historical_price_movement",
            "models_compared": ["llama-3.1-8b", "or-llama-3.1-8b"],
            "evaluation_samples": 20,
            "results": {
                "llama-3.1-8b": {
                    "labels": [0, 1],
                    "confusion_matrix": [[6, 3], [2, 9]],
                    "accuracy": 0.75,
                    "accuracy_percent": 75.0,
                    "precision": 0.75,
                    "recall": 0.82,
                    "f1_score": 0.78,
                }
            },
            "metric_recommendations": {
                "accuracy": "llama-3.1-8b",
                "precision": "llama-3.1-8b",
                "recall": "or-llama-3.1-8b",
                "f1_score": "or-llama-3.1-8b",
            },
            "suggested_model": "or-llama-3.1-8b",
            "plots": {
                "confusion_matrices": {"llama-3.1-8b": "abc"},
                "frequency_accuracy_chart": "def",
            },
        }

        response = self.client.post(
            "/api/multimodal/compare-models",
            json={
                "symbol": "RELIANCE",
                "model_a": "llama-3.1-8b",
                "model_b": "or-llama-3.1-8b",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["symbol"], "RELIANCE")
        self.assertEqual(body["ground_truth"], "historical_price_movement")
        self.assertIn("results", body)
        self.assertIn("metric_recommendations", body)
        self.assertIn("plots", body)


if __name__ == "__main__":
    unittest.main()

