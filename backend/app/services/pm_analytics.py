import pandas as pd


def compute_pm_dashboard(
    df: pd.DataFrame,
    state: str | None = None,
    month: str | None = None,          # "YYYY-MM", scopes the weekly chart only
    dealer_code: str | None = None,    # search text, scopes the PM Detail table only
    detail_state: str | None = None,   # state filter, scopes the PM Detail table only
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
    has_closure_hours = "closure_hours" in filtered.columns
    if has_closure_hours and "loc_up_rem" in filtered.columns:
        local_rows = filtered[filtered["loc_up_rem"] == "Local"]["closure_hours"]
        upcountry_rows = filtered[filtered["loc_up_rem"].isin(["Upcountry", "Remote"])]["closure_hours"]
        if local_rows.notna().any():
            avg_local_closure = round(local_rows.mean(), 1)
        if upcountry_rows.notna().any():
            avg_upcountry_closure = round(upcountry_rows.mean(), 1)

    # --- Region / state breakdown ---
    state_agg = {"total_pms": ("ticket_no", "count"), "closed_pms": ("is_closed", "sum")}
    if has_closure_hours:
        state_agg["avg_closure_hours"] = ("closure_hours", "mean")

    state_grouped = filtered.groupby("state").agg(**state_agg).reset_index()
    state_grouped["open_pms"] = state_grouped["total_pms"] - state_grouped["closed_pms"]
    if has_closure_hours:
        state_grouped["avg_closure_hours"] = state_grouped["avg_closure_hours"].round(1)

    state_region_map = filtered.groupby("state")["region"].agg(
        lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]
    ).reset_index()
    state_grouped = state_grouped.merge(state_region_map, on="state", how="left")

    region_agg = {"total_pms": ("ticket_no", "count"), "closed_pms": ("is_closed", "sum")}
    if has_closure_hours:
        region_agg["avg_closure_hours"] = ("closure_hours", "mean")

    region_grouped = filtered.groupby("region").agg(**region_agg).reset_index()
    region_grouped["open_pms"] = region_grouped["total_pms"] - region_grouped["closed_pms"]
    if has_closure_hours:
        region_grouped["avg_closure_hours"] = region_grouped["avg_closure_hours"].round(1)
    region_grouped = region_grouped.sort_values("total_pms", ascending=False)

    def _closure_hours_or_none(row) -> float | None:
        if not has_closure_hours:
            return None
        val = row.get("avg_closure_hours")
        return None if val is None or pd.isna(val) else float(val)

    region_breakdown = []
    for _, region_row in region_grouped.iterrows():
        region_name = region_row["region"]
        states_in_region_df = state_grouped[state_grouped["region"] == region_name].sort_values(
            "total_pms", ascending=False
        )
        states_in_region = [
            {
                "state": r["state"],
                "total_pms": int(r["total_pms"]),
                "closed_pms": int(r["closed_pms"]),
                "open_pms": int(r["open_pms"]),
                "avg_closure_hours": _closure_hours_or_none(r),
            }
            for _, r in states_in_region_df.iterrows()
        ]
        region_breakdown.append({
            "region": region_name,
            "total_pms": int(region_row["total_pms"]),
            "closed_pms": int(region_row["closed_pms"]),
            "open_pms": int(region_row["open_pms"]),
            "avg_closure_hours": _closure_hours_or_none(region_row),
            "states": states_in_region,
        })

    # --- Monthly analysis: PM count per calendar month ---
    monthly = filtered.copy()
    monthly["year_month"] = monthly["call_date"].dt.strftime("%Y-%m")
    pms_per_month = monthly.groupby("year_month").size().reset_index(name="pm_count")
    monthly_trend = pms_per_month.sort_values("year_month")
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

    # --- PM Detail table. Independent of the top-level `state` filter --
    # it starts from the full company dataset (`df`), not `filtered`, and
    # applies its own `detail_state` + dealer_code search instead. ---
    detail_source = df
    if detail_state:
        detail_source = detail_source[detail_source["state"] == detail_state]
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
            "pmDone": closed_pms,
            "pmNotDone": total_pms - closed_pms,
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