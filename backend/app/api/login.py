"""Proxies email/password sign-in to Supabase so the backend can rate-limit
attempts. The frontend should POST here instead of calling Supabase's
/auth/v1/token endpoint directly for password sign-in; token refresh and
sign-out can keep going straight to Supabase since those aren't brute-force
targets in the same way.
"""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
import httpx

from app.core.supabase_auth_config import SUPABASE_URL
from app.services.rate_limit_service import (
    enforce_not_locked_out,
    get_or_set_device_id,
    record_failed_attempt,
    clear_attempts,
    _client_ip,
)

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/api/auth/login")
def login(body: LoginRequest, request: Request, response: Response):
    device_id = get_or_set_device_id(request, response)
    ip = _client_ip(request)

    enforce_not_locked_out(device_id, ip)

    try:
        resp = httpx.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            json={"email": body.email, "password": body.password},
            headers={"apikey": _supabase_anon_key()},
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        raise HTTPException(502, {"error": "auth_server_unreachable", "message": str(exc)})

    if resp.status_code != 200:
        record_failed_attempt(device_id, ip)
        raise HTTPException(401, {"error": "invalid_credentials", "message": "Incorrect email or password."})

    clear_attempts(device_id, ip)
    return resp.json()


def _supabase_anon_key() -> str:
    import os
    key = os.getenv("SUPABASE_ANON_KEY", "")
    if not key:
        raise HTTPException(500, {"error": "server_misconfigured", "message": "SUPABASE_ANON_KEY not set."})
    return key
