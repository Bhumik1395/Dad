from fastapi import APIRouter, UploadFile, File, HTTPException, Response
import pandas as pd
from app.services.data_validation import validate_excel, ValidationError
from app.services.excel_service import process_dataframe
from app.services.cache_service import create_session
from app.core.config import SESSION_TTL_SECONDS

router = APIRouter()

MAX_FILES = 10


@router.post("/api/upload")
def upload_excel(files: list[UploadFile] = File(...), response: Response = None):
    if not files:
        raise HTTPException(400, {"error": "no_files", "message": "No files were uploaded."})
    if len(files) > MAX_FILES:
        raise HTTPException(400, {
            "error": "too_many_files",
            "message": f"Upload at most {MAX_FILES} files at a time.",
        })

    parsed_frames: list[pd.DataFrame] = []
    per_file_results = []

    for f in files:
        if not f.filename.endswith(".xlsx"):
            raise HTTPException(400, {
                "error": "unsupported_format",
                "message": f"The uploaded file '{f.filename}' is not supported. "
                           f"Please upload a valid .xlsx file.",
            })

        contents = f.file.read()  # sync read, safe here since this whole endpoint runs in a worker thread
        try:
            df = validate_excel(contents)
        except ValidationError as e:
            raise HTTPException(400, {"error": e.reason, "message": f"'{f.filename}': {e.detail}"})

        df = process_dataframe(df)
        parsed_frames.append(df)
        per_file_results.append({"filename": f.filename, "row_count": len(df)})

    combined = pd.concat(parsed_frames, ignore_index=True)
    session_id = create_session(combined)

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_TTL_SECONDS,
    )
    return {
        "session_id": session_id,
        "row_count": len(combined),
        "files": per_file_results,
    }