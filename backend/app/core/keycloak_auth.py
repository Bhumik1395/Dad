"""Keycloak access-token verification.

The frontend authenticates against Keycloak directly (authorization code +
PKCE, public client -- no client secret exists to leak) and sends the
resulting access token as `Authorization: Bearer <token>` on every API call
to the new PM endpoints. We verify the signature against Keycloak's JWKS and
pull `realm_access.roles` and the custom `company` attribute out of the
claims.

This is intentionally separate from the existing `session_id` cookie
mechanism used by the Service Call flow (see cache_service.py) -- that one
stays untouched. This module only guards the new /api/pm/* routes.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

from app.core.auth_config import KEYCLOAK_CLIENT_ID, KEYCLOAK_ISSUER, KEYCLOAK_JWKS_URL

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}
_JWKS_TTL_SECONDS = 3600


def _get_jwks() -> dict:
    now = time.time()
    if _jwks_cache["keys"] is None or (now - _jwks_cache["fetched_at"]) > _JWKS_TTL_SECONDS:
        resp = httpx.get(KEYCLOAK_JWKS_URL, timeout=5.0)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


@dataclass
class CurrentUser:
    sub: str
    username: str
    roles: list[str] = field(default_factory=list)
    company: str | None = None  # only set for "customer" role users

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
            _jwks_cache["keys"] = None  # JWKS may have rotated; force one refresh
            jwks = _get_jwks()
            key = next((k for k in jwks["keys"] if k["kid"] == unverified_header.get("kid")), None)
        if key is None:
            raise HTTPException(401, {"error": "unknown_signing_key"})

        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=KEYCLOAK_ISSUER,
            options={"verify_aud": False},  # public client: check azp instead of aud
        )
        if claims.get("azp") != KEYCLOAK_CLIENT_ID:
            raise HTTPException(401, {"error": "wrong_audience", "message": "Token not issued for this client"})
        return claims
    except JWTError as exc:
        raise HTTPException(401, {"error": "invalid_token", "message": str(exc)}) from exc


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, {"error": "missing_token"})

    claims = _decode_token(creds.credentials)
    roles = claims.get("realm_access", {}).get("roles", [])
    company = claims.get("company")

    if "customer" in roles and not company:
        # Fail closed: a customer account with no company attribute should
        # never fall through to seeing everyone's data.
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            {"error": "no_company", "message": "This account has no company assigned. Contact your admin."},
        )

    return CurrentUser(
        sub=claims["sub"],
        username=claims.get("preferred_username", claims["sub"]),
        roles=roles,
        company=company,
    )


def require_roles(*allowed: str):
    """Dependency factory: caller must have at least one of `allowed` roles."""

    async def _check(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not any(r in user.roles for r in allowed):
            raise HTTPException(status.HTTP_403_FORBIDDEN, {"error": "insufficient_role"})
        return user

    return _check
