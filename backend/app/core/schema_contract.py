SCHEMA_CONTRACT = {
    "sheet_name": "Service Data",
    "required_columns": [
        "Customer Name",
        "ZM/State",
        "Region",
        "Machine No.",
        "Status",
        "Call Date",
        "Visit Verification",
        "Eng Code",
        "Owned By",
    ],
    "max_rows": 200_000,
}

# Maps raw Excel headers -> clean internal field names used throughout the app
COLUMN_MAP = {
    "Customer Name": "customer",
    "ZM/State": "state",
    "Region": "region",
    "Machine No.": "machine_no",
    "Call Date": "call_date",
    "Visit Verification": "visit_type",
    "Eng Code": "eng_code",
    "Owned By": "employee_name",
}