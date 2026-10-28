from __future__ import annotations

import asyncio

from app import plant_service


def test_guided_samples_have_deep_profiles(client):
    listing = client.get("/api/v1/flowers/samples")
    assert listing.status_code == 200
    assert {item["slug"] for item in listing.json()["items"]} == {"rose", "sunflower", "lotus", "orchid"}

    result = client.get("/api/v1/flowers/samples/sunflower")
    assert result.status_code == 200
    assert result.json()["common_name"] == "Sunflower"
    assert result.json()["deep_profile"]["safety"]["edible"]


def test_live_identification_never_falls_back_to_rose(client, auth_headers, png_image):
    response = client.post(
        "/api/v1/flowers/identify",
        headers=auth_headers,
        files={"image": ("flower.png", png_image, "image/png")},
        data={"language": "en"},
    )
    assert response.status_code == 503
    assert "PLANTNET_API_KEY" in response.json()["detail"]


def test_plantnet_result_uses_ranked_species_not_a_fixed_flower(monkeypatch):
    payload = {
        "version": "test-engine",
        "results": [
            {
                "score": 0.91,
                "species": {
                    "scientificNameWithoutAuthor": "Helianthus annuus", "commonNames": ["Sunflower"],
                    "family": {"scientificNameWithoutAuthor": "Asteraceae"},
                    "genus": {"scientificNameWithoutAuthor": "Helianthus"},
                },
                "images": [{"url": {"m": "https://example.com/sunflower.jpg"}}],
            },
            {
                "score": 0.21,
                "species": {
                    "scientificNameWithoutAuthor": "Rudbeckia hirta", "commonNames": ["Black-eyed Susan"],
                    "family": {"scientificNameWithoutAuthor": "Asteraceae"},
                    "genus": {"scientificNameWithoutAuthor": "Rudbeckia"},
                },
                "images": [],
            },
        ],
    }

    class FakeResponse:
        status_code = 200
        headers = {"content-type": "application/json"}

        def json(self):
            return payload

    class FakeClient:
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return None
        async def post(self, *args, **kwargs): return FakeResponse()

    monkeypatch.setattr(plant_service.httpx, "AsyncClient", lambda **kwargs: FakeClient())
    result = asyncio.run(plant_service.identify_with_plantnet(b"image", "image/jpeg", "test-key"))
    assert result["common_name"] == "Sunflower"
    assert result["scientific_name"] == "Helianthus annuus"
    assert result["confidence"] == 0.91
    assert result["alternatives"][0]["common_name"] == "Black-eyed Susan"


def test_exact_name_search_is_saved_to_history(client, auth_headers):
    result = client.post(
        "/api/v1/flowers/search",
        headers=auth_headers,
        json={"query": "Nelumbo nucifera", "language": "en"},
    )
    assert result.status_code == 200
    assert result.json()["slug"] == "lotus"
    history = client.get("/api/v1/users/me/history", headers=auth_headers)
    assert history.status_code == 200
    assert history.json()["items"][0]["scientific_name"] == "Nelumbo nucifera"
