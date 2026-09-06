from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import io
from app.services.cache_service import get_session_data
from app.services.focus_analytics import compute_focus
from app.services.employee_analytics import compute_employee_top
from app.services.chart_render import render_pie_chart, render_bar_chart, render_line_chart
from app.services.pdf_service import generate_pdf

router = APIRouter()


@router.post("/api/reports/pdf")
def create_report(request: Request):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(401, {"error": "session_expired"})

    try:
        df = get_session_data(session_id)
    except KeyError:
        raise HTTPException(401, {"error": "session_expired"})

    focus_data = compute_focus(df)  # whole dataset, no filters applied
    employee_top = compute_employee_top(df)

    charts = {
        "visitType": render_pie_chart(focus_data["charts"]["visitType"]),
        "statusBreakdown": render_bar_chart(focus_data["charts"]["statusBreakdown"], "name", "value"),
        "callsOverTime": render_line_chart(focus_data["charts"]["callsOverTime"], "month", "calls"),
        "repeatMachines": render_bar_chart(focus_data["charts"]["repeatMachines"], "machine", "calls"),
        "employeeCalls": render_bar_chart(employee_top["byCalls"], "name", "value"),
        "employeeUnderNorm": render_bar_chart(employee_top["byUnderNorm"], "name", "value"),
    }

    pdf_bytes = generate_pdf(
        kpis=focus_data["kpis"],
        charts=charts,
        report_title="Service Call Analytics Report",
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )