from __future__ import annotations


def test_garden_lifecycle(client, auth_headers, png_image):
    listing = client.get("/api/v1/gardens", headers=auth_headers)
    assert listing.status_code == 200
    garden = listing.json()["items"][0]
    garden_id = garden["id"]

    updated = client.patch(
        f"/api/v1/gardens/{garden_id}",
        headers=auth_headers,
        json={"length_m": 12.5, "width_m": 8.0, "location": "Tirupati"},
    )
    assert updated.status_code == 200
    assert updated.json()["area_m2"] == 100.0

    photo = client.post(
        f"/api/v1/gardens/{garden_id}/photos",
        headers=auth_headers,
        data={"corner": "north"},
        files={"image": ("north.png", png_image, "image/png")},
    )
    assert photo.status_code == 200
    assert photo.json()["captured"] is True

    analyzed = client.post(f"/api/v1/gardens/{garden_id}/analyze", headers=auth_headers, json={})
    assert analyzed.status_code == 200
    assert analyzed.json()["analysis"]["coverage_score"] == 17

    created_plant = client.post(
        f"/api/v1/gardens/{garden_id}/plants",
        headers=auth_headers,
        json={"common_name": "Tulip", "scientific_name": "Tulipa", "slug": "tulip"},
    )
    assert created_plant.status_code == 201
    plant_id = created_plant.json()["id"]
    watered = client.post(f"/api/v1/gardens/{garden_id}/plants/{plant_id}/water", headers=auth_headers)
    assert watered.status_code == 200
    assert watered.json()["last_watered_at"]

    task = client.post(
        f"/api/v1/gardens/{garden_id}/tasks",
        headers=auth_headers,
        json={"title": "Check tulip soil", "details": "Use a finger test", "priority": "high", "plant_id": plant_id},
    )
    assert task.status_code == 201
    completed = client.post(f"/api/v1/gardens/{garden_id}/tasks/{task.json()['id']}/complete", headers=auth_headers)
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
