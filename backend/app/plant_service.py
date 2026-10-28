from __future__ import annotations

import io
import re
from copy import deepcopy
from typing import Any
from urllib.parse import quote

import httpx
from PIL import Image, UnidentifiedImageError


SAMPLE_FLOWERS: dict[str, dict[str, Any]] = {
    "rose": {
        "slug": "rose", "common_name": "Rose", "scientific_name": "Rosa", "family": "Rosaceae", "genus": "Rosa",
        "confidence": 1.0, "description": "Flowering shrub · Rosaceae family",
        "summary": "Roses are woody flowering plants with extraordinary species and cultivar diversity. Identification below genus level needs leaves, prickles, hips, origin, and cultivar context—not petals alone.",
        "native_region": "Mostly temperate and subtropical Northern Hemisphere", "bloom_season": "Spring through autumn; cultivar dependent",
        "sunlight": "Usually at least six hours of direct sun", "watering": "Water deeply at soil level when the upper soil begins to dry",
        "uses": ["Ornamental gardens", "Perfumery", "Culinary rose water", "Pollinator habitat"],
        "facts": ["The fleshy fruit is called a rose hip", "Wild roses generally have five petals"],
        "images": ["https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1400&q=88"],
    },
    "sunflower": {
        "slug": "sunflower", "common_name": "Sunflower", "scientific_name": "Helianthus annuus", "family": "Asteraceae", "genus": "Helianthus",
        "confidence": 1.0, "description": "Annual flowering plant · Asteraceae family",
        "summary": "A sunflower head is a composite inflorescence made of many ray and disc florets. Young plants track the sun; mature heads commonly face east.",
        "native_region": "North America", "bloom_season": "Summer to early autumn", "sunlight": "Full sun",
        "watering": "Water deeply while establishing; avoid chronically waterlogged soil",
        "uses": ["Edible seeds", "Cooking oil", "Pollinator habitat", "Ornamental planting"],
        "facts": ["One head can contain hundreds of florets", "It was domesticated in North America"],
        "images": ["https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=1400&q=88"],
    },
    "lotus": {
        "slug": "lotus", "common_name": "Sacred lotus", "scientific_name": "Nelumbo nucifera", "family": "Nelumbonaceae", "genus": "Nelumbo",
        "confidence": 1.0, "description": "Aquatic perennial · Nelumbonaceae family",
        "summary": "Sacred lotus is a rhizomatous aquatic perennial whose leaves and flowers rise above the water. Its water-repellent leaves inspired the term lotus effect.",
        "native_region": "Asia to northern Australia", "bloom_season": "Warm summer months", "sunlight": "Full sun above warm, still water",
        "watering": "Grow in heavy aquatic media under an appropriate depth of clean water",
        "uses": ["Water gardens", "Cultural ceremonies", "Food crops", "Pollinator habitat"],
        "facts": ["Leaves are strongly water repellent", "Rhizomes and seeds are used in several cuisines"],
        "images": ["https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?auto=format&fit=crop&w=1400&q=88"],
    },
    "orchid": {
        "slug": "orchid", "common_name": "Moth orchid", "scientific_name": "Phalaenopsis", "family": "Orchidaceae", "genus": "Phalaenopsis",
        "confidence": 1.0, "description": "Tropical epiphyte · Orchidaceae family",
        "summary": "Moth orchids are tropical epiphytes with long-lived bilateral flowers and aerial roots covered in absorbent velamen. Many household plants are complex hybrids.",
        "native_region": "South and Southeast Asia to northern Australia", "bloom_season": "Often winter to spring indoors",
        "sunlight": "Bright indirect light", "watering": "Water after most visible roots turn silvery and the medium approaches dry",
        "uses": ["Indoor ornament", "Floral display", "Conservation education"],
        "facts": ["Orchid seeds are dust-like", "Wild orchids should never be collected illegally"],
        "images": ["https://images.unsplash.com/photo-1566907225472-6f86d4ce7f3b?auto=format&fit=crop&w=1400&q=88"],
    },
}

ALIASES = {
    "rosa": "rose", "roses": "rose", "helianthus annuus": "sunflower", "sun flower": "sunflower",
    "nelumbo nucifera": "lotus", "sacred lotus": "lotus", "phalaenopsis": "orchid", "moth orchid": "orchid",
}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "plant"


def references(scientific_name: str) -> list[dict[str, str]]:
    query = quote(scientific_name)
    return [
        {"label": "Kew Plants of the World Online", "scope": "Accepted names, taxonomy, and distribution", "url": f"https://powo.science.kew.org/results?q={query}"},
        {"label": "GBIF", "scope": "Biodiversity records and global occurrence", "url": f"https://www.gbif.org/species/search?q={query}"},
        {"label": "iNaturalist", "scope": "Community observations and visual context", "url": f"https://www.inaturalist.org/taxa/search?q={query}"},
        {"label": "Wikimedia Commons", "scope": "Reference imagery with per-file licences", "url": f"https://commons.wikimedia.org/w/index.php?search={query}&title=Special:MediaSearch&type=image"},
    ]


