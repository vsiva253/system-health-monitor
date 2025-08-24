import json
import platform
import re
from typing import Optional, Dict, Any

from utils import run_command


def get_os_summary() -> Dict[str, str]:
    os_name = platform.system()
    version = platform.version()
    pretty = version
    if os_name == "Linux":
        try:
            with open("/etc/os-release", "r") as f:
                kv = dict(line.strip().split("=", 1) for line in f if "=" in line)
            pretty = kv.get("PRETTY_NAME", "").strip('"') or version
        except Exception:
            pretty = version
    elif os_name == "Darwin":
        code, out = run_command("sw_vers -productVersion")
        if code == 0 and out:
            pretty = out.strip()
    return {"os": os_name, "osVersion": pretty}


# ---------------- Disk Encryption ----------------

