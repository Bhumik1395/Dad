from fastapi import APIRouter, Request, HTTPException
from app.services.cache_service import get_session_data
from app.services.quarterly_analytics import compute_quarterly

router = APIRouter()


@router.get("/api/dashboard/quarterly")
def dashboard_quarterly(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(401, {"error": "session_expired"})

    try:
        df = get_session_data(session_id)
    except KeyError:
        raise HTTPException(401, {"error": "session_expired"})

    return compute_quarterly(df)