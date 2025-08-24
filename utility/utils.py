# utils.py

import hashlib
import json
import platform
import shlex
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import requests

import config  # make sure config.py exists in the same folder

# ---------------- Time ----------------
def now_iso() -> str:
    """Return current UTC time in strict ISO8601 format"""
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


# ---------------- Run shell command ----------------
def run_command(cmd, shell: bool = False, timeout: int = None) -> Tuple[int, str]:
    """Run a command robustly and return (exit_code, stdout)."""
    if timeout is None:
        timeout = config.COMMAND_TIMEOUT_SECONDS
    try:
        if shell:
            p = subprocess.run(
                cmd, shell=True, text=True,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout
            )
        else:
            if isinstance(cmd, str):
                cmd = shlex.split(cmd)
            p = subprocess.run(
                cmd, text=True,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout
            )
        return p.returncode, (p.stdout or "").strip()
    except Exception as e:
        return 1, f"ERROR:{e}"


# ---------------- Machine ID ----------------
def stable_machine_id() -> str:
    """Generate a stable, privacy-safe machine id based on hostname + MAC"""
    mid_file = Path(config.MACHINE_ID_FILE)
    if mid_file.exists():
        return mid_file.read_text().strip()

    host = platform.node() or "unknown-host"
    try:
        import uuid
        mac = f"{uuid.getnode():012x}"
    except Exception:
        mac = "nomac"

    mid = hashlib.sha256(f"{host}-{mac}".encode("utf-8")).hexdigest()[:16]
    mid_file.write_text(mid)
    return mid


# ---------------- Payload hash ----------------
def hash_payload(data: Dict[str, Any], exclude_keys: Optional[set] = None) -> str:
    """Hash a JSON payload, ignoring certain keys"""
    exclude_keys = exclude_keys or set()

    def prune(obj):
        if isinstance(obj, dict):
            return {k: prune(v) for k, v in sorted(obj.items()) if k not in exclude_keys}
        if isinstance(obj, list):
            return [prune(x) for x in obj]
        return obj

    pruned = prune(data)
    blob = json.dumps(pruned, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()


# ---------------- State management ----------------
def load_last_state() -> dict:
    """Load the last saved state from disk"""
    path = Path(config.LAST_STATE_FILE)
    if path.exists():
        try:
            return json.loads(path.read_text())
        except Exception:
            return {}
    return {}


def save_last_state(data: dict):
    """Save the current state to disk"""
    path = Path(config.LAST_STATE_FILE)
    try:
        path.write_text(json.dumps(data, indent=2))
    except Exception:
        pass


# ---------------- Send report ----------------
def send_report(payload: Dict[str, Any]) -> Tuple[bool, int, str]:
    """POST payload to backend with bearer auth. Returns (ok, status_code, text)."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.API_KEY}",
        "User-Agent": "syshealth-utility/1.0"
    }
    try:
        resp = requests.post(config.API_URL, headers=headers, json=payload, timeout=config.REQUEST_TIMEOUT_SECONDS)
        ok = 200 <= resp.status_code < 300
        return ok, resp.status_code, resp.text or ""
    except Exception as e:
        return False, 0, str(e)


# ---------------- Logging ----------------
def log(msg: str):
    """Simple timestamped console logger"""
    print(f"[{now_iso()}] {msg}")
