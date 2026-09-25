"""Replaces the Redis-backed parts of app/services/rate_limit_service.py.
get_or_set_device_id and _client_ip are unchanged (pure cookie/header logic) —
copy those two functions over as-is. This file replaces enforce_not_locked_out,
record_failed_attempt, and clear_attempts.
"""
from datetime import datetime, timedelta

from fastapi import HTTPException, status

from app.core.db import get_connection

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 15 * 60
LOCKOUT_SECONDS = 30 * 60


def _key(device_id: str, ip: str) -> str:
    return f"{device_id}:{ip}"


def enforce_not_locked_out(device_id: str, ip: str) -> None:
    key = _key(device_id, ip)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT locked_until FROM login_attempts WHERE device_ip_key = %s",
                (key,),
            )
            row = cur.fetchone()

    if row and row["locked_until"] and row["locked_until"] > datetime.utcnow():
        remaining = int((row["locked_until"] - datetime.utcnow()).total_seconds())
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            {
                "error": "too_many_attempts",
                "message": f"Too many failed sign-in attempts. Try again in {remaining // 60 + 1} minute(s).",
                "retry_after_seconds": remaining,
            },
        )


def record_failed_attempt(device_id: str, ip: str) -> None:
    key = _key(device_id, ip)
    now = datetime.utcnow()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT attempts, window_expires_at FROM login_attempts WHERE device_ip_key = %s FOR UPDATE",
                (key,),
            )
            row = cur.fetchone()

            if row is None or (row["window_expires_at"] and row["window_expires_at"] < now):
                # first attempt, or previous window expired -> reset
                attempts = 1
                window_expires_at = now + timedelta(seconds=WINDOW_SECONDS)
            else:
                attempts = row["attempts"] + 1
                window_expires_at = row["window_expires_at"]

            locked_until = now + timedelta(seconds=LOCKOUT_SECONDS) if attempts >= MAX_ATTEMPTS else None

            cur.execute(
                """INSERT INTO login_attempts (device_ip_key, attempts, window_expires_at, locked_until)
                   VALUES (%s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                       attempts = VALUES(attempts),
                       window_expires_at = VALUES(window_expires_at),
                       locked_until = VALUES(locked_until)""",
                (key, attempts, window_expires_at, locked_until),
            )


def clear_attempts(device_id: str, ip: str) -> None:
    key = _key(device_id, ip)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM login_attempts WHERE device_ip_key = %s", (key,))


# --- Per-account tracking (in addition to per-device/IP above) -------------
# Device-id and IP can both be reset by an attacker (clear cookies, rotate
# proxy/VPN). Locking the *account itself* after repeated failures, regardless
# of where they came from, closes that bypass. Uses the same table — the key
# is just an "email:" prefix instead of "device:ip" so it shares the schema
# and the periodic-purge event in schema.sql.
ACCOUNT_MAX_ATTEMPTS = 8
ACCOUNT_WINDOW_SECONDS = 15 * 60
ACCOUNT_LOCKOUT_SECONDS = 15 * 60


def _account_key(email: str) -> str:
    return f"email:{email.strip().lower()}"


def enforce_account_not_locked(email: str) -> None:
    key = _account_key(email)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT locked_until FROM login_attempts WHERE device_ip_key = %s", (key,))
            row = cur.fetchone()
    if row and row["locked_until"] and row["locked_until"] > datetime.utcnow():
        remaining = int((row["locked_until"] - datetime.utcnow()).total_seconds())
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            {
                "error": "account_locked",
                "message": f"Too many failed attempts on this account. Try again in {remaining // 60 + 1} minute(s).",
                "retry_after_seconds": remaining,
            },
        )


def record_account_failure(email: str) -> None:
    key = _account_key(email)
    now = datetime.utcnow()
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT attempts, window_expires_at FROM login_attempts WHERE device_ip_key = %s FOR UPDATE",
                (key,),
            )
            row = cur.fetchone()
            if row is None or (row["window_expires_at"] and row["window_expires_at"] < now):
                attempts = 1
                window_expires_at = now + timedelta(seconds=ACCOUNT_WINDOW_SECONDS)
            else:
                attempts = row["attempts"] + 1
                window_expires_at = row["window_expires_at"]
            locked_until = now + timedelta(seconds=ACCOUNT_LOCKOUT_SECONDS) if attempts >= ACCOUNT_MAX_ATTEMPTS else None
            cur.execute(
                """INSERT INTO login_attempts (device_ip_key, attempts, window_expires_at, locked_until)
                   VALUES (%s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                       attempts = VALUES(attempts),
                       window_expires_at = VALUES(window_expires_at),
                       locked_until = VALUES(locked_until)""",
                (key, attempts, window_expires_at, locked_until),
            )


def clear_account_failures(email: str) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM login_attempts WHERE device_ip_key = %s", (_account_key(email),))
