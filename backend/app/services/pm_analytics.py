import pandas as pd


def _build_breakdown(grouped: pd.DataFrame) -> pd.DataFrame:
    grouped["open_calls"] = grouped["total_calls"] - grouped["closed_calls"]
    grouped["closure_rate_pct"] = (grouped["closed_calls"] / grouped["total_calls"] * 100).round(1)
    return grouped


def compute_pm_dashboard(
    df: pd.DataFrame,
    state: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    filtered = df
    if state:
        filtered = filtered[filtered["state"] == state]

    total_calls = len(filtered)
    closed_calls = int(filtered["is_closed"].sum())

    avg_local_closure = None
    avg_upcountry_closure = None
    if "closure_hours" in filtered.columns and "loc_up_rem" in filtered.columns:
        local_rows = filtered[filtered["loc_up_rem"] == "Local"]["closure_hours"]
        upcountry_rows = filtered[filtered["loc_up_rem"].isin(["Upcountry", "Remote"])]["closure_hours"]
        if local_rows.notna().any():
            avg_local_closure = round(local_rows.mean(), 1)
        if upcountry_rows.notna().any():
            avg_upcountry_closure = round(upcountry_rows.mean(), 1)

    satisfaction_breakdown = (
        filtered.groupby("satisfaction_status").size().reset_index(name="count").to_dict("records")
        if "satisfaction_status" in filtered.columns
        else []
    )

    state_grouped = filtered.groupby("state").agg(
        total_calls=("ticket_no", "count"),
        closed_calls=("is_closed", "sum"),
    ).reset_index()
    state_grouped = _build_breakdown(state_grouped)

    state_region_map = filtered.groupby("state")["region"].agg(
        lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]
    ).reset_index()
    state_grouped = state_grouped.merge(state_region_map, on="state", how="left")

    region_grouped = filtered.groupby("region").agg(
        total_calls=("ticket_no", "count"),
        closed_calls=("is_closed", "sum"),
    ).reset_index()
    region_grouped = _build_breakdown(region_grouped)
    region_grouped = region_grouped.sort_values("total_calls", ascending=False)

    region_breakdown = []
    for _, region_row in region_grouped.iterrows():
        region_name = region_row["region"]
        states_in_region = (
            state_grouped[state_grouped["region"] == region_name]
            .sort_values("total_calls", ascending=False)
            [["state", "total_calls", "closed_calls", "open_calls", "closure_rate_pct"]]
            .to_dict("records")
        )
        region_breakdown.append({
            "region": region_name,
            "total_calls": int(region_row["total_calls"]),
            "closed_calls": int(region_row["closed_calls"]),
            "open_calls": int(region_row["open_calls"]),
            "closure_rate_pct": float(region_row["closure_rate_pct"]),
            "states": states_in_region,
        })

    monthly = filtered.copy()
    monthly["year_month"] = monthly["call_date"].dt.strftime("%Y-%m")
    calls_per_month = monthly.groupby("year_month").size().reset_index(name="calls")
    closed_per_month = monthly.groupby("year_month")["is_closed"].agg(["sum", "count"]).reset_index()
    closed_per_month["closure_rate_pct"] = (
        closed_per_month["sum"] / closed_per_month["count"] * 100
    ).round(1)
    monthly_trend = calls_per_month.merge(
        closed_per_month[["year_month", "closure_rate_pct"]], on="year_month", how="left"
    ).sort_values("year_month")
    monthly_trend_list = monthly_trend.to_dict("records")

    # Feedback table -- paginated, only rows that actually have feedback text.
    feedback_cols = ["ticket_no", "call_date", "state", "company", "satisfaction_status", "feedback"]
    available_feedback_cols = [c for c in feedback_cols if c in filtered.columns]
    feedback_rows_all = filtered
    if "feedback" in filtered.columns:
        feedback_rows_all = filtered[filtered["feedback"].fillna("") != ""]
    total_feedback_rows = len(feedback_rows_all)
    start = (page - 1) * page_size
    page_rows = (
        feedback_rows_all[available_feedback_cols]
        .sort_values("call_date", ascending=False)
        .iloc[start:start + page_size]
        .copy()
    )
    if "call_date" in page_rows.columns:
        page_rows["call_date"] = page_rows["call_date"].dt.strftime("%Y-%m-%d")

    return {
        "kpis": {
            "totalCalls": total_calls,
            "closureRatePct": round(closed_calls / total_calls * 100, 1) if total_calls else 0,
            "avgLocalClosureHours": avg_local_closure,
            "avgUpcountryClosureHours": avg_upcountry_closure,
        },
        "satisfactionBreakdown": satisfaction_breakdown,
        "regionBreakdown": region_breakdown,
        "monthlyTrend": monthly_trend_list,
        "feedbackTable": {
            "rows": page_rows.to_dict("records"),
            "page": page,
            "pageSize": page_size,
            "totalRows": total_feedback_rows,
        },
    }


def compute_pm_filter_options(df: pd.DataFrame) -> dict:
    return {
        "states": sorted(df["state"].dropna().unique().tolist()) if "state" in df.columns else [],
    }
