import json
from pathlib import Path

_DIRECTORY_PATH = Path(__file__).parent / "domain_directory.json"


def look_up_domain(domain: str) -> dict | None:
    """Re-reads the file on every call (it's tiny) so edits take effect
    immediately -- no restart, no re-login needed."""
    with open(_DIRECTORY_PATH) as f:
        directory = json.load(f)
    return directory.get(domain.strip().lower())
