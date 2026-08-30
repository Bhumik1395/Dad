from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from datetime import datetime
env = Environment(loader=FileSystemLoader("app/templates"))
def generate_pdf(kpis: dict, company_logo_url: str, report_title: str) -> bytes:
 template = env.get_template("report_template.html")
 html_content = template.render(
    kpis=kpis,
    company_logo_url=company_logo_url,
    report_title=report_title,
    generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
 )
 return HTML(string=html_content).write_pdf()