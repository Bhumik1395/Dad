"""Supabase Auth verification.

Supabase issues a JWT after email/password sign-in. We verify it against
Supabase's own JWKS endpoint (works as long as the project uses the modern
asymmetric signing keys -- new Supabase projects default to this; if yours
is an older project still on the legacy shared-secret (HS256) scheme,
rotate to asymmetric keys under Project Settings -> Auth -> JWT Keys first).

We don't ask Supabase who's an "employee" vs a "customer" -- that's derived
from the email's domain (everything after @) via domain_directory.py, which
you edit by hand. This means onboarding a whole company is one line, not
one line per person.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

from app.core.supabase_auth_config import SUPABASE_ISSUER, SUPABASE_JWKS_URL
from app.core.domain_directory import look_up_domain

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}
_JWKS_TTL_SECONDS = 3600


def _get_jwks() -> dict:
    now = time.time()
    if _jwks_cache["keys"] is None or (now - _jwks_cache["fetched_at"]) > _JWKS_TTL_SECONDS:
        resp = httpx.get(SUPABASE_JWKS_URL, timeout=5.0)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


@dataclass
class CurrentUser:
    sub: str
    username: str  # email
    roles: list[str] = field(default_factory=list)
    company: str | None = None

    @property
    def is_corob_employee(self) -> bool:
        return "corob_employee" in self.roles

    @property
    def is_customer(self) -> bool:
        return "customer" in self.roles


def _decode_token(token: str) -> dict:
    try:
        jwks = _get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == unverified_header.get("kid")), None)
        if key is None:
            _jwks_cache["keys"] = None
            jwks = _get_jwks()
            key = next((k for k in jwks["keys"] if k["kid"] == unverified_header.get("kid")), None)
        if key is None:
            raise HTTPException(401, {"error": "unknown_signing_key"})

        return jwt.decode(
            token,
            key,
            algorithms=[key.get("alg", "ES256")],
            issuer=SUPABASE_ISSUER,
            audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(401, {"error": "invalid_token", "message": str(exc)}) from exc


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, {"error": "missing_token"})

    claims = _decode_token(creds.credentials)
    email = claims.get("email", "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, {"error": "no_email"})

    domain = email.split("@", 1)[1]
    entry = look_up_domain(domain)
    if entry is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            {"error": "domain_not_authorized", "message": f"{domain} isn't set up for access yet. Contact your admin."},
        )

    return CurrentUser(
        sub=claims["sub"],
        username=email,
        roles=[entry["role"]],
        company=entry.get("company"),
    )


def require_roles(*allowed: str):
    async def _check(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not any(r in user.roles for r in allowed):
            raise HTTPException(status.HTTP_403_FORBIDDEN, {"error": "insufficient_role"})
        return user

    return _check
