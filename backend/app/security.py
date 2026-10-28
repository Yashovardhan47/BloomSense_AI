from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt


PASSWORD_ITERATIONS = 600_000
JWT_ALGORITHM = "HS256"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utcnow().isoformat()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS)
    return "$".join(
        (
            "pbkdf2_sha256",
            str(PASSWORD_ITERATIONS),
            base64.urlsafe_b64encode(salt).decode(),
            base64.urlsafe_b64encode(digest).decode(),
        )
    )


def verify_password(password: str, encoded: str | None) -> bool:
    if not encoded:
        return False
    try:
        algorithm, iterations, salt_value, expected_value = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(salt_value.encode())
        expected = base64.urlsafe_b64decode(expected_value.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iterations))
        return hmac.compare_digest(actual, expected)
    except (TypeError, ValueError):
        return False


def token_fingerprint(jti: str) -> str:
    return hashlib.sha256(jti.encode()).hexdigest()


def create_token(
    *,
    user_id: str,
    token_type: str,
    secret: str,
    lifetime: timedelta,
) -> tuple[str, str, datetime]:
    now = utcnow()
    expires_at = now + lifetime
    jti = secrets.token_urlsafe(24)
    payload = {
        "sub": user_id,
        "type": token_type,
        "jti": jti,
        "iat": now,
        "exp": expires_at,
        "iss": "bloomsense-api",
        "aud": "bloomsense-web",
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM), jti, expires_at


def decode_token(token: str, secret: str, expected_type: str) -> dict[str, Any]:
    payload = jwt.decode(
        token,
        secret,
        algorithms=[JWT_ALGORITHM],
        audience="bloomsense-web",
        issuer="bloomsense-api",
        options={"require": ["exp", "iat", "sub", "jti", "type"]},
    )
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Incorrect token type")
    return payload
