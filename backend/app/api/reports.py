from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import io
from app.services.cache_service import get_session_data
from app.services.focus_analytics import compute_focus
from app.services.chart_render import render_bar_chart
from app.services.pdf_service import generate_pdf

router = APIRouter()


@router.post("/api/reports/pdf")
def create_report(request: Request, customer: str = None):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(401, {"error": "session_expired"})

    try:
        df = get_session_data(session_id)
    except KeyError:
        raise HTTPException(401, {"error": "session_expired"})

    focus_data = compute_focus(df, customer=customer)

    charts = {
        "repeatMachines": render_bar_chart(focus_data["charts"]["repeatMachines"], "machine", "calls"),
    }

    report_title = f"Service Call Analytics Report — {customer}" if customer else "Service Call Analytics Report"

    pdf_bytes = generate_pdf(
        kpis=focus_data["kpis"],
        state_breakdown=focus_data["stateBreakdown"],
        charts=charts,
        report_title=report_title,
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )