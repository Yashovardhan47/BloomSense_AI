from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

from .security import utcnow


ROSE_IMAGE = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=86"
SUNFLOWER_IMAGE = "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=1200&q=86"
ORCHID_IMAGE = "https://images.unsplash.com/photo-1566907225472-6f86d4ce7f3b?auto=format&fit=crop&w=1200&q=86"


def _at(*, hours: int = 0, days: int = 0) -> str:
    return (utcnow() + timedelta(hours=hours, days=days)).isoformat()


def starter_garden(name: str = "My Home Garden", **overrides: object) -> dict:
    garden_id = str(uuid4())
    garden = {
        "id": garden_id,
        "name": name,
        "location": "Add your location",
        "length_m": 8.0,
        "width_m": 6.0,
        "area_m2": 48.0,
        "orientation": "East-facing",
        "climate": "Add the local climate and exposure",
        "soil_type": "Mixed garden soil",
        "sunlight": "Measure hours across each zone",
        "irrigation_method": "Manual watering",
        "notes": "Complete the six-view scan to establish your own garden baseline.",
        "environment": {
            "temperature": "Not connected",
            "humidity": "Not connected",
            "soil_moisture": "Add a reading",
            "sunlight_hours": "Add a reading",
            "rain_outlook": "Weather integration not configured",
            "updated": "Awaiting your first scan",
        },
        "analysis": {
            "coverage_score": 0,
            "captured_views": [],
            "missing_views": ["north", "east", "south", "west", "center", "overhead"],
            "mapped_plants": 3,
            "average_health": 83,
            "recommendations": [
                "Capture all six views before relying on the garden map.",
                "Confirm dimensions and place each plant in its actual zone.",
                "Add a fresh health photo whenever visible symptoms change.",
            ],
        },
        "photo_slots": [
            {"corner": corner, "label": label, "image": None, "captured": False, "note": "Photo required"}
            for corner, label in (
                ("north", "North corner"), ("east", "East corner"), ("south", "South corner"),
                ("west", "West corner"), ("center", "Centre view"), ("overhead", "Overhead view"),
            )
        ],
        "zones": [
            {"id": "sun-bed", "name": "Sunny bed", "light": "Full sun", "soil": "Loam", "moisture": 40, "colour": "#c5f171"},
            {"id": "mixed-border", "name": "Mixed border", "light": "Morning sun", "soil": "Compost loam", "moisture": 48, "colour": "#77efa8"},
            {"id": "patio", "name": "Shaded patio", "light": "Bright shade", "soil": "Container media", "moisture": 35, "colour": "#d9a7ff"},
        ],
        "plants": [
            {
                "id": str(uuid4()), "nickname": "Ruby", "common_name": "Rose", "scientific_name": "Rosa",
                "slug": "rose", "zone_name": "Mixed border", "position_x": 22, "position_y": 30,
                "health_score": 90, "health_status": "healthy", "hydration": "balanced",
                "next_water_at": _at(hours=20), "last_watered_at": _at(days=-2), "hero_image": ROSE_IMAGE,
                "trend": [82, 84, 87, 89, 90], "signals": ["Baseline example—replace with your own health photo"],
                "action": "Confirm this example plant or remove it from your mapped garden",
            },
            {
                "id": str(uuid4()), "nickname": "Sunny", "common_name": "Sunflower", "scientific_name": "Helianthus annuus",
                "slug": "sunflower", "zone_name": "Sunny bed", "position_x": 72, "position_y": 28,
                "health_score": 76, "health_status": "watch", "hydration": "check soil",
                "next_water_at": _at(hours=5), "last_watered_at": _at(days=-2), "hero_image": SUNFLOWER_IMAGE,
                "trend": [83, 82, 80, 78, 76], "signals": ["Baseline example—no live diagnosis has been run"],
                "action": "Inspect leaf surfaces and confirm the soil moisture manually",
            },
            {
                "id": str(uuid4()), "nickname": "Pearl", "common_name": "Moth orchid", "scientific_name": "Phalaenopsis",
                "slug": "orchid", "zone_name": "Shaded patio", "position_x": 30, "position_y": 72,
                "health_score": 82, "health_status": "watch", "hydration": "check roots",
                "next_water_at": _at(days=1), "last_watered_at": _at(days=-4), "hero_image": ORCHID_IMAGE,
                "trend": [78, 80, 84, 83, 82], "signals": ["Baseline example—inspect visible roots before watering"],
                "action": "Keep in bright indirect light and avoid water in the crown",
            },
        ],
        "tasks": [],
        "timeline": [
            {
                "id": str(uuid4()), "type": "scan", "title": "Garden workspace created",
                "detail": "Add dimensions, six views, and your own plants to replace the starter examples.", "at": _at(),
            }
        ],
    }
    garden.update({key: value for key, value in overrides.items() if value is not None})
    if "area_m2" not in overrides:
        garden["area_m2"] = round(float(garden["length_m"]) * float(garden["width_m"]), 2)
    return garden
