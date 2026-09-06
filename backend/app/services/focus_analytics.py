import pandas as pd


def compute_focus(df: pd.DataFrame, customer=None, state=None, machine=None, status=None) -> dict:
    filtered = df
    if customer:
        filtered = filtered[filtered["customer"] == customer]
    if state:
        filtered = filtered[filtered["state"] == state]
    if machine:
        filtered = filtered[filtered["machine_no"] == machine]
    if status:
        filtered = filtered[filtered["status"] == status]

    total_calls = len(filtered)
    under_norm_calls = int(filtered["under_norm"].sum())
    repeat = filtered.groupby("machine_no").size()
    repeat_calls = int((repeat > 1).sum())

    visit_counts = filtered["visit_type"].value_counts()
    visit_type_data = [{"name": k, "value": int(v)} for k, v in visit_counts.items()]

    return {
        "kpis": {
            "totalMachines": int(filtered["machine_no"].nunique()),
            "totalCalls": total_calls,
            "underNormPct": round(under_norm_calls / total_calls * 100, 1) if total_calls else 0,
            "repeatCalls": repeat_calls,
        },
        "charts": {
            "visitType": visit_type_data,
        },
    }