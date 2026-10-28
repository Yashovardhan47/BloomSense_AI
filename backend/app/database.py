from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT,
    provider TEXT NOT NULL,
    google_sub TEXT UNIQUE,
    avatar_url TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS refresh_sessions (
    jti_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS flower_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    common_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    confidence REAL NOT NULL,
    language TEXT NOT NULL,
    hero_image TEXT,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_history_user_created ON flower_history(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS gardens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gardens_user_updated ON gardens(user_id, updated_at DESC);
"""


class Store:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._write_lock = threading.RLock()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=15, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        return connection

    def initialize(self) -> None:
        with self._write_lock, self.connect() as connection:
            connection.executescript(SCHEMA)

    def one(self, sql: str, values: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        with self.connect() as connection:
            row = connection.execute(sql, values).fetchone()
        return dict(row) if row else None

    def all(self, sql: str, values: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        with self.connect() as connection:
            return [dict(row) for row in connection.execute(sql, values).fetchall()]

    def execute(self, sql: str, values: tuple[Any, ...] = ()) -> None:
        with self._write_lock, self.connect() as connection:
            connection.execute(sql, values)
            connection.commit()

    def create_user(self, user: dict[str, Any]) -> dict[str, Any]:
        self.execute(
            """INSERT INTO users
            (id, name, email, password_hash, provider, google_sub, avatar_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user["id"], user["name"], user["email"], user.get("password_hash"),
                user["provider"], user.get("google_sub"), user.get("avatar_url"), user["created_at"],
            ),
        )
        return self.user_by_id(user["id"]) or user

    def user_by_id(self, user_id: str) -> dict[str, Any] | None:
        return self.one("SELECT * FROM users WHERE id = ?", (user_id,))

    def user_by_email(self, email: str) -> dict[str, Any] | None:
        return self.one("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email,))

    def user_by_google_sub(self, subject: str) -> dict[str, Any] | None:
        return self.one("SELECT * FROM users WHERE google_sub = ?", (subject,))

    def link_google(self, user_id: str, subject: str, avatar_url: str | None) -> dict[str, Any]:
        self.execute(
            "UPDATE users SET google_sub = ?, avatar_url = COALESCE(?, avatar_url) WHERE id = ?",
            (subject, avatar_url, user_id),
        )
        return self.user_by_id(user_id) or {}

    def create_refresh_session(self, jti_hash: str, user_id: str, expires_at: str, created_at: str) -> None:
        self.execute(
            "INSERT INTO refresh_sessions (jti_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (jti_hash, user_id, expires_at, created_at),
        )

    def rotate_refresh_session(self, old_hash: str, new_session: tuple[str, str, str, str], now: str) -> bool:
        new_hash, user_id, expires_at, created_at = new_session
        with self._write_lock, self.connect() as connection:
            cursor = connection.execute(
                """UPDATE refresh_sessions SET revoked_at = ?
                WHERE jti_hash = ? AND revoked_at IS NULL AND expires_at > ?""",
                (now, old_hash, now),
            )
            if cursor.rowcount != 1:
                connection.rollback()
                return False
            connection.execute(
                "INSERT INTO refresh_sessions (jti_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
                (new_hash, user_id, expires_at, created_at),
            )
            connection.commit()
            return True

    def revoke_refresh_session(self, jti_hash: str, now: str) -> None:
        self.execute(
            "UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, ?) WHERE jti_hash = ?",
            (now, jti_hash),
        )

    def add_history(self, item: dict[str, Any]) -> None:
        self.execute(
            """INSERT INTO flower_history
            (id, user_id, common_name, scientific_name, confidence, language, hero_image, result_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item["id"], item["user_id"], item["common_name"], item["scientific_name"],
                item["confidence"], item["language"], item.get("hero_image"),
                json.dumps(item["result"], ensure_ascii=False), item["created_at"],
            ),
        )

    def history(self, user_id: str, limit: int = 50) -> list[dict[str, Any]]:
        rows = self.all(
            """SELECT id, common_name, scientific_name, confidence, language, hero_image,
            result_json, created_at FROM flower_history WHERE user_id = ?
            ORDER BY created_at DESC LIMIT ?""",
            (user_id, limit),
        )
        for row in rows:
            row["result"] = json.loads(row.pop("result_json"))
        return rows

    def save_garden(self, user_id: str, garden: dict[str, Any], now: str, *, create: bool = False) -> dict[str, Any]:
        payload = json.dumps(garden, ensure_ascii=False)
        if create:
            self.execute(
                """INSERT INTO gardens (id, user_id, name, data_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (garden["id"], user_id, garden["name"], payload, now, now),
            )
        else:
            self.execute(
                """UPDATE gardens SET name = ?, data_json = ?, updated_at = ?
                WHERE id = ? AND user_id = ?""",
                (garden["name"], payload, now, garden["id"], user_id),
            )
        return garden

    def gardens(self, user_id: str) -> list[dict[str, Any]]:
        rows = self.all("SELECT data_json FROM gardens WHERE user_id = ? ORDER BY updated_at DESC", (user_id,))
        return [json.loads(row["data_json"]) for row in rows]

    def garden(self, user_id: str, garden_id: str) -> dict[str, Any] | None:
        row = self.one("SELECT data_json FROM gardens WHERE id = ? AND user_id = ?", (garden_id, user_id))
        return json.loads(row["data_json"]) if row else None
