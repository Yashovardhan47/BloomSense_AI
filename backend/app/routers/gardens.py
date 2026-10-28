from __future__ import annotations

import base64
from datetime import timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from ..dependencies import current_user
from ..garden_defaults import starter_garden
from ..plant_service import normalize_image
from ..schemas import GardenAnalysisRequest, GardenCreate, OpenPayload, TaskPayload
from ..security import iso_now, utcnow


router = APIRouter(prefix="/gardens", tags=["gardens"])
SAFE_GARDEN_FIELDS = {
    "name", "location", "length_m", "width_m", "area_m2", "orientation", "climate",
    "soil_type", "sunlight", "irrigation_method", "notes", "zones", "environment",
}


def _number(value: object, default: float, minimum: float, maximum: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail="Garden measurements and positions must be numbers") from error
    if not minimum <= parsed <= maximum:
        raise HTTPException(status_code=422, detail=f"Numeric value must be between {minimum} and {maximum}")
    return parsed


def _owned(request: Request, user: dict, garden_id: str) -> dict:
    garden = request.app.state.store.garden(user["id"], garden_id)
    if not garden:
        raise HTTPException(status_code=404, detail="Garden not found")
    return garden


def _save(request: Request, user: dict, garden: dict) -> dict:
    return request.app.state.store.save_garden(user["id"], garden, iso_now())


