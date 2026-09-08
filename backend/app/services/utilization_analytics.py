import pandas as pd
from app.services.employee_mapping_service import load_employee_mapping

WORKING_DAYS_PER_MONTH = 26


def compute_utilization(df: pd.DataFrame) -> dict:
    d = df.copy()
    d["call_day"] = d["call_date"].dt.date
    d["year_month"] = d["call_date"].dt.to_period("M")

    d["quota_bucket"] = d["loc_up_rem"].apply(
        lambda v: "Local" if v == "Local" else "Upcountry"
    )

    distinct_months = d["year_month"].nunique()
    total_working_days = WORKING_DAYS_PER_MONTH * max(distinct_months, 1)

    # Group by eng_code ONLY for the daily quota calc — employee_name (raw
    # "Owned By") is NOT stable per eng_code in this data (one code can have
    # several different names attached across rows), so grouping by it too
    # would silently split one engineer into several rows and duplicate their
    # totals when merged back in. eng_code is the only reliably unique key.
    daily = (
        d.groupby(["eng_code", "call_day", "quota_bucket"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    if "Local" not in daily.columns:
        daily["Local"] = 0
    if "Upcountry" not in daily.columns:
        daily["Upcountry"] = 0

    daily["quota_met"] = (daily["Local"] >= 2) | (daily["Upcountry"] >= 1)

    eng_summary = daily.groupby("eng_code").agg(
        days_quota_met=("quota_met", "sum"),
    ).reset_index()

    call_counts = d.groupby("eng_code").size().reset_index(name="total_calls")
    eng_summary = eng_summary.merge(call_counts, on="eng_code", how="left")

    under_norm_counts = d.groupby("eng_code")["under_norm"].agg(["sum", "count"]).reset_index()
    under_norm_counts["under_norm_pct"] = (under_norm_counts["sum"] / under_norm_counts["count"] * 100).round(1)
    eng_summary = eng_summary.merge(
        under_norm_counts[["eng_code", "under_norm_pct"]], on="eng_code", how="left"
    )

    # Supervisor is verified stable per eng_code (each code maps to exactly
    # one supervisor across all its rows), so a simple "first" is safe here —
    # unlike employee_name, this one doesn't have the duplication problem.
    supervisor_lookup = d.groupby("eng_code")["supervisor"].first().reset_index()
    eng_summary = eng_summary.merge(supervisor_lookup, on="eng_code", how="left")

    # Canonical name from the reference mapping file; fall back to the most
    # frequently occurring raw "Owned By" value for that eng_code if it's
    # genuinely missing from the mapping (e.g. a new hire not yet added there)
    mapping = load_employee_mapping()
    fallback_name = d.groupby("eng_code")["employee_name"].agg(
        lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]
    ).reset_index().rename(columns={"employee_name": "fallback_name"})
    eng_summary = eng_summary.merge(fallback_name, on="eng_code", how="left")
    eng_summary["employee_name"] = eng_summary["eng_code"].map(mapping).fillna(eng_summary["fallback_name"])
    eng_summary = eng_summary.drop(columns=["fallback_name"])

    eng_summary["utilization_pct"] = (
        eng_summary["days_quota_met"] / total_working_days * 100
    ).clip(upper=100).round(1)

    eng_summary = eng_summary.sort_values("utilization_pct", ascending=False)

    engineers = eng_summary[[
        "eng_code", "employee_name", "supervisor",
        "total_calls", "days_quota_met", "utilization_pct", "under_norm_pct",
    ]].to_dict("records")

    supervisor_summary = eng_summary.groupby("supervisor").agg(
        num_engineers=("eng_code", "nunique"),
        avg_utilization_pct=("utilization_pct", "mean"),
        avg_under_norm_pct=("under_norm_pct", "mean"),
        total_calls=("total_calls", "sum"),
    ).reset_index()
    supervisor_summary["avg_utilization_pct"] = supervisor_summary["avg_utilization_pct"].round(1)
    supervisor_summary["avg_under_norm_pct"] = supervisor_summary["avg_under_norm_pct"].round(1)
    supervisor_summary = supervisor_summary.sort_values("avg_utilization_pct", ascending=False)

    supervisors = supervisor_summary.to_dict("records")

    return {
        "distinctMonths": int(distinct_months),
        "totalWorkingDays": int(total_working_days),
        "engineers": engineers,
        "supervisors": supervisors,
    }