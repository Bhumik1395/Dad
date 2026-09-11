import pandas as pd
from app.core.pm_schema_contract import PM_COLUMN_MAP


def process_pm_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns=PM_COLUMN_MAP)
    df.columns = [
        c.strip().lower().replace(" ", "_").replace(".", "").replace("/", "_")
        for c in df.columns
    ]

    df["call_date"] = pd.to_datetime(df["call_date"], errors="coerce")

    df["eng_code"] = df["eng_code"].astype(str).str.strip()
    df["ticket_no"] = df["ticket_no"].astype(str).str.strip()

    for col in [
        "company", "customer_name", "state", "region", "call_status",
        "employee_name", "loc_up_rem", "supervisor", "dealer_code",
        "dealer_name", "city", "remarks", "satisfaction_status", "feedback",
    ]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace({"nan": "", "None": ""})

    # Source data has inconsistent casing ("Upcountry" vs "UPCOUNTRY") --
    # title-case it the same way the Service Call pipeline does.
    df["loc_up_rem"] = df["loc_up_rem"].str.title()

    # PM Data has no Undernorm/Overnorm concept -- compliance is Open/Closed
    # completion instead. Anything that isn't an exact "Closed" counts as
    # still open (source data has occasional variants like
    # "Open - Resolved Over phone").
    df["call_status"] = df["call_status"].str.title()
    df["is_closed"] = df["call_status"].str.lower() == "closed"

    if "call_attended_date" in df.columns:
        df["call_attended_date"] = pd.to_datetime(df["call_attended_date"], errors="coerce")

    if "call_close_date" in df.columns:
        df["call_close_date"] = pd.to_datetime(df["call_close_date"], errors="coerce")
        closure_hours = (df["call_close_date"] - df["call_date"]).dt.total_seconds() / 3600
        df["closure_hours"] = closure_hours.where(closure_hours >= 0)

    # Satisfaction status in the source data is close to unusable as-is
    # (almost entirely "UnSatisfied" with no "Satisfied" values recorded at
    # all as of the Jan-Aug 2026 export) -- surface it as-is rather than
    # silently "fixing" it, but normalize blanks to a clear label.
    if "satisfaction_status" in df.columns:
        df["satisfaction_status"] = df["satisfaction_status"].replace({"": "Not Recorded"})

    df = df.dropna(subset=["call_date", "company"])
    df = df[df["company"] != ""]

    return df


def dedupe_pm_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Drop duplicate tickets when merging multiple uploads, keeping the
    most-recently-uploaded copy of each ticket (relies on stable input
    order: caller should concat older data first, newer data last)."""
    if "ticket_no" not in df.columns:
        return df
    return df.drop_duplicates(subset=["ticket_no"], keep="last")
