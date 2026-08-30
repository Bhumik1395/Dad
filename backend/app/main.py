from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
app = FastAPI(title="Excel Analytics Dashboard API")
app.add_middleware(
 CORSMiddleware,
 allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")],
 allow_credentials=True,
 allow_methods=["*"],
 allow_headers=["*"],
)
@app.get("/health")
def health():
 return {"status": "ok"}