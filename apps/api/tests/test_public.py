from fastapi.testclient import TestClient

from app.main import app


def test_health_and_openapi_are_public(monkeypatch):
    monkeypatch.setattr("app.main.check_database", lambda: True)
    with TestClient(app) as client:
        assert client.get("/api/health").json() == {"status": "ok"}
        schema = client.get("/api/openapi.json").json()
        assert "/api/auth/register" in schema["paths"]
        assert "/api/files/{file_id}/run" in schema["paths"]


def test_database_health_reports_unavailable(monkeypatch):
    monkeypatch.setattr("app.main.check_database", lambda: True)
    monkeypatch.setattr("app.health.routes.check_database", lambda: False)
    with TestClient(app) as client:
        response = client.get("/api/health/db")
    assert response.status_code == 503
    assert response.json() == {"status": "database_unavailable"}