def _find(items: list[dict], item_id: str, label: str) -> dict:
    item = next((value for value in items if value.get("id") == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return item


@router.get("")
def list_gardens(request: Request, user: dict = Depends(current_user)) -> dict:
    items = request.app.state.store.gardens(user["id"])
    if not items:
        garden = starter_garden()
        request.app.state.store.save_garden(user["id"], garden, iso_now(), create=True)
        items = [garden]
    return {"items": items}


@router.post("", status_code=201)
def create_garden(payload: GardenCreate, request: Request, user: dict = Depends(current_user)) -> dict:
    values = payload.model_dump()
    for field in ("length_m", "width_m"):
        if field in values:
            values[field] = _number(values[field], 1, 0.1, 10_000)
    garden = starter_garden(**{key: value for key, value in values.items() if key in SAFE_GARDEN_FIELDS})
    request.app.state.store.save_garden(user["id"], garden, iso_now(), create=True)
    return garden


@router.get("/{garden_id}/dashboard")
def dashboard(garden_id: str, request: Request, user: dict = Depends(current_user)) -> dict:
    return _owned(request, user, garden_id)


@router.patch("/{garden_id}")
def update_garden(garden_id: str, payload: OpenPayload, request: Request, user: dict = Depends(current_user)) -> dict:
    garden = _owned(request, user, garden_id)
    changes = payload.model_dump(exclude_unset=True)
    for field in ("length_m", "width_m"):
        if field in changes:
            changes[field] = _number(changes[field], 1, 0.1, 10_000)
    garden.update({key: value for key, value in changes.items() if key in SAFE_GARDEN_FIELDS})
    if "length_m" in changes or "width_m" in changes:
        garden["area_m2"] = round(float(garden["length_m"]) * float(garden["width_m"]), 2)
    return _save(request, user, garden)


@router.post("/{garden_id}/analyze")
def analyze_garden(garden_id: str, payload: GardenAnalysisRequest, request: Request, user: dict = Depends(current_user)) -> dict:
    garden = _owned(request, user, garden_id)
    changes = payload.model_dump(exclude_unset=True)
    garden.update({key: value for key, value in changes.items() if key in SAFE_GARDEN_FIELDS})
    if changes.get("length_m") and changes.get("width_m"):
        garden["area_m2"] = round(changes["length_m"] * changes["width_m"], 2)
    captured = [slot["corner"] for slot in garden.get("photo_slots", []) if slot.get("captured")]
    missing = [slot["corner"] for slot in garden.get("photo_slots", []) if not slot.get("captured")]
    plants = garden.get("plants", [])
    average = round(sum(float(item.get("health_score") or 0) for item in plants) / max(len(plants), 1))
    recommendations = []
    if missing:
        recommendations.append(f"Capture {', '.join(missing)} views to complete the spatial record.")
    for plant in sorted(plants, key=lambda item: item.get("health_score") or 0)[:2]:
        if (plant.get("health_score") or 0) < 80:
            recommendations.append(f"Inspect {plant.get('nickname') or plant.get('common_name')} and add a current health photo.")
    if not recommendations:
        recommendations.append("Coverage is complete; keep health photos and care actions current.")
    garden["analysis"] = {
        **garden.get("analysis", {}), "coverage_score": round(len(captured) / 6 * 100),
        "captured_views": captured, "missing_views": missing, "mapped_plants": len(plants),
        "average_health": average, "recommendations": recommendations,
    }
    garden.setdefault("timeline", []).insert(0, {"id": str(uuid4()), "type": "scan", "title": "Garden coverage analysed", "detail": f"{len(captured)} of 6 required views are stored.", "at": iso_now()})
    return _save(request, user, garden)


@router.post("/{garden_id}/plants", status_code=201)
def add_plant(garden_id: str, payload: OpenPayload, request: Request, user: dict = Depends(current_user)) -> dict:
    garden = _owned(request, user, garden_id)
    values = payload.model_dump(exclude_unset=True)
    now = utcnow()
    plant = {
        "id": str(uuid4()), "nickname": values.get("nickname") or values.get("common_name") or "New plant",
        "common_name": values.get("common_name") or "Unidentified plant",
        "scientific_name": values.get("scientific_name") or "Identity not confirmed",
        "slug": values.get("slug") or "unidentified", "zone_name": values.get("zone_name") or "Unplaced · map this plant",
        "position_x": _number(values.get("position_x", 50), 50, 0, 100), "position_y": _number(values.get("position_y", 50), 50, 0, 100),
        "watering_interval_days": max(1, round(_number(values.get("watering_interval_days", 3), 3, 1, 365))),
        "health_score": round(_number(values.get("health_score", 0), 0, 0, 100)), "health_status": values.get("health_status", "watch"),
        "hydration": values.get("hydration", "not checked"), "next_water_at": (now + timedelta(days=1)).isoformat(),
        "last_watered_at": None, "hero_image": values.get("hero_image"), "trend": values.get("trend", [0]),
        "signals": values.get("signals", ["Newly added; capture a health baseline"]),
        "action": values.get("action", "Place this plant on the map and create a health baseline"),
    }
    garden.setdefault("plants", []).insert(0, plant)
    _save(request, user, garden)
    return plant


@router.post("/{garden_id}/photos")
async def add_photo(
    garden_id: str, request: Request, corner: str = Form(...), image: UploadFile = File(...),
    user: dict = Depends(current_user),
) -> dict:
    garden = _owned(request, user, garden_id)
    slot = next((item for item in garden.get("photo_slots", []) if item.get("corner") == corner), None)
    if not slot:
        raise HTTPException(status_code=422, detail="Choose one of the six defined garden views")
    try:
        content, media_type = normalize_image(await image.read(), image.content_type or "", min(request.app.state.settings.max_upload_bytes, 3 * 1024 * 1024))
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    slot.update({"image": f"data:{media_type};base64,{base64.b64encode(content).decode()}", "captured": True, "note": image.filename or "Garden view"})
    _save(request, user, garden)
    return slot


@router.post("/{garden_id}/plants/{plant_id}/health-checks")
async def health_check(
    garden_id: str, plant_id: str, request: Request, image: UploadFile = File(...),
    user: dict = Depends(current_user),
) -> dict:
    garden = _owned(request, user, garden_id)
    plant = _find(garden.get("plants", []), plant_id, "Plant")
    try:
        awaitable = image.read()
        normalize_image(await awaitable, image.content_type or "", request.app.state.settings.max_upload_bytes)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    plant["health_status"] = "watch"
    plant["signals"] = ["A new health photo was recorded", "Automated disease diagnosis is not configured; review visible symptoms manually"]
    plant["action"] = "Compare this photo with earlier records and consult a local professional for severe or spreading symptoms"
    plant.setdefault("trend", []).append(plant.get("health_score") or 0)
    plant["trend"] = plant["trend"][-5:]
    garden.setdefault("timeline", []).insert(0, {"id": str(uuid4()), "type": "health", "title": f"Health photo added for {plant['nickname']}", "detail": "Stored as a monitoring event without claiming a disease diagnosis.", "at": iso_now()})
    _save(request, user, garden)
    return plant


@router.post("/{garden_id}/plants/{plant_id}/water")
def mark_watered(garden_id: str, plant_id: str, request: Request, user: dict = Depends(current_user)) -> dict:
    garden = _owned(request, user, garden_id)
    plant = _find(garden.get("plants", []), plant_id, "Plant")
    now = utcnow()
    plant.update({"last_watered_at": now.isoformat(), "next_water_at": (now + timedelta(days=max(1, int(plant.get("watering_interval_days", 3))))).isoformat(), "hydration": "recently watered"})
    for task in garden.get("tasks", []):
        if task.get("plant_id") == plant_id and task.get("task_type") == "water" and task.get("status") != "completed":
            task["status"] = "completed"
    garden.setdefault("timeline", []).insert(0, {"id": str(uuid4()), "type": "water", "title": f"{plant['nickname']} was watered", "detail": "The next reminder was scheduled from this plant's interval.", "at": now.isoformat()})
    _save(request, user, garden)
    return plant


@router.post("/{garden_id}/tasks", status_code=201)
def create_task(garden_id: str, payload: TaskPayload, request: Request, user: dict = Depends(current_user)) -> dict:
    garden = _owned(request, user, garden_id)
    if payload.plant_id:
        _find(garden.get("plants", []), payload.plant_id, "Plant")
    values = payload.model_dump()
    task = {
        **values, "id": str(uuid4()), "task_type": values.get("task_type", "custom"),
        "due_at": values.get("due_at") or (utcnow() + timedelta(days=1)).isoformat(), "status": "pending",
    }
    garden.setdefault("tasks", []).append(task)
    _save(request, user, garden)
    return task


@router.post("/{garden_id}/tasks/{task_id}/complete")
def complete_task(garden_id: str, task_id: str, request: Request, user: dict = Depends(current_user)) -> dict:
    garden = _owned(request, user, garden_id)
    task = _find(garden.get("tasks", []), task_id, "Task")
    task.update({"status": "completed", "completed_at": iso_now()})
    garden.setdefault("timeline", []).insert(0, {"id": str(uuid4()), "type": "care", "title": task["title"], "detail": "Task completed.", "at": iso_now()})
    _save(request, user, garden)
    return task


@router.post("/{garden_id}/tasks/{task_id}/snooze")
def snooze_task(garden_id: str, task_id: str, request: Request, days: int = 1, user: dict = Depends(current_user)) -> dict:
    garden = _owned(request, user, garden_id)
    task = _find(garden.get("tasks", []), task_id, "Task")
    task.update({"status": "pending", "due_at": (utcnow() + timedelta(days=min(max(days, 1), 30))).isoformat()})
    _save(request, user, garden)
    return task
