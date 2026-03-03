import unittest
import pandas as pd
from utils import analyze_technical, analyze_sentiment, fusion_engine


class TestHyperTracker(unittest.TestCase):

    def setUp(self):
        # Create a sample dataframe
        data = {
            'close': [100 + i for i in range(100)]
        }
        self.df = pd.DataFrame(data)

    def test_analyze_technical(self):
        # Price is rising, so should be uptrend
        result = analyze_technical(self.df)
        # RSI will likely be high (overbought) because of straight line up.
        # Logic: Price > SMA (+1) + RSI > 70 (-1) = 0 -> HOLD
        self.assertEqual(result['signal'], 'HOLD')
        self.assertIn("Price is above 20-day Moving Average (Uptrend).", result['technical_reasons'])
        self.assertIn("RSI indicates overbought condition (> 70).", result['technical_reasons'])

    def test_analyze_sentiment_positive(self):
        text = "Company profits soar, excellent growth."
        sent, score = analyze_sentiment(text)
        self.assertEqual(sent, "POSITIVE")
        self.assertGreater(score, 0.05)

    def test_analyze_sentiment_negative(self):
        # TextBlob sentiment isn't always as sharp as VADER on some words, let's pick strong words
        text = "Company failed horribly. Terrible losses. Disaster."
        sent, score = analyze_sentiment(text)
        self.assertEqual(sent, "NEGATIVE")
        self.assertLess(score, -0.05)

    def test_analyze_sentiment_neutral(self):
        text = "The company had a meeting on Tuesday."
        sent, score = analyze_sentiment(text)
        self.assertEqual(sent, "NEUTRAL")

    def test_fusion_engine_strong_buy(self):
        tech_data = {
            'signal': 'BUY',
            'close_price': 100,
            'technical_reasons': ['Tech reason']
        }
        res = fusion_engine(tech_data, 'POSITIVE', 0.8)
        self.assertEqual(res['final_signal'], 'STRONG BUY')
        self.assertAlmostEqual(res['target_price'], 104.0)

    def test_fusion_engine_weak_buy(self):
        tech_data = {
            'signal': 'BUY',
            'close_price': 100,
            'technical_reasons': ['Tech reason']
        }
        res = fusion_engine(tech_data, 'NEGATIVE', -0.5)
        self.assertEqual(res['final_signal'], 'WEAK BUY / HOLD')


if __name__ == '__main__':
    unittest.main()
