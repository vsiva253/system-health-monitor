import hashlib
import json
import platform
import shlex
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import requests

from config import (
    API_URL, API_KEY, STATE_DIR, MACHINE_ID_FILE, LAST_STATE_FILE,
    REQUEST_TIMEOUT_SECONDS, COMMAND_TIMEOUT_SECONDS
)

def now_iso() -> str:
    """Return current UTC time in strict ISO8601 format"""
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def run_command(cmd, shell: bool = False, timeout: int = COMMAND_TIMEOUT_SECONDS) -> Tuple[int, str]:
    """Run a command robustly and return (exit_code, stdout)."""
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


def stable_machine_id() -> str:
    """
    Generate a stable, privacy-safe machine id based on hostname + MAC (hashed).
    Persists it under STATE_DIR so it remains constant across runs.
    """
    if Path(MACHINE_ID_FILE).exists():
        return Path(MACHINE_ID_FILE).read_text().strip()

    host = platform.node() or "unknown-host"
    try:
        import uuid
        mac = f"{uuid.getnode():012x}"
    except Exception:
        mac = "nomac"

    raw = f"{host}-{mac}".encode("utf-8")
    mid = hashlib.sha256(raw).hexdigest()[:16]
    Path(MACHINE_ID_FILE).write_text(mid)
    return mid


def hash_payload(data: Dict[str, Any], exclude_keys: Optional[set] = None) -> str:
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


def load_last_state() -> Optional[Dict[str, Any]]:
    try:
        if Path(LAST_STATE_FILE).exists():
            return json.loads(Path(LAST_STATE_FILE).read_text())
    except Exception:
        pass
    return None


def save_last_state(payload: Dict[str, Any]) -> None:
    Path(LAST_STATE_FILE).write_text(json.dumps(payload, indent=2))


def send_report(payload: Dict[str, Any]) -> Tuple[bool, int, str]:
    """POST payload to backend with bearer auth. Returns (ok, status_code, text)."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "User-Agent": "syshealth-utility/1.0"
    }
    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        ok = 200 <= resp.status_code < 300
        return ok, resp.status_code, resp.text or ""
    except Exception as e:
        return False, 0, str(e)
