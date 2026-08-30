import pandas as pd
from app.core.config import FISCAL_YEAR_START_MONTH
def assign_quarter(month: int) -> str:
    shifted = (month - FISCAL_YEAR_START_MONTH) % 12
    return f"Q{shifted // 3 + 1}"
def compute_quarterly(df: pd.DataFrame) -> dict:
    df = df.copy()
    df["quarter"] = df["call_date"].dt.month.apply(assign_quarter)
    grouped = df.groupby("quarter").agg(
        calls=("machine_no", "count"),
        under_norm=("under_norm", "sum"),
        repeat=("machine_no", lambda s: (s.value_counts() > 1).sum()),
    ).reset_index()
    grouped["under_norm_pct"] = (grouped["under_norm"] / grouped["calls"] * 100).round(1)
    region_breakdown = (
        df.groupby(["quarter", "region"]).size()
            .reset_index(name="calls")
            .to_dict("records")
    )
    return {
        "table": grouped[["quarter", "calls", "under_norm_pct", "repeat"]].to_dict("records"),
        "regionBreakdown": region_breakdown,
    }