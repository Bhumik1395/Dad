import pandas as pd
from app.core.schema_contract import COLUMN_MAP
def process_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns=COLUMN_MAP)
    df.columns = [
        c.strip().lower().replace(" ", "_").replace(".", "").replace("/", "_")
        for c in df.columns
    ]
    df["call_date"] = pd.to_datetime(df["call_date"], errors="coerce")
    for col in ["customer", "state", "region", "status", "visit_type", "employee_name"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
    df["visit_type"] = df["visit_type"].str.title()
    df = df[df["visit_type"].isin(["Physical", "Online"])]
    df["under_norm"] = df["status"] == "Undernorm"
    df = df.dropna(subset=["call_date", "machine_no"])
    return df
