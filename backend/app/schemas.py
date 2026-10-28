from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized.count("@") != 1 or "." not in normalized.rsplit("@", 1)[1]:
            raise ValueError("Enter a valid email address")
        return normalized


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleRequest(BaseModel):
    credential: str = Field(min_length=20)


class RefreshRequest(BaseModel):
    refresh_token: str


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=160)
    language: str = Field(default="en", max_length=12)


class TranslateRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=20)
    target: str = Field(min_length=2, max_length=12)
    source: str = Field(default="auto", min_length=2, max_length=12)

    @field_validator("texts")
    @classmethod
    def validate_text_size(cls, value: list[str]) -> list[str]:
        if sum(len(item) for item in value) > 12_000:
            raise ValueError("Translation batch is too large")
        return value


class OpenPayload(BaseModel):
    model_config = ConfigDict(extra="allow")


class GardenCreate(OpenPayload):
    name: str = Field(default="My Garden", min_length=2, max_length=100)


class TaskPayload(OpenPayload):
    title: str = Field(min_length=2, max_length=160)
    details: str = Field(default="", max_length=1000)
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    plant_id: str | None = None


class GardenAnalysisRequest(OpenPayload):
    length_m: float | None = Field(default=None, gt=0, le=10_000)
    width_m: float | None = Field(default=None, gt=0, le=10_000)
