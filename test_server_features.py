import os
import unittest

from fastapi.testclient import TestClient

import backend.server as server


class TestServerFeatures(unittest.TestCase):
    def test_calculate_confidence_buy(self):
        market_data = {
            "rsi_14": 45,
            "current_price": 120,
            "sma_20": 100,
            "sma_50": 95,
            "sentiment": "Positive",
        }
        self.assertEqual(server.calculate_confidence(market_data, "BUY"), 100)

    def test_multi_model_endpoint_consensus(self):
        client = TestClient(server.app)

        server.fetch_market_data = lambda symbol: {
            "current_price": 2400.0,
            "rsi_14": 45.0,
            "sma_20": 2350.0,
            "sma_50": 2300.0,
            "change_percent": 1.2,
        }
        server.enrich_market_data = lambda symbol, md: {**md, "sentiment": "Positive"}
        server.analyze_stock_groq = lambda *args, **kwargs: {
            "signal": "BUY",
            "target_price": 2500,
            "reasoning": ["a"],
            "summary": "s1",
        }
        server.analyze_stock_groq_mixtral = lambda *args, **kwargs: {
            "signal": "BUY",
            "target_price": 2480,
            "reasoning": ["b"],
            "summary": "s2",
        }
        server.analyze_stock_groq_gemma = lambda *args, **kwargs: {
            "signal": "HOLD",
            "target_price": 2420,
            "reasoning": ["c"],
            "summary": "s3",
        }

        previous_key = os.environ.get("GROQ_API_KEY")
        os.environ["GROQ_API_KEY"] = "test"
        try:
            response = client.post("/api/analyze/multi-model", json={"symbol": "RELIANCE"})
        finally:
            if previous_key is None:
                os.environ.pop("GROQ_API_KEY", None)
            else:
                os.environ["GROQ_API_KEY"] = previous_key

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["consensus"]["signal"], "BUY")
        self.assertEqual(body["consensus"]["models_agreeing"], 2)
        self.assertEqual(body["consensus"]["total_models"], 3)
        self.assertEqual(len(body["models"]), 3)


if __name__ == "__main__":
    unittest.main()
