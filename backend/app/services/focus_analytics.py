import pandas as pd


def _build_breakdown(grouped: pd.DataFrame, filtered: pd.DataFrame, group_col: str) -> pd.DataFrame:
    grouped["over_norm_calls"] = grouped["total_calls"] - grouped["under_norm_calls"]
    grouped["under_norm_pct"] = (grouped["under_norm_calls"] / grouped["total_calls"] * 100).round(1)
    grouped["over_norm_pct"] = (grouped["over_norm_calls"] / grouped["total_calls"] * 100).round(1)

    repeat = filtered.groupby([group_col, "machine_no"]).size().reset_index(name="cnt")
    repeat = repeat[repeat["cnt"] > 1].groupby(group_col).size().reset_index(name="repeat_calls")
    grouped = grouped.merge(repeat, on=group_col, how="left")
    grouped["repeat_calls"] = grouped["repeat_calls"].fillna(0).astype(int)
    return grouped


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

    median_attend = filtered["time_to_attend_hours"].median() if "time_to_attend_hours" in filtered.columns else None
    median_resolve = filtered["time_to_resolve_hours"].median() if "time_to_resolve_hours" in filtered.columns else None

    visit_counts = filtered["visit_type"].value_counts()
    visit_type_data = [{"name": k, "value": int(v)} for k, v in visit_counts.items()]

    status_counts = filtered["status"].value_counts()
    status_data = [{"name": k, "value": int(v)} for k, v in status_counts.items()]

    repeat_machines = (
        repeat_counts[repeat_counts > 1]
        .sort_values(ascending=False)
        .head(10)
        .reset_index(name="calls")
        .rename(columns={"machine_no": "machine"})
        .to_dict("records")
    )

    # --- State-level stats (same as before) ---
    state_grouped = filtered.groupby("state").agg(
        total_calls=("machine_no", "count"),
        under_norm_calls=("under_norm", "sum"),
    ).reset_index()
    state_grouped = _build_breakdown(state_grouped, filtered, "state")

    # Attach each state's region (a state should belong to exactly one region;
    # take the most common one just in case there's any stray inconsistency)
    state_region_map = filtered.groupby("state")["region"].agg(
        lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]
    ).reset_index()
    state_grouped = state_grouped.merge(state_region_map, on="state", how="left")

    # --- Region-level totals ---
    region_grouped = filtered.groupby("region").agg(
        total_calls=("machine_no", "count"),
        under_norm_calls=("under_norm", "sum"),
    ).reset_index()
    region_grouped = _build_breakdown(region_grouped, filtered, "region")
    region_grouped = region_grouped.sort_values("total_calls", ascending=False)

    # Nest ranked states inside each region
    region_breakdown = []
    for _, region_row in region_grouped.iterrows():
        region_name = region_row["region"]
        states_in_region = (
            state_grouped[state_grouped["region"] == region_name]
            .sort_values("total_calls", ascending=False)
            [["state", "total_calls", "repeat_calls", "under_norm_calls", "under_norm_pct", "over_norm_calls", "over_norm_pct"]]
            .to_dict("records")
        )
        region_breakdown.append({
            "region": region_name,
            "total_calls": int(region_row["total_calls"]),
            "repeat_calls": int(region_row["repeat_calls"]),
            "under_norm_calls": int(region_row["under_norm_calls"]),
            "under_norm_pct": float(region_row["under_norm_pct"]),
            "over_norm_calls": int(region_row["over_norm_calls"]),
            "over_norm_pct": float(region_row["over_norm_pct"]),
            "states": states_in_region,
        })

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
            "medianTimeToAttendHours": round(median_attend, 1) if median_attend is not None and pd.notna(median_attend) else None,
            "medianTimeToResolveHours": round(median_resolve, 1) if median_resolve is not None and pd.notna(median_resolve) else None,
        },
        "regionBreakdown": region_breakdown,
        "charts": {
            "visitType": visit_type_data,
            "statusBreakdown": status_data,
            "repeatMachines": repeat_machines,
        },
        "table": {
            "rows": page_rows.to_dict("records"),
            "page": page,
            "pageSize": page_size,
            "totalRows": len(table_df),
        },
    }