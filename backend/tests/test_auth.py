from __future__ import annotations

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.routers import auth


def test_register_login_and_refresh_rotation(client):
    registered = client.post(
        "/api/v1/auth/register",
        json={"name": "Yash", "email": "YASH@example.com", "password": "safe-password"},
    )
    assert registered.status_code == 201
    session = registered.json()
    assert session["user"]["email"] == "yash@example.com"
    assert session["token_type"] == "bearer"

    duplicate = client.post(
        "/api/v1/auth/register",
        json={"name": "Again", "email": "yash@example.com", "password": "safe-password"},
    )
    assert duplicate.status_code == 409
    assert client.post("/api/v1/auth/login", json={"email": "yash@example.com", "password": "wrong-value"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": "yash@example.com", "password": "safe-password"}).status_code == 200

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": session["refresh_token"]})
    assert refreshed.status_code == 200
    assert refreshed.json()["refresh_token"] != session["refresh_token"]
    reused = client.post("/api/v1/auth/refresh", json={"refresh_token": session["refresh_token"]})
    assert reused.status_code == 401

    logout = client.post("/api/v1/auth/logout", json={"refresh_token": refreshed.json()["refresh_token"]})
    assert logout.status_code == 204
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": refreshed.json()["refresh_token"]}).status_code == 401


def test_google_is_explicitly_unavailable_without_configuration(client):
    response = client.post("/api/v1/auth/google", json={"credential": "x" * 40})
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]


def test_google_id_token_creates_and_reuses_account(tmp_path, monkeypatch):
    monkeypatch.setattr(auth.id_token, "verify_oauth2_token", lambda credential, request, audience: {
        "sub": "google-subject-123", "email": "verified@example.com", "email_verified": True,
        "name": "Verified Gardener", "picture": "https://example.com/avatar.png", "aud": audience,
    })
    settings = Settings(
        environment="test", database_path=tmp_path / "google.db",
        jwt_secret="test-secret-that-is-longer-than-thirty-two-characters",
        access_token_minutes=15, refresh_token_days=30, cors_origins=("http://testserver",),
        google_client_id="google-client-id.apps.googleusercontent.com", plantnet_api_key=None,
        translate_api_url=None, translate_api_key=None, max_upload_bytes=10 * 1024 * 1024,
    )
    with TestClient(create_app(settings)) as configured_client:
        first = configured_client.post("/api/v1/auth/google", json={"credential": "verified-google-credential-value"})
        second = configured_client.post("/api/v1/auth/google", json={"credential": "verified-google-credential-value"})
    assert first.status_code == 200
    assert first.json()["user"]["provider"] == "google"
    assert second.json()["user"]["id"] == first.json()["user"]["id"]


def test_protected_route_rejects_missing_token(client):
    assert client.get("/api/v1/gardens").status_code == 401
