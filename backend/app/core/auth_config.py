import os

KEYCLOAK_BASE_URL = os.getenv("KEYCLOAK_BASE_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "corob")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "corob-frontend")

KEYCLOAK_JWKS_URL = f"{KEYCLOAK_BASE_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
KEYCLOAK_ISSUER = f"{KEYCLOAK_BASE_URL}/realms/{KEYCLOAK_REALM}"

# How long PM data stays cached per company in Valkey before it needs to be
# re-uploaded. Unlike the 1hr anonymous session TTL used for the Service
# Call flow, this is meant to persist across logins, so it defaults much
# longer. Re-uploading (or any dashboard read, see pm_cache_service.py)
# refreshes the TTL.
PM_DATA_TTL_SECONDS = int(os.getenv("PM_DATA_TTL_SECONDS", str(60 * 60 * 24 * 30)))  # 30 days
