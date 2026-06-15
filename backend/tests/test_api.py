import unittest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["app"], "ThesaurUs API")
        self.assertEqual(data["status"], "running")

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("dependencies", data)

    def test_submit_endpoint(self):
        text = "Hello world! This is a simple test. Hello again."
        response = self.client.get(f"/submit?text={text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["original_text"], text)
        self.assertIn("tokens", data)
        self.assertIn("frequencies", data)
        self.assertIn("overused_words", data)

    @patch("app.main.fetch_synonyms", new_callable=AsyncMock)
    def test_synonyms_endpoint_found(self, mock_fetch):
        # Mock fetch_synonyms to return normalized synonym strings
        mock_fetch.return_value = ["sluggish", "idle", "inactive"]
        
        response = self.client.get("/synonyms?word=lazy")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["word"], "lazy")
        self.assertEqual(data["synonyms"], ["sluggish", "idle", "inactive"])
        mock_fetch.assert_called_once_with("lazy")

    @patch("app.main.fetch_synonyms", new_callable=AsyncMock)
    def test_synonyms_endpoint_not_found(self, mock_fetch):
        # Mock fetch_synonyms to return no matches
        mock_fetch.return_value = []
        
        response = self.client.get("/synonyms?word=nonexistent")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["word"], "nonexistent")
        self.assertEqual(data["synonyms"], [])
        mock_fetch.assert_called_once_with("nonexistent")

if __name__ == "__main__":
    unittest.main()
