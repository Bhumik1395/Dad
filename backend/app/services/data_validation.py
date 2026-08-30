import pandas as pd
from app.core.schema_contract import SCHEMA_CONTRACT
class ValidationError(Exception):
    def __init__(self, reason: str, detail: str):
        self.reason = reason
        self.detail = detail
        
def validate_excel(file_bytes) -> pd.DataFrame:
    try:
        df = pd.read_excel(file_bytes, sheet_name=SCHEMA_CONTRACT["sheet_name"])
    except ValueError:
        raise ValidationError(
        "invalid_sheet",
        f"Expected sheet '{SCHEMA_CONTRACT['sheet_name']}' not found.",
    )
    missing = [c for c in SCHEMA_CONTRACT["required_columns"] if c not in df.columns]
    if missing:
        raise ValidationError(
            "missing_column",
            f"Required column(s) missing: {', '.join(missing)}",
    )
    if len(df) == 0:
        raise ValidationError("empty_file", "The uploaded file has no data rows.")
    if len(df) > SCHEMA_CONTRACT["max_rows"]:
        raise ValidationError(
        "too_many_rows", f"File exceeds {SCHEMA_CONTRACT['max_rows']} rows."
 )
    return df
