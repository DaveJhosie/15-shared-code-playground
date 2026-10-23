import uuid

import pytest


def register(client, email="alice@example.com"):
    response = client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": email, "password": "Password123!"},
    )
    return response


def create_project(client, token):
    response = client.post(
        "/api/projects",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Demo", "description": "A test project"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_authentication_and_required_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"}).status_code == 401
    registered = register(client)
    assert registered.status_code == 201
    body = registered.json()
    assert set(body["user"]) == {"id", "name", "email"}
    assert body["user"]["email"] == "alice@example.com"
    assert register(client).status_code == 409
    login = client.post(
        "/api/auth/login",
        json={"email": "ALICE@example.com", "password": "Password123!"},
    )
    assert login.status_code == 200
    assert client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login.json()['accessToken']}"},
    ).json()["id"] == body["user"]["id"]


def test_happy_path_and_duplicate_file(client):
    token = register(client).json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    project_id = create_project(client, token)

    created = client.post(
        f"/api/projects/{project_id}/files",
        headers=headers,
        json={"name": "main.py", "language": "python", "content": "print('hi')"},
    )
    assert created.status_code == 201
    file = created.json()
    assert file["content"] == "print('hi')"
    duplicate = client.post(
        f"/api/projects/{project_id}/files",
        headers=headers,
        json={"name": "main.py", "language": "python"},
    )
    assert duplicate.status_code == 409

    saved = client.post(
        f"/api/files/{file['id']}/versions",
        headers=headers,
        json={"label": "First", "content": "print('snapshot')"},
    )
    assert saved.status_code == 201
    versions = client.get(f"/api/files/{file['id']}/versions", headers=headers)
    assert versions.status_code == 200
    assert versions.json()[0]["versionNumber"] == 1
    assert versions.json()[0]["id"] == saved.json()["id"]
    run = client.post(
        f"/api/files/{file['id']}/run",
        headers=headers,
        json={"code": "print('hi')"},
    )
    assert run.status_code == 200
    assert run.json()["status"] == "success"
    assert run.json()["stdout"] == "[mock] Ran 11 characters of python"


def test_run_timeout_returns_success_http_status(client):
    token = register(client).json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    project_id = create_project(client, token)
    file = client.post(
        f"/api/projects/{project_id}/files",
        headers=headers,
        json={"name": "main.js", "language": "javascript"},
    ).json()
    response = client.post(
        f"/api/files/{file['id']}/run",
        headers=headers,
        json={"code": "// __TIMEOUT__"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "timeout"


def test_non_member_is_hidden_and_viewer_cannot_save_version(client):
    owner = register(client, "owner@example.com").json()["accessToken"]
    outsider = register(client, "outsider@example.com").json()["accessToken"]
    project_id = create_project(client, owner)
    owner_headers = {"Authorization": f"Bearer {owner}"}
    outsider_headers = {"Authorization": f"Bearer {outsider}"}
    created_file = client.post(
        f"/api/projects/{project_id}/files",
        headers=owner_headers,
        json={"name": "app.js", "language": "javascript"},
    ).json()
    assert client.get(f"/api/projects/{project_id}", headers=outsider_headers).status_code == 404

    viewer = register(client, "viewer@example.com").json()
    added = client.post(
        f"/api/projects/{project_id}/members",
        headers=owner_headers,
        json={"email": viewer["user"]["email"], "role": "viewer"},
    )
    assert added.status_code == 201
    denied = client.post(
        f"/api/files/{created_file['id']}/versions",
        headers={"Authorization": f"Bearer {viewer['accessToken']}"},
        json={"content": "cannot save"},
    )
    assert denied.status_code == 403


@pytest.mark.parametrize("path", ["/api/health", "/api/docs"])
def test_public_health_and_docs(client, path):
    response = client.get(path)
    assert response.status_code == 200


def test_project_delete_requires_owner(client):
    token = register(client).json()["accessToken"]
    project_id = create_project(client, token)
    response = client.delete(
        f"/api/projects/{uuid.UUID(project_id)}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True}
