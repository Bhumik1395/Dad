from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.api import upload, focus, quarterly, employees, reports, session, filters, utilization

app = FastAPI(title="Excel Analytics Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(upload.router)
app.include_router(focus.router)
app.include_router(quarterly.router)
app.include_router(employees.router)
app.include_router(reports.router)
app.include_router(session.router)
app.include_router(filters.router)
app.include_router(utilization.router)


@app.get("/health")
def health():
    return {"status": "ok"}