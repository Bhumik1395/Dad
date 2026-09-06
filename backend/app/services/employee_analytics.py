import pandas as pd
from app.services.employee_mapping_service import load_employee_mapping


def compute_employees(df: pd.DataFrame, page: int = 1, page_size: int = 50) -> dict:
    mapping = load_employee_mapping()

    grouped = df.groupby("eng_code").agg(
        total_calls=("machine_no", "count"),
        under_norm_calls=("under_norm", "sum"),
        physical=("visit_type", lambda s: (s == "Physical").sum()),
        online=("visit_type", lambda s: (s == "Online").sum()),
        fallback_name=("employee_name", "first"),  # from the uploaded Excel's "Owned By" column
    ).reset_index()

    # Prefer the canonical name from the reference mapping; fall back to
    # whatever the uploaded file's "Owned By" column had if the Eng Code
    # isn't found in the reference table
    grouped["employee_name"] = grouped["eng_code"].map(mapping).fillna(grouped["fallback_name"])
    grouped = grouped.drop(columns=["fallback_name"])

    grouped["under_norm_pct"] = (grouped["under_norm_calls"] / grouped["total_calls"] * 100).round(1)
    grouped = grouped.sort_values("total_calls", ascending=False)

    start = (page - 1) * page_size
    page_rows = grouped.iloc[start:start + page_size]

    return {
        "rows": page_rows.to_dict("records"),
        "page": page,
        "pageSize": page_size,
        "totalRows": len(grouped),
    }