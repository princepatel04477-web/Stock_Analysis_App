import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.server import app


class TestAnalyzePatternsResponse(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("backend.server.fetch_stock_news")
    @patch("backend.server.fetch_chart_data")
    @patch("backend.server.fetch_market_data")
    def test_analyze_includes_patterns_and_levels(self, mock_market, mock_chart, mock_news):
        mock_market.return_value = {
            "current_price": 100.0,
            "rsi_14": 50.0,
            "sma_20": 98.0,
            "sma_50": 95.0,
            "change_percent": 1.2,
        }
        mock_news.return_value = []
        mock_chart.return_value = [
            {"date": "2026-01-01", "open": 100, "high": 105, "low": 95, "close": 99, "volume": 1, "sma_20": None, "sma_50": None, "ema_9": None, "ema_21": None, "macd": None, "macd_signal": None, "macd_diff": None, "bb_upper": None, "bb_middle": None, "bb_lower": None},
            {"date": "2026-01-02", "open": 98, "high": 104, "low": 94, "close": 97, "volume": 1, "sma_20": None, "sma_50": None, "ema_9": None, "ema_21": None, "macd": None, "macd_signal": None, "macd_diff": None, "bb_upper": None, "bb_middle": None, "bb_lower": None},
            {"date": "2026-01-03", "open": 96, "high": 106, "low": 95, "close": 105, "volume": 1, "sma_20": None, "sma_50": None, "ema_9": None, "ema_21": None, "macd": None, "macd_signal": None, "macd_diff": None, "bb_upper": None, "bb_middle": None, "bb_lower": None},
            {"date": "2026-01-04", "open": 105, "high": 109, "low": 101, "close": 105.1, "volume": 1, "sma_20": None, "sma_50": None, "ema_9": None, "ema_21": None, "macd": None, "macd_signal": None, "macd_diff": None, "bb_upper": None, "bb_middle": None, "bb_lower": None},
            {"date": "2026-01-05", "open": 104, "high": 106, "low": 96, "close": 105, "volume": 1, "sma_20": None, "sma_50": None, "ema_9": None, "ema_21": None, "macd": None, "macd_signal": None, "macd_diff": None, "bb_upper": None, "bb_middle": None, "bb_lower": None},
        ]

        res = self.client.get("/api/analyze/RELIANCE")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("patterns", body)
        self.assertIn("levels", body)
        self.assertIsInstance(body["patterns"], list)
        self.assertIn("support", body["levels"])
        self.assertIn("resistance", body["levels"])


if __name__ == "__main__":
    unittest.main()
