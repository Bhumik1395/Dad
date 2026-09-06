import csv
from pathlib import Path

_MAPPING_PATH = Path(__file__).resolve().parent.parent / "data" / "eng_code_employee_mapping.csv"

_mapping_cache: dict[str, str] | None = None


def load_employee_mapping() -> dict[str, str]:
    global _mapping_cache
    if _mapping_cache is None:
        mapping = {}
        with open(_MAPPING_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                mapping[row["eng_code"].strip()] = row["employee_name"].strip()
        _mapping_cache = mapping
    return _mapping_cache