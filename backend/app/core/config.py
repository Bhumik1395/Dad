import os

VALKEY_URL = os.getenv("VALKEY_URL", "redis://localhost:6379")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "3600"))
FISCAL_YEAR_START_MONTH = int(os.getenv("FISCAL_YEAR_START_MONTH", "4"))