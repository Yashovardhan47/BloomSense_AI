from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _csv(name: str, default: str) -> tuple[str, ...]:
    return tuple(item.strip().rstrip("/") for item in os.getenv(name, default).split(",") if item.strip())


@dataclass(frozen=True, slots=True)
class Settings:
    environment: str
    database_path: Path
    jwt_secret: str
    access_token_minutes: int
    refresh_token_days: int
    cors_origins: tuple[str, ...]
    google_client_id: str | None
    plantnet_api_key: str | None
    translate_api_url: str | None
    translate_api_key: str | None
    max_upload_bytes: int

    @classmethod
    def from_env(cls) -> "Settings":
        environment = os.getenv("APP_ENV", "development").strip().lower()
        default_db = Path(__file__).resolve().parents[1] / "data" / "bloomsense.db"
        settings = cls(
            environment=environment,
            database_path=Path(os.getenv("DATABASE_PATH", str(default_db))).expanduser().resolve(),
            jwt_secret=os.getenv("JWT_SECRET", "local-development-secret-change-before-production"),
            access_token_minutes=max(5, int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))),
            refresh_token_days=max(1, int(os.getenv("REFRESH_TOKEN_DAYS", "30"))),
            cors_origins=_csv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080"),
            google_client_id=os.getenv("GOOGLE_CLIENT_ID") or None,
            plantnet_api_key=os.getenv("PLANTNET_API_KEY") or None,
            translate_api_url=(os.getenv("TRANSLATE_API_URL") or "").rstrip("/") or None,
            translate_api_key=os.getenv("TRANSLATE_API_KEY") or None,
            max_upload_bytes=max(1024, int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))),
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        if self.environment == "production" and self.jwt_secret.startswith("local-development"):
            raise RuntimeError("JWT_SECRET must be set to a strong random value in production")
        if len(self.jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET must contain at least 32 characters")
