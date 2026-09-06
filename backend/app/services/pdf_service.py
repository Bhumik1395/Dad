from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from datetime import datetime

env = Environment(loader=FileSystemLoader("app/templates"))


def generate_pdf(kpis: dict, state_breakdown: list, charts: dict, report_title: str) -> bytes:
    template = env.get_template("report_template.html")
    html_content = template.render(
        kpis=kpis,
        state_breakdown=state_breakdown,
        charts=charts,
        report_title=report_title,
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    )
    return HTML(string=html_content).write_pdf()