import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.server import app, _cache


class TestMarketSummaryEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        _cache.clear()

    @patch("backend.server.generate_market_summary")
    def test_market_summary_returns_generated_payload(self, mock_generate):
        mock_generate.return_value = {
            "nifty": {"price": 22500.0, "change": 0.55},
            "sensex": {"price": 74200.0, "change": 0.47},
            "india_vix": 13.2,
            "date": "2026-04-01",
            "outlook": "Bullish",
            "summary": "Test summary.",
            "watch_list": ["a", "b", "c"],
            "risk_level": "Low",
            "risk_reason": "Low volatility.",
        }

        res = self.client.get("/api/market/summary")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["outlook"], "Bullish")
        self.assertEqual(len(body["watch_list"]), 3)
        self.assertIn("nifty", body)
        self.assertIn("sensex", body)
        self.assertIn("risk_level", body)


if __name__ == "__main__":
    unittest.main()
