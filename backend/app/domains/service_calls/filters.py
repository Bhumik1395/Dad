from fastapi import APIRouter, Request, HTTPException
from app.services.cache_service import get_session_data
from app.services.filters_service import compute_filter_options

router = APIRouter()


@router.get("/api/filters")
def get_filters(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(401, {"error": "session_expired"})

    try:
        df = get_session_data(session_id)
    except KeyError:
        raise HTTPException(401, {"error": "session_expired"})

    return compute_filter_options(df)