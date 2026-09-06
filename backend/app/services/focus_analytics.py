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

    visit_counts = filtered["visit_type"].value_counts()
    visit_type_data = [{"name": k, "value": int(v)} for k, v in visit_counts.items()]

    status_counts = filtered["status"].value_counts()
    status_data = [{"name": k, "value": int(v)} for k, v in status_counts.items()]

    calls_over_time = (
        filtered.dropna(subset=["call_date"])
        .assign(month=lambda d: d["call_date"].dt.strftime("%Y-%m"))
        .groupby("month").size()
        .reset_index(name="calls")
        .sort_values("month")
        .to_dict("records")
    )

    repeat_machines = (
        repeat_counts[repeat_counts > 1]
        .sort_values(ascending=False)
        .head(10)
        .reset_index(name="calls")
        .rename(columns={"machine_no": "machine"})
        .to_dict("records")
    )

    # State-wise breakdown table (always computed from the currently filtered set,
    # excluding state itself so it's meaningful when "All States" is selected)
    state_grouped = filtered.groupby("state").agg(
        total_calls=("machine_no", "count"),
        under_norm_calls=("under_norm", "sum"),
    ).reset_index()
    state_grouped["over_norm_calls"] = state_grouped["total_calls"] - state_grouped["under_norm_calls"]
    state_grouped["under_norm_pct"] = (state_grouped["under_norm_calls"] / state_grouped["total_calls"] * 100).round(1)
    state_grouped["over_norm_pct"] = (state_grouped["over_norm_calls"] / state_grouped["total_calls"] * 100).round(1)

    repeat_per_state = (
        filtered.groupby(["state", "machine_no"]).size().reset_index(name="cnt")
    )
    repeat_per_state = (
        repeat_per_state[repeat_per_state["cnt"] > 1]
        .groupby("state").size().reset_index(name="repeat_calls")
    )
    state_grouped = state_grouped.merge(repeat_per_state, on="state", how="left")
    state_grouped["repeat_calls"] = state_grouped["repeat_calls"].fillna(0).astype(int)
    state_grouped = state_grouped.sort_values("total_calls", ascending=False)

    state_breakdown = state_grouped[[
        "state", "total_calls", "repeat_calls",
        "under_norm_calls", "under_norm_pct",
        "over_norm_calls", "over_norm_pct",
    ]].to_dict("records")

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
        "stateBreakdown": state_breakdown,
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