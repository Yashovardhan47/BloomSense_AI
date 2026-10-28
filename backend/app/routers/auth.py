from __future__ import annotations

import sqlite3
from datetime import timedelta
from uuid import uuid4

import jwt
from fastapi import APIRouter, HTTPException, Request, Response, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from ..dependencies import public_user
from ..schemas import GoogleRequest, LoginRequest, RefreshRequest, RegisterRequest
from ..security import create_token, decode_token, hash_password, iso_now, token_fingerprint, verify_password


router = APIRouter(prefix="/auth", tags=["authentication"])


def _tokens(request: Request, user: dict) -> tuple[dict, str, str]:
    settings = request.app.state.settings
    access, _, _ = create_token(
        user_id=user["id"], token_type="access", secret=settings.jwt_secret,
        lifetime=timedelta(minutes=settings.access_token_minutes),
    )
    refresh, refresh_jti, refresh_expires = create_token(
        user_id=user["id"], token_type="refresh", secret=settings.jwt_secret,
        lifetime=timedelta(days=settings.refresh_token_days),
    )
    payload = {
        "access_token": access,
        "refresh_token": refresh,
        "expires_in": settings.access_token_minutes * 60,
        "token_type": "bearer",
        "user": public_user(user),
    }
    return payload, refresh_jti, refresh_expires.isoformat()


def _issue_session(request: Request, user: dict) -> dict:
    payload, refresh_jti, refresh_expires = _tokens(request, user)
    request.app.state.store.create_refresh_session(
        token_fingerprint(refresh_jti), user["id"], refresh_expires, iso_now(),
    )
    return payload


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request) -> dict:
    store = request.app.state.store
    if store.user_by_email(payload.email):
        raise HTTPException(status_code=409, detail="An account already exists for this email")
    now = iso_now()
    try:
        user = store.create_user({
            "id": str(uuid4()), "name": payload.name.strip(), "email": payload.email,
            "password_hash": hash_password(payload.password), "provider": "password",
            "google_sub": None, "avatar_url": None, "created_at": now,
        })
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=409, detail="An account already exists for this email") from error
    return _issue_session(request, user)


@router.post("/login")
def login(payload: LoginRequest, request: Request) -> dict:
    user = request.app.state.store.user_by_email(payload.email.strip().lower())
    if not user or not verify_password(payload.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return _issue_session(request, user)


@router.post("/google")
def google_login(payload: GoogleRequest, request: Request) -> dict:
    client_id = request.app.state.settings.google_client_id
    if not client_id:
        raise HTTPException(status_code=503, detail="Google authentication is not configured on the server")
    try:
        claims = id_token.verify_oauth2_token(payload.credential, google_requests.Request(), client_id)
    except ValueError as error:
        raise HTTPException(status_code=401, detail="Google could not verify this sign-in") from error
    if not claims.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google account email is not verified")
    subject = str(claims["sub"])
    email = str(claims["email"]).strip().lower()
    store = request.app.state.store
    user = store.user_by_google_sub(subject)
    if not user:
        user = store.user_by_email(email)
        if user:
            try:
                user = store.link_google(user["id"], subject, claims.get("picture"))
            except sqlite3.IntegrityError as error:
                raise HTTPException(status_code=409, detail="This Google account is already linked") from error
        else:
            user = store.create_user({
                "id": str(uuid4()), "name": claims.get("name") or email.split("@", 1)[0], "email": email,
                "password_hash": None, "provider": "google", "google_sub": subject,
                "avatar_url": claims.get("picture"), "created_at": iso_now(),
            })
    return _issue_session(request, user)


@router.post("/refresh")
def refresh(payload: RefreshRequest, request: Request) -> dict:
    try:
        claims = decode_token(payload.refresh_token, request.app.state.settings.jwt_secret, "refresh")
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token") from error
    user = request.app.state.store.user_by_id(str(claims["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    response, new_jti, new_expiry = _tokens(request, user)
    rotated = request.app.state.store.rotate_refresh_session(
        token_fingerprint(str(claims["jti"])),
        (token_fingerprint(new_jti), user["id"], new_expiry, iso_now()),
        iso_now(),
    )
    if not rotated:
        raise HTTPException(status_code=401, detail="Refresh token was already used or revoked")
    return response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, request: Request) -> Response:
    try:
        claims = decode_token(payload.refresh_token, request.app.state.settings.jwt_secret, "refresh")
        request.app.state.store.revoke_refresh_session(token_fingerprint(str(claims["jti"])), iso_now())
    except jwt.PyJWTError:
        pass
    return Response(status_code=status.HTTP_204_NO_CONTENT)
