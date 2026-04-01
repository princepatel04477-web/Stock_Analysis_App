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
        self._is_delete = False

    def insert(self, payload):
        self._insert_payload = payload
        return self

    def select(self, _fields):
        return self

    def eq(self, key, value):
        self._filters[key] = value
        return self

    def order(self, *_args, **_kwargs):
        return self

    def delete(self):
        self._is_delete = True
        return self

    def update(self, payload):
        self._update_payload = payload
        return self

    def execute(self):
        if self._insert_payload is not None:
            row = {"id": f"id-{len(self._state) + 1}", "is_triggered": False, **self._insert_payload}
            self._state.append(row)
            return _FakeResponse([row])

        if self._update_payload is not None:
            for row in self._state:
                if all(row.get(k) == v for k, v in self._filters.items()):
                    row.update(self._update_payload)
            return _FakeResponse([])

        if self._is_delete:
            self._state[:] = [r for r in self._state if not all(r.get(k) == v for k, v in self._filters.items())]
            return _FakeResponse([])

        result = [
            r for r in self._state
            if all(r.get(k) == v for k, v in self._filters.items())
        ]
        return _FakeResponse(result)


class _FakeClient:
    def __init__(self, table_state):
        self._table_state = table_state

    def table(self, _name):
        return _FakeQuery(self._table_state)


class TestAlertEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.table_state = []

    @patch("backend.price_service.fetch_market_data")
    @patch("backend.database.get_client")
    def test_create_and_get_and_delete_alert(self, mock_get_client, mock_fetch_market_data):
        mock_get_client.return_value = _FakeClient(self.table_state)
        mock_fetch_market_data.return_value = {"error": "skip in test"}

        create_res = self.client.post(
            "/api/alerts/create",
            json={
                "user_id": "user-1",
                "symbol": "RELIANCE",
                "company_name": "Reliance Industries",
                "alert_type": "Manual Price Alert",
                "target_price": 2500,
                "condition": "above",
            },
        )
        self.assertEqual(create_res.status_code, 200)
        self.assertEqual(create_res.json(), {"success": True})

        get_res = self.client.get("/api/alerts/user-1")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(len(get_res.json()), 1)
        self.assertEqual(get_res.json()[0]["symbol"], "RELIANCE")

        alert_id = get_res.json()[0]["id"]
        delete_res = self.client.delete(f"/api/alerts/{alert_id}")
        self.assertEqual(delete_res.status_code, 200)
        self.assertEqual(delete_res.json(), {"success": True})

        get_after_delete = self.client.get("/api/alerts/user-1")
        self.assertEqual(get_after_delete.status_code, 200)
        self.assertEqual(get_after_delete.json(), [])

    @patch("backend.price_service.fetch_market_data")
    @patch("backend.database.get_client")
    def test_check_alerts_triggers_matching_alert(self, mock_get_client, mock_fetch_market_data):
        self.table_state[:] = [
            {
                "id": "a-1",
                "user_id": "user-2",
                "symbol": "TCS",
                "company_name": "TCS",
                "alert_type": "Manual Price Alert",
                "target_price": 3500,
                "condition": "above",
                "is_triggered": False,
            }
        ]
        mock_get_client.return_value = _FakeClient(self.table_state)
        mock_fetch_market_data.return_value = {"current_price": 3600}

        res = self.client.get("/api/alerts/check/user-2")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(len(body["triggered"]), 1)
        self.assertEqual(body["triggered"][0]["symbol"], "TCS")
        self.assertTrue(self.table_state[0]["is_triggered"])


if __name__ == "__main__":
    unittest.main()
