import os
from pathlib import Path

API_URL = os.getenv("SYSHEALTH_API_URL", "http://localhost:5000/api/report")
API_KEY = os.getenv("SYSHEALTH_API_KEY", "dev-agent-token")
INTERVAL_MINUTES = int(os.getenv("SYSHEALTH_INTERVAL_MINUTES", "30"))
JITTER_SECONDS = int(os.getenv("SYSHEALTH_JITTER_SECONDS", "30"))

STATE_DIR = Path(os.getenv("SYSHEALTH_STATE_DIR", Path.home() / ".syshealth-utility"))
STATE_DIR.mkdir(parents=True, exist_ok=True)

MACHINE_ID_FILE = STATE_DIR / "machine_id"
LAST_STATE_FILE = STATE_DIR / "last_state.json"

REQUEST_TIMEOUT_SECONDS = 8
COMMAND_TIMEOUT_SECONDS = 20
