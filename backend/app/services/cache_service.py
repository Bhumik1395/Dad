import uuid
import io
import redis
import pandas as pd
from app.core.config import VALKEY_URL, SESSION_TTL_SECONDS

r = redis.from_url(VALKEY_URL)


def create_session(df: pd.DataFrame) -> str:
    session_id = str(uuid.uuid4())
    buf = io.BytesIO()
    df.to_pickle(buf, compression="gzip")
    r.set(f"session:{session_id}:data", buf.getvalue(), ex=SESSION_TTL_SECONDS)
    return session_id


def get_session_data(session_id: str) -> pd.DataFrame:
    raw = r.get(f"session:{session_id}:data")
    if raw is None:
        raise KeyError("session_expired")
    return pd.read_pickle(io.BytesIO(raw), compression="gzip")


def delete_session(session_id: str) -> None:
    r.delete(f"session:{session_id}:data")