import unittest
from unittest.mock import patch
import pandas as pd

from backend.price_service import fetch_chart_data


class _FakeTicker:
    def __init__(self, df):
        self._df = df

    def history(self, period="6mo"):
        return self._df


class TestPriceServiceIndicators(unittest.TestCase):
    @patch("backend.price_service.yf.Ticker")
    def test_fetch_chart_data_includes_added_indicator_fields(self, mock_ticker):
        dates = pd.date_range("2024-01-01", periods=80, freq="D")
        df = pd.DataFrame({
            "Date": dates,
            "Open": [100 + i * 0.5 for i in range(80)],
            "High": [101 + i * 0.5 for i in range(80)],
            "Low": [99 + i * 0.5 for i in range(80)],
            "Close": [100 + i * 0.5 for i in range(80)],
            "Volume": [100000 + i for i in range(80)],
        }).set_index("Date")

        mock_ticker.return_value = _FakeTicker(df)

        candles = fetch_chart_data("RELIANCE")
        self.assertIsNotNone(candles)
        self.assertTrue(len(candles) > 0)

        latest = candles[-1]
        for key in [
            "ema_9",
            "ema_21",
            "macd",
            "macd_signal",
            "macd_diff",
            "bb_upper",
            "bb_middle",
            "bb_lower",
        ]:
            self.assertIn(key, latest)
            self.assertIsInstance(latest[key], (float, type(None)))


if __name__ == "__main__":
    unittest.main()
