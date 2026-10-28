from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings
from .database import Store
from .routers import auth, flowers, gardens


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings or Settings.from_env()
    store = Store(resolved.database_path)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        store.initialize()
        yield

    app = FastAPI(
        title="BloomSense AI API",
        version="3.2.0",
        description="Authentication, live plant recognition, research profiles, and personal garden records.",
        docs_url="/api/docs" if resolved.environment != "production" else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if resolved.environment != "production" else None,
        lifespan=lifespan,
    )
    app.state.settings = resolved
    app.state.store = store
    app.state.auth_attempts = defaultdict(deque)
    app.state.rate_lock = threading.Lock()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(resolved.cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    )

    @app.middleware("http")
    async def security_and_rate_limit(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid4()))[:128]
        if request.method == "POST" and request.url.path in {
            "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/google", "/api/v1/auth/refresh",
        }:
            # Nginx overwrites X-Real-IP before proxying; do not trust the
            # client-controlled first entry of X-Forwarded-For for throttling.
            proxy_client = request.headers.get("x-real-ip", "").strip()
            client = proxy_client or (request.client.host if request.client else "unknown")
            key = f"{client}:{request.url.path}"
            now = time.monotonic()
            with app.state.rate_lock:
                attempts = app.state.auth_attempts[key]
                while attempts and now - attempts[0] > 600:
                    attempts.popleft()
                if len(attempts) >= 30:
                    return JSONResponse(
                        {"detail": "Too many authentication requests; try again shortly"},
                        status_code=429,
                        headers={"Retry-After": "600", "X-Request-ID": request_id},
                    )
                attempts.append(now)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=()"
        if resolved.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    @app.get("/api/v1/health", tags=["operations"])
    def health() -> dict:
        return {"status": "ok", "service": "bloomsense-api", "version": app.version}

    @app.get("/api/v1/ready", tags=["operations"])
    def ready() -> dict:
        store.one("SELECT 1 AS ready")
        return {
            "status": "ready",
            "database": "connected",
            "plantnet": "configured" if resolved.plantnet_api_key else "not configured",
            "google_oauth": "configured" if resolved.google_client_id else "not configured",
            "translation": "configured" if resolved.translate_api_url else "not configured",
        }

    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(flowers.router, prefix="/api/v1")
    app.include_router(gardens.router, prefix="/api/v1")
    return app


app = create_app()
