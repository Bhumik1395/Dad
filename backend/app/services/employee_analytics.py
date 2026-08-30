import pandas as pd
def compute_employees(df: pd.DataFrame, page: int = 1, page_size: int = 50) -> dict:
    grouped = df.groupby(["eng_code", "employee_name"]).agg(
        total_calls=("machine_no", "count"),
        under_norm_calls=("under_norm", "sum"),
        physical=("visit_type", lambda s: (s == "Physical").sum()),
        online=("visit_type", lambda s: (s == "Online").sum()),
    ).reset_index()
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
