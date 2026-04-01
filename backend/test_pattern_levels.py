import unittest

from backend.price_service import detect_patterns, detect_support_resistance


class TestPatternAndLevels(unittest.TestCase):
    def test_detect_patterns_returns_recent_matches(self):
        candles = [
            {"date": "2026-01-01", "open": 100, "high": 105, "low": 95, "close": 98},
            {"date": "2026-01-02", "open": 99, "high": 103, "low": 90, "close": 91},
            {"date": "2026-01-03", "open": 90, "high": 104, "low": 89, "close": 103},  # bullish engulfing
            {"date": "2026-01-04", "open": 103, "high": 107, "low": 101, "close": 103.1},  # doji
            {"date": "2026-01-05", "open": 104, "high": 106, "low": 96, "close": 105},  # hammer-ish
            {"date": "2026-01-06", "open": 106, "high": 116, "low": 105, "close": 105.2},  # shooting star-ish
        ]
        out = detect_patterns(candles)
        self.assertGreaterEqual(len(out), 1)
        self.assertIn("pattern", out[-1])
        self.assertIn("type", out[-1])
        self.assertIn("description", out[-1])

    def test_detect_support_resistance_shapes_response(self):
        candles = []
        price = 100
        for i in range(30):
            swing = (i % 5) - 2
            high = price + 5 + swing
            low = price - 5 - swing
            close = price + (1 if i % 2 == 0 else -1)
            candles.append({
                "date": f"2026-02-{i+1:02d}",
                "open": price,
                "high": high,
                "low": low,
                "close": close,
            })
            price += 0.5

        out = detect_support_resistance(candles)
        self.assertIn("support", out)
        self.assertIn("resistance", out)
        self.assertIn("current_price", out)
        self.assertLessEqual(len(out["support"]), 3)
        self.assertLessEqual(len(out["resistance"]), 3)


if __name__ == "__main__":
    unittest.main()