def generic_profile(flower: dict[str, Any]) -> dict[str, Any]:
    scientific = flower["scientific_name"]
    return {
        "taxonomy": {"kingdom": "Plantae", "family": flower.get("family", "Confirm with an authority"), "genus": flower.get("genus", scientific.split()[0]), "species": scientific},
        "growth": {"life_cycle": "Species or cultivar dependent", "growth_habit": "Confirm after species-level identification", "mature_height": "Use a regional botanical source", "mature_spread": "Use a regional botanical source", "growth_rate": "Climate dependent", "hardiness": "Check a current regional source"},
        "morphology": {"leaves": "Compare arrangement, margins, venation, and surface with an identification key", "flowers": "Confirm symmetry, petal or tepal count, reproductive structures, and inflorescence", "fruit": "Fruit and seed characters often separate look-alike species", "roots": "A flower photograph does not establish root form"},
        "care": {"soil": "Confirm the exact species and local conditions", "ph": "Species specific", "temperature": "Species and cultivar specific", "humidity": "Provide airflow and verify species needs", "fertilizer": "Use a soil test and species guidance", "pruning": "Confirm growth habit and flowering cycle first", "propagation": "Consult a species-level horticultural reference"},
        "health": {"common_pests": ["Inspect leaf undersides, stems, buds, soil, and roots"], "common_diseases": ["Visual symptoms can overlap across disease and environmental stress"], "warning_signs": ["Rapid wilt", "Spreading lesions", "Root collapse", "Severe pest activity"], "prevention": ["Use clean tools", "Avoid chronic overwatering", "Provide airflow", "Quarantine affected plants"]},
        "safety": {"toxicity": "Unknown until the exact species is independently confirmed", "pets": "Keep away from pets until toxicity is verified", "humans": "Avoid sap and use gloves if sensitivity is possible", "edible": "Never consume a plant based only on image recognition", "allergy_note": "Pollen, fragrance, and sap reactions vary"},
        "ecology": {"habitat": "Use the linked occurrence records for verified distribution", "pollinators": ["Relationships vary by species and region"], "wildlife_value": "Confirm with a local biodiversity authority", "invasiveness": "Check the current regional invasive-species list", "conservation": "Consult accepted-name and occurrence sources"},
        "culture": {"symbolism": "Meanings differ across places and traditions", "etymology": f"Research the accepted name {scientific}", "history": "Use the linked sources as an independently verifiable starting point", "traditional_uses": ["Do not infer edible or medicinal use from a visual match"]},
        "references": references(scientific),
        "last_reviewed": "2026-10-27",
        "data_note": "Recognition is probabilistic. Verify identity, toxicity, edibility, treatment, and conservation decisions with an independent botanical authority or local professional.",
    }


def sample_result(slug: str) -> dict[str, Any] | None:
    flower = SAMPLE_FLOWERS.get(slug)
    if not flower:
        return None
    result = deepcopy(flower)
    result.update({"id": f"sample-{slug}", "language": "en", "alternatives": [], "needs_confirmation": False})
    result["deep_profile"] = generic_profile(result)
    result["source"] = {"recognition": "curated guided sample", "knowledge": "BloomSense safeguards and linked botanical authorities", "mode": "demo"}
    return result


def find_sample(query: str) -> dict[str, Any] | None:
    normalized = " ".join(query.lower().strip().split())
    slug = ALIASES.get(normalized, slugify(normalized))
    return sample_result(slug)


def normalize_image(content: bytes, media_type: str, max_bytes: int) -> tuple[bytes, str]:
    if len(content) > max_bytes:
        raise ValueError(f"Image exceeds the {max_bytes // (1024 * 1024)} MB upload limit")
    if media_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise ValueError("Use a JPEG, PNG, or WebP image")
    try:
        with Image.open(io.BytesIO(content)) as image:
            actual_format = image.format
            image.verify()
        with Image.open(io.BytesIO(content)) as image:
            if actual_format not in {"JPEG", "PNG", "WEBP"}:
                raise ValueError("The file contents are not JPEG, PNG, or WebP")
            if image.width < 160 or image.height < 160:
                raise ValueError("Image is too small; use at least 160 × 160 pixels")
            if image.width * image.height > 40_000_000:
                raise ValueError("Image dimensions are too large")
            if actual_format == "WEBP":
                output = io.BytesIO()
                image.convert("RGB").save(output, format="JPEG", quality=92)
                return output.getvalue(), "image/jpeg"
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise ValueError("The uploaded file is not a valid image") from error
    return content, "image/png" if actual_format == "PNG" else "image/jpeg"


