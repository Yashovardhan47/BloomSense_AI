from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.config import Settings
from app.main import create_app


@pytest.fixture
def client(tmp_path):
    settings = Settings(
        environment="test",
        database_path=tmp_path / "test.db",
        jwt_secret="test-secret-that-is-longer-than-thirty-two-characters",
        access_token_minutes=15,
        refresh_token_days=30,
        cors_origins=("http://testserver",),
        google_client_id=None,
        plantnet_api_key=None,
        translate_api_url=None,
        translate_api_key=None,
        max_upload_bytes=10 * 1024 * 1024,
    )
    with TestClient(create_app(settings)) as test_client:
        yield test_client


@pytest.fixture
def session(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "Garden Tester", "email": "garden@example.com", "password": "strong-password"},
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def auth_headers(session):
    return {"Authorization": f"Bearer {session['access_token']}"}


@pytest.fixture
def png_image():
    output = io.BytesIO()
    Image.new("RGB", (320, 240), color=(100, 180, 80)).save(output, format="PNG")
    return output.getvalue()
