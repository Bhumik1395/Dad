import pandas as pd


def _build_breakdown(grouped: pd.DataFrame) -> pd.DataFrame:
    grouped["open_pms"] = grouped["total_pms"] - grouped["closed_pms"]
    grouped["closure_rate_pct"] = (grouped["closed_pms"] / grouped["total_pms"] * 100).round(1)
    return grouped


def compute_pm_dashboard(
    df: pd.DataFrame,
    state: str | None = None,
    month: str | None = None,          # "YYYY-MM", scopes the weekly chart only
    dealer_code: str | None = None,    # search text, scopes the PM Detail table only
    page: int = 1,
    page_size: int = 50,
) -> dict:
    filtered = df
    if state:
        filtered = filtered[filtered["state"] == state]

    total_pms = len(filtered)
    closed_pms = int(filtered["is_closed"].sum())

    avg_local_closure = None
    avg_upcountry_closure = None
    if "closure_hours" in filtered.columns and "loc_up_rem" in filtered.columns:
        local_rows = filtered[filtered["loc_up_rem"] == "Local"]["closure_hours"]
        upcountry_rows = filtered[filtered["loc_up_rem"].isin(["Upcountry", "Remote"])]["closure_hours"]
        if local_rows.notna().any():
            avg_local_closure = round(local_rows.mean(), 1)
        if upcountry_rows.notna().any():
            avg_upcountry_closure = round(upcountry_rows.mean(), 1)

    # --- Region / state breakdown ---
    state_grouped = filtered.groupby("state").agg(
        total_pms=("ticket_no", "count"),
        closed_pms=("is_closed", "sum"),
    ).reset_index()
    state_grouped = _build_breakdown(state_grouped)

    state_region_map = filtered.groupby("state")["region"].agg(
        lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]
    ).reset_index()
    state_grouped = state_grouped.merge(state_region_map, on="state", how="left")

    region_grouped = filtered.groupby("region").agg(
        total_pms=("ticket_no", "count"),
        closed_pms=("is_closed", "sum"),
    ).reset_index()
    region_grouped = _build_breakdown(region_grouped)
    region_grouped = region_grouped.sort_values("total_pms", ascending=False)

    region_breakdown = []
    for _, region_row in region_grouped.iterrows():
        region_name = region_row["region"]
        states_in_region = (
            state_grouped[state_grouped["region"] == region_name]
            .sort_values("total_pms", ascending=False)
            [["state", "total_pms", "closed_pms", "open_pms", "closure_rate_pct"]]
            .to_dict("records")
        )
        region_breakdown.append({
            "region": region_name,
            "total_pms": int(region_row["total_pms"]),
            "closed_pms": int(region_row["closed_pms"]),
            "open_pms": int(region_row["open_pms"]),
            "closure_rate_pct": float(region_row["closure_rate_pct"]),
            "states": states_in_region,
        })

    # --- Monthly analysis: PM count + closure rate per calendar month ---
    monthly = filtered.copy()
    monthly["year_month"] = monthly["call_date"].dt.strftime("%Y-%m")
    pms_per_month = monthly.groupby("year_month").size().reset_index(name="pm_count")
    closed_per_month = monthly.groupby("year_month")["is_closed"].agg(["sum", "count"]).reset_index()
    closed_per_month["closure_rate_pct"] = (
        closed_per_month["sum"] / closed_per_month["count"] * 100
    ).round(1)
    monthly_trend = pms_per_month.merge(
        closed_per_month[["year_month", "closure_rate_pct"]], on="year_month", how="left"
    ).sort_values("year_month")
    monthly_trend_list = monthly_trend.to_dict("records")

    # --- Weekly analysis: how many new PMs were done each ISO week,
    # scoped to one calendar month so the chart doesn't dump every week
    # of every month onto one axis at once ---
    available_months = sorted(monthly["year_month"].unique().tolist())
    weekly_month = month or (available_months[-1] if available_months else None)

    weekly_source = filtered
    if weekly_month:
        weekly_source = filtered[filtered["call_date"].dt.strftime("%Y-%m") == weekly_month]

    weekly = weekly_source.copy()
    weekly["year_week"] = weekly["call_date"].dt.strftime("%G-W%V")
    weekly_trend = (
        weekly.groupby("year_week").size().reset_index(name="pm_count").sort_values("year_week")
    )
    weekly_trend_list = weekly_trend.to_dict("records")

    # --- PM Detail table (replaces the old feedback table) ---
    detail_source = filtered
    if dealer_code and "dealer_code" in detail_source.columns:
        detail_source = detail_source[
            detail_source["dealer_code"].str.contains(dealer_code, case=False, na=False, regex=False)
        ]

    detail_cols = ["ticket_no", "dealer_code", "dealer_name", "call_date", "remarks"]
    available_detail_cols = [c for c in detail_cols if c in detail_source.columns]
    total_detail_rows = len(detail_source)
    start = (page - 1) * page_size
    page_rows = (
        detail_source[available_detail_cols]
        .sort_values("call_date", ascending=False)
        .iloc[start:start + page_size]
        .copy()
    )
    if "call_date" in page_rows.columns:
        page_rows["call_date"] = page_rows["call_date"].dt.strftime("%Y-%m-%d")

    return {
        "kpis": {
            "totalPms": total_pms,
            "closureRatePct": round(closed_pms / total_pms * 100, 1) if total_pms else 0,
            "avgLocalClosureHours": avg_local_closure,
            "avgUpcountryClosureHours": avg_upcountry_closure,
        },
        "regionBreakdown": region_breakdown,
        "monthlyTrend": monthly_trend_list,
        "weeklyTrend": weekly_trend_list,
        "weeklyTrendMonth": weekly_month,
        "availableMonths": available_months,
        "pmDetailTable": {
            "rows": page_rows.to_dict("records"),
            "page": page,
            "pageSize": page_size,
            "totalRows": total_detail_rows,
        },
    }


def compute_pm_filter_options(df: pd.DataFrame) -> dict:
    return {
        "states": sorted(df["state"].dropna().unique().tolist()) if "state" in df.columns else [],
    }
