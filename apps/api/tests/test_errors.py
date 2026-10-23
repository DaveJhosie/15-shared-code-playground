from fastapi.testclient import TestClient

from app.main import app
from app.realtime.server import RealtimeApplication


def test_extra_request_field_uses_contract_validation_error(monkeypatch):
    monkeypatch.setattr("app.main.check_database", lambda: True)
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={
                "name": "Test",
                "email": "validation@example.com",
                "password": "long-enough-password",
                "unexpected": "field",
            },
        )
    assert response.status_code == 400
    assert response.json() == {
        "statusCode": 400,
        "message": "Invalid unexpected",
        "error": "Bad Request",
    }
