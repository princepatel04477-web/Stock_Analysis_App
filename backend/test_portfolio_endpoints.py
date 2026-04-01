import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.server import app


class _FakeResponse:
    def __init__(self, data):
        self.data = data


class _FakeQuery:
    def __init__(self, table_state):
        self._state = table_state
        self._filters = {}
        self._insert_payload = None
        self._update_payload = None

    def insert(self, payload):
        self._insert_payload = payload
        return self

    def select(self, _fields):
        return self

    def eq(self, key, value):
        self._filters[key] = value
        return self

    def update(self, payload):
        self._update_payload = payload
        return self

    def execute(self):
        if self._insert_payload is not None:
            row = {
                "id": f"id-{len(self._state) + 1}",
                "is_open": True,
                **self._insert_payload,
            }
            self._state.append(row)
            return _FakeResponse([row])

        if self._update_payload is not None:
            for row in self._state:
                if all(row.get(k) == v for k, v in self._filters.items()):
                    row.update(self._update_payload)
            return _FakeResponse([])

        result = [
            r for r in self._state
            if all(r.get(k) == v for k, v in self._filters.items())
        ]
        return _FakeResponse(result)


class _FakeClient:
    def __init__(self, portfolio_state):
        self._portfolio_state = portfolio_state

    def table(self, name):
        if name == "virtual_portfolio":
            return _FakeQuery(self._portfolio_state)
        return _FakeQuery([])


class TestPortfolioEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.portfolio_state = []

    @patch("backend.price_service.fetch_market_data")
    @patch("backend.database.get_client")
    def test_buy_and_get_portfolio(self, mock_get_client, mock_fetch_market_data):
        mock_get_client.return_value = _FakeClient(self.portfolio_state)
        mock_fetch_market_data.return_value = {"current_price": 2500}

        buy_res = self.client.post(
            "/api/portfolio/buy",
            json={
                "user_id": "user-1",
                "symbol": "RELIANCE",
                "company_name": "Reliance Industries",
                "quantity": 2,
            },
        )
        self.assertEqual(buy_res.status_code, 200)
        self.assertEqual(buy_res.json()["success"], True)

        get_res = self.client.get("/api/portfolio/user-1")
        self.assertEqual(get_res.status_code, 200)
        body = get_res.json()
        self.assertEqual(len(body["trades"]), 1)
        self.assertEqual(body["trades"][0]["symbol"], "RELIANCE")
        self.assertEqual(body["summary"]["total_invested"], 5000)
        self.assertEqual(body["summary"]["total_current"], 5000)

    @patch("backend.price_service.fetch_market_data")
    @patch("backend.database.get_client")
    def test_sell_trade_moves_to_closed_and_returns_pnl(self, mock_get_client, mock_fetch_market_data):
        self.portfolio_state[:] = [
            {
                "id": "t-1",
                "user_id": "user-2",
                "symbol": "TCS",
                "company_name": "TCS",
                "quantity": 3,
                "buy_price": 1000,
                "is_open": True,
            }
        ]
        mock_get_client.return_value = _FakeClient(self.portfolio_state)
        mock_fetch_market_data.return_value = {"current_price": 1100}

        sell_res = self.client.post("/api/portfolio/sell/t-1", json={})
        self.assertEqual(sell_res.status_code, 200)
        self.assertEqual(sell_res.json()["success"], True)
        self.assertEqual(sell_res.json()["pnl"], 300)
        self.assertFalse(self.portfolio_state[0]["is_open"])

        get_res = self.client.get("/api/portfolio/user-2")
        self.assertEqual(get_res.status_code, 200)
        body = get_res.json()
        self.assertEqual(len(body["trades"]), 0)
        self.assertEqual(len(body["closed_trades"]), 1)
        self.assertEqual(body["closed_trades"][0]["symbol"], "TCS")


if __name__ == "__main__":
    unittest.main()