def _plantnet_name(species: dict[str, Any]) -> tuple[str, str, str, str]:
    scientific = species.get("scientificNameWithoutAuthor") or species.get("scientificName") or "Unresolved plant"
    common_names = species.get("commonNames") or []
    common = common_names[0] if common_names else scientific
    family_data = species.get("family") or {}
    genus_data = species.get("genus") or {}
    family = family_data.get("scientificNameWithoutAuthor") or family_data.get("scientificName") or "Family not returned"
    genus = genus_data.get("scientificNameWithoutAuthor") or genus_data.get("scientificName") or scientific.split()[0]
    return common, scientific, family, genus


def _related_images(items: list[dict[str, Any]]) -> list[str]:
    output: list[str] = []
    for item in items[:4]:
        for image in item.get("images") or []:
            urls = image.get("url") or {}
            value = urls.get("m") or urls.get("o") or urls.get("s")
            if value and value not in output:
                output.append(value)
    return output[:8]


async def identify_with_plantnet(content: bytes, media_type: str, api_key: str) -> dict[str, Any]:
    params = {"api-key": api_key, "lang": "en", "include-related-images": "true", "nb-results": 5}
    files = {"images": ("flower.png" if media_type == "image/png" else "flower.jpg", content, media_type)}
    data = {"organs": "flower"}
    async with httpx.AsyncClient(timeout=45, follow_redirects=True) as client:
        response = await client.post("https://my-api.plantnet.org/v2/identify/all", params=params, data=data, files=files)
    if response.status_code in {401, 403}:
        raise RuntimeError("PlantNet rejected the configured API key")
    if response.status_code == 429:
        raise RuntimeError("PlantNet identification quota is exhausted; try again later")
    if response.status_code >= 400:
        detail = response.json().get("message") if response.headers.get("content-type", "").startswith("application/json") else None
        raise RuntimeError(detail or f"PlantNet identification failed ({response.status_code})")
    payload = response.json()
    items = payload.get("results") or []
    if not items:
        raise ValueError("No plant match was returned. Use a clear close-up and include leaves when possible.")
    top = items[0]
    top_score = float(top.get("score") or 0)
    runner_score = float(items[1].get("score") or 0) if len(items) > 1 else 0
    common, scientific, family, genus = _plantnet_name(top.get("species") or {})
    result = {
        "id": f"live-{slugify(scientific)}", "slug": slugify(scientific), "common_name": common,
        "scientific_name": scientific, "family": family, "genus": genus, "confidence": top_score,
        "description": f"PlantNet visual candidate · {family}",
        "summary": f"The uploaded image most closely matches {common} ({scientific}). Compare the alternatives and verify diagnostic structures before relying on this identity.",
        "native_region": "Open the linked biodiversity records for verified distribution",
        "bloom_season": "Varies by species, cultivar, and climate", "sunlight": "Confirm after species-level verification",
        "watering": "Confirm after species-level verification", "uses": ["Botanical identification", "Garden record keeping", "Further reference research"],
        "facts": ["An image match is evidence, not a definitive taxonomic determination"],
        "images": _related_images(items), "language": "en",
        "needs_confirmation": top_score < 0.5 or top_score - runner_score < 0.08,
        "confidence_note": "PlantNet confidence is model output, not a guarantee of identity.",
        "alternatives": [],
        "source": {"recognition": f"PlantNet engine {payload.get('version', 'current')}", "knowledge": "BloomSense safeguards and linked botanical authorities", "mode": "live"},
    }
    for item in items[1:5]:
        alt_common, alt_scientific, _, _ = _plantnet_name(item.get("species") or {})
        result["alternatives"].append({"slug": slugify(alt_scientific), "common_name": alt_common, "scientific_name": alt_scientific, "confidence": float(item.get("score") or 0)})
    result["deep_profile"] = generic_profile(result)
    return result


async def wikipedia_enrich(result: dict[str, Any]) -> dict[str, Any]:
    term = quote(result["scientific_name"], safe="")
    headers = {"Accept": "application/json", "User-Agent": "BloomSenseAI/3.2 (educational botanical assistant)"}
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=True, headers=headers) as client:
            response = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{term}")
        if response.status_code != 200:
            return result
        article = response.json()
        image = (article.get("originalimage") or article.get("thumbnail") or {}).get("source")
        enriched = deepcopy(result)
        enriched["description"] = article.get("description") or result["description"]
        enriched["summary"] = article.get("extract") or result["summary"]
        enriched["article_url"] = ((article.get("content_urls") or {}).get("desktop") or {}).get("page")
        enriched["images"] = list(dict.fromkeys([*result.get("images", []), image] if image else result.get("images", [])))
        enriched["source"]["knowledge"] = "Wikipedia summary plus linked botanical authorities"
        return enriched
    except (httpx.HTTPError, ValueError):
        return result
