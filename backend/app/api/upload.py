from fastapi import APIRouter, UploadFile, File, HTTPException, Response
from app.services.data_validation import validate_excel, ValidationError
from app.services.excel_service import process_dataframe
from app.services.cache_service import create_session
from app.core.config import SESSION_TTL_SECONDS

router = APIRouter()


@router.post("/api/upload")
async def upload_excel(file: UploadFile = File(...), response: Response = None):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(400, {
            "error": "unsupported_format",
            "message": f"The uploaded file '{file.filename}' is not supported. "
                       f"Please upload a valid .xlsx file.",
        })

    contents = await file.read()
    try:
        df = validate_excel(contents)
    except ValidationError as e:
        raise HTTPException(400, {"error": e.reason, "message": e.detail})

    df = process_dataframe(df)
    session_id = create_session(df)

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_TTL_SECONDS,
    )
    return {"session_id": session_id, "row_count": len(df)}