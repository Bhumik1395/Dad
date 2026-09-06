import pandas as pd


def compute_focus(
    df: pd.DataFrame,
    customer=None, state=None, machine=None, status=None,
    page: int = 1, page_size: int = 50,
) -> dict:
    filtered = df
    if customer: filtered = filtered[filtered["customer"] == customer]
    if state: filtered = filtered[filtered["state"] == state]
    if machine: filtered = filtered[filtered["machine_no"] == machine]
    if status: filtered = filtered[filtered["status"] == status]

    total_calls = len(filtered)
    under_norm_calls = int(filtered["under_norm"].sum())
    repeat_counts = filtered.groupby("machine_no").size()
    repeat_calls = int((repeat_counts > 1).sum())

    # Visit type donut
    visit_counts = filtered["visit_type"].value_counts()
    visit_type_data = [{"name": k, "value": int(v)} for k, v in visit_counts.items()]

    # Under-norm vs over-norm (all Status values, not just the boolean)
    status_counts = filtered["status"].value_counts()
    status_data = [{"name": k, "value": int(v)} for k, v in status_counts.items()]

    # Calls over time, grouped by month
    calls_over_time = (
        filtered.dropna(subset=["call_date"])
        .assign(month=lambda d: d["call_date"].dt.strftime("%Y-%m"))
        .groupby("month").size()
        .reset_index(name="calls")
        .sort_values("month")
        .to_dict("records")
    )

    # Top repeat machines (only ones with >1 call)
    repeat_machines = (
        repeat_counts[repeat_counts > 1]
        .sort_values(ascending=False)
        .head(10)
        .reset_index(name="calls")
        .rename(columns={"machine_no": "machine"})
        .to_dict("records")
    )

    # Paginated detail table
    table_cols = ["customer", "state", "machine_no", "call_date", "status", "visit_type"]
    table_df = filtered[table_cols].sort_values("call_date", ascending=False)
    start = (page - 1) * page_size
    page_rows = table_df.iloc[start:start + page_size].copy()
    page_rows["call_date"] = page_rows["call_date"].dt.strftime("%Y-%m-%d")

    return {
        "kpis": {
            "totalMachines": int(filtered["machine_no"].nunique()),
            "totalCalls": total_calls,
            "underNormPct": round(under_norm_calls / total_calls * 100, 1) if total_calls else 0,
            "repeatCalls": repeat_calls,
        },
        "charts": {
            "visitType": visit_type_data,
            "statusBreakdown": status_data,
            "callsOverTime": calls_over_time,
            "repeatMachines": repeat_machines,
        },
        "table": {
            "rows": page_rows.to_dict("records"),
            "page": page,
            "pageSize": page_size,
            "totalRows": len(table_df),
        },
    }