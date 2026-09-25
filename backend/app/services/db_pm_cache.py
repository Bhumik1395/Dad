import io
import re
from datetime import datetime, timedelta

import pandas as pd

from app.core.db import get_connection
from app.services.pm_excel_service import dedupe_pm_rows

PM_DATA_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days, matches old PM_DATA_TTL_SECONDS


def _slug(company: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", company.strip().lower()).strip("-")


def get_pm_data(company: str) -> pd.DataFrame | None:
    slug = _slug(company)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT payload FROM pm_data WHERE company_slug = %s AND expires_at > NOW()",
                (slug,),
            )
            row = cur.fetchone()
            if row is None:
                return None

            new_expiry = datetime.utcnow() + timedelta(seconds=PM_DATA_TTL_SECONDS)
            cur.execute(
                "UPDATE pm_data SET expires_at = %s WHERE company_slug = %s",
                (new_expiry, slug),
            )

    return pd.read_pickle(io.BytesIO(row["payload"]), compression="gzip")


def save_pm_data(company: str, df: pd.DataFrame) -> int:
    """Merge `df` into whatever's already stored for this company, dedupe by
    ticket_no (new rows win), persist. Returns the resulting row count."""
    existing = get_pm_data(company)
    combined = pd.concat([existing, df], ignore_index=True) if existing is not None else df
    combined = dedupe_pm_rows(combined)

    buf = io.BytesIO()
    combined.to_pickle(buf, compression="gzip")
    slug = _slug(company)
    expires_at = datetime.utcnow() + timedelta(seconds=PM_DATA_TTL_SECONDS)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO pm_data (company_slug, company_name, payload, expires_at)
                   VALUES (%s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                       company_name = VALUES(company_name),
                       payload = VALUES(payload),
                       expires_at = VALUES(expires_at)""",
                (slug, company, buf.getvalue(), expires_at),
            )
    return len(combined)


def delete_pm_data(company: str) -> bool:
    slug = _slug(company)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM pm_data WHERE company_slug = %s", (slug,))
            return cur.rowcount > 0
