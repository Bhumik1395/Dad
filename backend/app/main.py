from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.api import upload, focus, quarterly, employees, reports, session

app = FastAPI(title="Excel Analytics Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(focus.router)
app.include_router(quarterly.router)
app.include_router(employees.router)
app.include_router(reports.router)
app.include_router(session.router)


@app.get("/health")
def health():
    return {"status": "ok"}