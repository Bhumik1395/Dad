from fastapi import APIRouter, Request, HTTPException
from app.services.cache_service import get_session_data
from app.services.focus_analytics import compute_focus

router = APIRouter()


@router.get("/api/dashboard/focus")
def dashboard_focus(
    request: Request,
    customer: str = None,
    state: str = None,
    machine: str = None,
    status: str = None,
    page: int = 1,
    page_size: int = 50,
):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(401, {"error": "session_expired"})

    try:
        df = get_session_data(session_id)
    except KeyError:
        raise HTTPException(401, {"error": "session_expired"})

    return compute_focus(df, customer, state, machine, status, page, page_size)