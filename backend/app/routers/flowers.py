from __future__ import annotations

from copy import deepcopy
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from ..dependencies import current_user
from ..plant_service import (
    SAMPLE_FLOWERS,
    find_sample,
    generic_profile,
    identify_with_plantnet,
    normalize_image,
    sample_result,
    slugify,
    wikipedia_enrich,
)
from ..schemas import SearchRequest, TranslateRequest
from ..security import iso_now


router = APIRouter(tags=["flowers"])


def _save_history(request: Request, user: dict, result: dict) -> None:
    request.app.state.store.add_history({
        "id": str(uuid4()), "user_id": user["id"], "common_name": result["common_name"],
        "scientific_name": result["scientific_name"], "confidence": float(result.get("confidence") or 0),
        "language": result.get("language", "en"), "hero_image": (result.get("images") or [None])[0],
        "result": result, "created_at": iso_now(),
    })


@router.get("/flowers/samples")
def samples() -> dict:
    return {"items": [deepcopy(item) for item in SAMPLE_FLOWERS.values()]}


@router.get("/flowers/samples/{slug}")
def sample(slug: str) -> dict:
    result = sample_result(slug)
    if not result:
        raise HTTPException(status_code=404, detail="Guided sample not found")
    return result


@router.post("/flowers/identify")
async def identify(
    request: Request,
    image: UploadFile = File(...),
    language: str = Form(default="en"),
    user: dict = Depends(current_user),
) -> dict:
    api_key = request.app.state.settings.plantnet_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="Live recognition requires PLANTNET_API_KEY; use demo mode for on-device recognition")
    try:
        content, media_type = normalize_image(
            await image.read(), image.content_type or "application/octet-stream", request.app.state.settings.max_upload_bytes,
        )
        result = await identify_with_plantnet(content, media_type, api_key)
        result = await wikipedia_enrich(result)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (RuntimeError, httpx.HTTPError) as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    result["requested_language"] = language
    _save_history(request, user, result)
    return result


@router.post("/flowers/search")
async def search(payload: SearchRequest, request: Request, user: dict = Depends(current_user)) -> dict:
    result = find_sample(payload.query)
    if not result:
        scientific = " ".join(payload.query.strip().split())
        result = {
            "id": f"search-{slugify(scientific)}", "slug": slugify(scientific), "common_name": scientific,
            "scientific_name": scientific, "family": "Verify with the linked botanical authorities", "genus": scientific.split()[0],
            "confidence": 1.0, "description": "Name-based botanical lookup", "summary": "This profile was opened from a typed or spoken name. Confirm the accepted scientific name before using care or safety guidance.",
            "native_region": "Use linked occurrence records", "bloom_season": "Species and climate dependent",
            "sunlight": "Confirm for the accepted species", "watering": "Confirm for the accepted species",
            "uses": ["Name-based research", "Garden record keeping"], "facts": ["Name lookup is not visual identification"],
            "images": [], "language": "en", "alternatives": [], "needs_confirmation": True,
            "confidence_note": "Exact text lookup; botanical identity still needs independent confirmation.",
            "source": {"recognition": "user-provided name", "knowledge": "linked botanical authorities", "mode": "search"},
        }
        result["deep_profile"] = generic_profile(result)
        result = await wikipedia_enrich(result)
        if not result.get("article_url"):
            raise HTTPException(status_code=404, detail="No exact profile was found; try a common or scientific plant name")
    result["requested_language"] = payload.language
    _save_history(request, user, result)
    return result


@router.post("/flowers/translate")
async def translate(payload: TranslateRequest, request: Request, _: dict = Depends(current_user)) -> dict:
    endpoint = request.app.state.settings.translate_api_url
    if not endpoint:
        raise HTTPException(status_code=503, detail="Translation is not configured; set a LibreTranslate-compatible TRANSLATE_API_URL")
    body: dict = {"q": payload.texts, "source": payload.source, "target": payload.target, "format": "text"}
    if request.app.state.settings.translate_api_key:
        body["api_key"] = request.app.state.settings.translate_api_key
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{endpoint}/translate", json=body)
        response.raise_for_status()
        data = response.json()
    except (httpx.HTTPError, ValueError) as error:
        raise HTTPException(status_code=502, detail="Translation provider is unavailable") from error
    translations = data.get("translatedText") if isinstance(data, dict) else None
    if isinstance(translations, str):
        translations = [translations]
    if not isinstance(translations, list) or len(translations) != len(payload.texts):
        raise HTTPException(status_code=502, detail="Translation provider returned an invalid response")
    return {"translations": translations, "target": payload.target, "provider": "configured translation service"}


@router.get("/users/me/history")
def history(request: Request, user: dict = Depends(current_user)) -> dict:
    return {"items": request.app.state.store.history(user["id"])}
