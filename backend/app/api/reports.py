from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import io
from app.services.cache_service import get_session_data
from app.services.focus_analytics import compute_focus
from app.services.pdf_service import generate_pdf
router = APIRouter()
@router.post("/api/reports/pdf")
def create_report(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(401, {"error": "session_expired"})
    df = get_session_data(session_id)
    focus_data = compute_focus(df)
    pdf_bytes = generate_pdf(
        kpis=focus_data["kpis"],
        company_logo_url="https://example.com/logo.png",
        report_title="Service Call Analytics Report",
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )
