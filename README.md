# BloomSense AI

BloomSense is a flower-intelligence and personal-garden application. It combines a polished public product overview with a distinct authenticated home, multimodal plant discovery, evidence-linked botanical profiles, translation and voice output, garden mapping, care reminders, and longitudinal plant-health records.

**Hosted inspection demo (owner-only ChatGPT Site):** https://bloomsense-ai-demo.kummarayashovardhan.chatgpt.site

## Application modes

| Mode | Authentication | Recognition | Persistence | Intended use |
|---|---|---|---|---|
| Demo (`VITE_DEMO_MODE=true`) | Explicit demo session | On-device CLIP ranker across 67 flower groups | Browser session | UI and workflow inspection without secrets |
| Connected (`VITE_DEMO_MODE=false`) | Email/password JWT + Google Identity | PlantNet API with ranked alternatives | Per-user SQLite records | Single-instance deployment with real provider credentials |

The system never silently falls back to `Rose`. If live recognition is not configured or cannot make a useful match, it returns a clear error and asks for a better photograph or provider setup.

## Architecture

- **Frontend:** React 19, React Router, Vite, Lucide, Google Identity Services, Transformers.js/CLIP, Web Speech APIs.
- **Backend:** FastAPI, signed JWT access and rotating refresh tokens, Google ID-token verification, PlantNet integration, Pillow image validation, SQLite persistence.
- **Delivery:** multi-stage Docker build, Nginx SPA/API gateway, Compose health checks, GitHub Actions.

## Start the complete demo

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:8080`. Demo mode is the safe default and requires no external keys.

For a connected deployment, populate `.env`, change `VITE_DEMO_MODE=false`, and rebuild. Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before exposing it publicly. The detailed recovery findings and remaining limits are in [docs/AUDIT.md](docs/AUDIT.md).

## Local development

```bash
make install
make test
```

Run the API with `backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload` and the frontend with `npm --prefix frontend run dev`.

## Safety boundary

Plant identity and health output is educational decision support. Do not use an image result alone for consumption, medication, toxicity decisions, pesticide treatment, or conservation action. Confirm critical decisions with the linked authority or a qualified local professional.
