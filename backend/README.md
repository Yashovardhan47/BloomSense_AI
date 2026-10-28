# BloomSense API

FastAPI service for JWT sessions, Google Identity token verification, PlantNet-backed plant identification, profile history, translation-provider integration, and persistent garden records.

Run locally from this directory:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

The OpenAPI UI is available at `http://localhost:8000/api/docs` outside production. Copy the root `.env.example` and configure provider credentials before enabling real mode in the frontend.

SQLite is the intentional zero-configuration deployment default. Use a single backend replica and persist `/data`. Migrate the `Store` implementation to PostgreSQL before horizontal scaling.
