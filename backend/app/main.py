import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api import focus, quarterly, employees, reports, session, filters, utilization
from app.api import pm_upload, pm_dashboard, me, combined_upload, companies, login
from app.core.security_middleware import CsrfOriginCheckMiddleware, SecurityHeadersMiddleware

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")
ALLOWED_HOST = ALLOWED_ORIGIN.split("://", 1)[-1].split("/", 1)[0]

app = FastAPI(title="Corob Service Analytics API")

app.add_middleware(TrustedHostMiddleware, allowed_hosts=[ALLOWED_HOST, "localhost"])
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CsrfOriginCheckMiddleware, allowed_origin=ALLOWED_ORIGIN)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Content-Disposition"],
)

app.include_router(login.router)
app.include_router(focus.router)
app.include_router(quarterly.router)
app.include_router(employees.router)
app.include_router(reports.router)
app.include_router(session.router)
app.include_router(filters.router)
app.include_router(utilization.router)
app.include_router(pm_upload.router)
app.include_router(pm_dashboard.router)
app.include_router(me.router)
app.include_router(combined_upload.router)
app.include_router(companies.router)

@app.get("/health")
def health():
    return {"status": "ok"}
