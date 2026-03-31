import unittest
from unittest.mock import patch

from backend.server import run_screener, screener


def _mock_market_data(symbol: str):
    samples = {
        "TCS": {"rsi_14": 25, "current_price": 120, "change_percent": 1.5, "sma_20": 100, "sma_50": 95},
        "INFY": {"rsi_14": 75, "current_price": 90, "change_percent": -2.0, "sma_20": 100, "sma_50": 105},
        "RELIANCE": {"rsi_14": 55, "current_price": 200, "change_percent": 2.2, "sma_20": 180, "sma_50": 170},
    }
    return samples.get(symbol, {"error": "unavailable"})


class ScreenerTests(unittest.TestCase):
    @patch("backend.server.fetch_market_data", side_effect=_mock_market_data)
    def test_run_screener_filters_and_sorts(self, _mock_fetch):
        filters = {
            "rsi_min": 0,
            "rsi_max": 30,
            "price_min": 0,
            "price_max": 999999,
            "change_min": -100,
            "change_max": 100,
            "signal": "BUY",
            "above_sma20": True,
            "above_sma50": False,
            "sector": "IT",
        }
        result = run_screener(filters)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["symbol"], "TCS")
        self.assertEqual(result[0]["signal"], "BUY")

    @patch("backend.server.fetch_market_data", side_effect=_mock_market_data)
    def test_run_screener_zero_bounds_are_respected(self, _mock_fetch):
        filters = {
            "rsi_min": 0,
            "rsi_max": 100,
            "price_min": 0,
            "price_max": 999999,
            "change_min": 0,
            "change_max": 100,
            "signal": "ALL",
            "above_sma20": False,
            "above_sma50": False,
            "sector": "All",
        }
        result = run_screener(filters)
        symbols = [row["symbol"] for row in result]
        self.assertIn("TCS", symbols)
        self.assertIn("RELIANCE", symbols)
        self.assertNotIn("INFY", symbols)
        rsis = [row["rsi_14"] for row in result]
        self.assertEqual(rsis, sorted(rsis))

    @patch("backend.server.run_screener", return_value=[{"symbol": "TCS"}])
    def test_api_function_delegates_to_run_screener(self, mock_run):
        payload = {"signal": "BUY"}
        result = screener(payload)
        self.assertEqual(result, [{"symbol": "TCS"}])
        mock_run.assert_called_once_with(payload)


if __name__ == "__main__":
    unittest.main()
