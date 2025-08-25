import os
from pathlib import Path

# ---- Editable defaults (or override via environment variables) ----
API_URL = os.getenv("SYSHEALTH_API_URL", "https://system-health-monitor-arqh.onrender.com/api/reports")
API_KEY = os.getenv("SYSHEALTH_API_KEY", "dev-agent-token")
INTERVAL_MINUTES = int(os.getenv("SYSHEALTH_INTERVAL_MINUTES", "30"))  # clamp 15–60 in main
JITTER_SECONDS = int(os.getenv("SYSHEALTH_JITTER_SECONDS", "30"))

# Where the agent stores its state (machine id, last payload)
STATE_DIR = Path(os.getenv("SYSHEALTH_STATE_DIR", Path.home() / ".syshealth-utility"))
STATE_DIR.mkdir(parents=True, exist_ok=True)

MACHINE_ID_FILE = STATE_DIR / "machine_id"
LAST_STATE_FILE = STATE_DIR / "last_state.json"

REQUEST_TIMEOUT_SECONDS = 8
COMMAND_TIMEOUT_SECONDS = 20
