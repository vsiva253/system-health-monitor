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

def check_disk_encryption() -> Optional[bool]:
    os_name = platform.system()
    try:
        if os_name == "Windows":
            code, out = run_command(r"manage-bde -status C:")
            if code == 0 and out:
                if re.search(r"Conversion Status:\s*Fully Encrypted", out, re.I):
                    return True
                if re.search(r"Protection Status:\s*Protection On", out, re.I):
                    return True
                if re.search(r"Percentage Encrypted:\s*100%", out, re.I):
                    return True
                return False
            return None

        if os_name == "Darwin":
            code, out = run_command("fdesetup status")
            if code == 0 and out:
                if "FileVault is On" in out:
                    return True
                if "FileVault is Off" in out:
                    return False
            return None

        if os_name == "Linux":
            # Heuristics: root on /dev/mapper/* or any 'crypt' type in lsblk
            code, src = run_command("findmnt -n -o SOURCE /")
            if code == 0 and ("/dev/mapper/" in src or "crypt" in src):
                return True
            code, out = run_command("lsblk -o NAME,TYPE,MOUNTPOINT -n")
            if code == 0 and out:
                for line in out.splitlines():
                    parts = line.split()
                    if len(parts) >= 3:
                        _name, _type, _mnt = parts[0], parts[1], parts[2]
                        if _type == "crypt" and _mnt == "/":
                            return True
                if any(" crypt " in (" " + l + " ") for l in out.splitlines()):
                    return True
            return None

        return None
    except Exception:
        return None


# ---------------- Update Status ----------------

def check_updates() -> Dict[str, Any]:
    """
    Returns {"pending": <int|None>, "upToDate": <bool|None>}
    """
    os_name = platform.system()
    try:
        if os_name == "Windows":
            ps = (
                r"$s=New-Object -ComObject Microsoft.Update.Session;"
                r"$r=$s.CreateUpdateSearcher().Search('IsInstalled=0');"
                r"$r.Updates.Count"
            )
            code, out = run_command(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps])
            if code == 0 and out.strip().isdigit():
                pending = int(out.strip())
                return {"pending": pending, "upToDate": pending == 0}
            return {"pending": None, "upToDate": None}

        if os_name == "Darwin":
            code, out = run_command(["softwareupdate", "-l"])
            # If "No updates available." appears, 0 pending
            if "No new software available." in out or "No updates available." in out:
                return {"pending": 0, "upToDate": True}
            # Count lines starting with '*'
            pending = len([l for l in out.splitlines() if l.strip().startswith("*")])
            return {"pending": (pending if pending > 0 else None), "upToDate": (pending == 0)}

        if os_name == "Linux":
            # apt-based
            c, _ = run_command("bash -lc 'command -v apt-get >/dev/null 2>&1'")
            if c == 0:
                c2, out = run_command("bash -lc 'apt-get -s upgrade | grep -E \"^Inst\\s\" -c || true'")
                if c2 == 0 and out.strip().isdigit():
                    pending = int(out.strip())
                    return {"pending": pending, "upToDate": pending == 0}
            # dnf / yum: exit 100 indicates updates available (we can’t easily count)
            c, _ = run_command("bash -lc 'command -v dnf >/dev/null 2>&1'")
            if c == 0:
                c2, out = run_command("bash -lc 'dnf -q check-update >/dev/null 2>&1; echo $?'", shell=True)
                has_updates = out.strip().endswith("100")
                return {"pending": None, "upToDate": (not has_updates)}
            c, _ = run_command("bash -lc 'command -v yum >/dev/null 2>&1'")
            if c == 0:
                c2, out = run_command("bash -lc 'yum -q check-update >/dev/null 2>&1; echo $?'", shell=True)
                has_updates = out.strip().endswith("100")
                return {"pending": None, "upToDate": (not has_updates)}
            # pacman
            c, _ = run_command("bash -lc 'command -v pacman >/dev/null 2>&1'")
            if c == 0:
                c2, out = run_command("bash -lc 'pacman -Qu 2>/dev/null | wc -l'")
                if c2 == 0 and out.strip().isdigit():
                    pending = int(out.strip())
                    return {"pending": pending, "upToDate": pending == 0}
            return {"pending": None, "upToDate": None}

        return {"pending": None, "upToDate": None}
    except Exception:
        return {"pending": None, "upToDate": None}


# ---------------- Antivirus ----------------

def check_antivirus() -> Dict[str, Any]:
    """
    Returns {"installed": <bool|None>, "running": <bool|None>, "name": <str|None>}
    """
    os_name = platform.system()
    try:
        if os_name == "Windows":
            ps = ("$av=Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct "
                  "| Select-Object displayName,productState | ConvertTo-Json -Compress")
            code, out = run_command(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps])
            if code == 0 and out:
                try:
                    data = json.loads(out)
                    items = data if isinstance(data, list) else [data]
                    names = [i.get("displayName") for i in items if i]
                    installed = len(names) > 0
                    running = None
                    # heuristic: if Defender exists, check WinDefend service
                    if any("defender" in (n or "").lower() for n in names):
                        c2, o2 = run_command("sc query WinDefend")
                        running = (c2 == 0 and "RUNNING" in o2)
                    return {"installed": installed, "running": running, "name": ", ".join([n for n in names if n]) or None}
                except Exception:
                    pass
            # Fallback: Defender service presence
            c2, o2 = run_command("sc query WinDefend")
            if c2 == 0:
                return {"installed": True, "running": ("RUNNING" in o2), "name": "Windows Defender"}
            return {"installed": None, "running": None, "name": None}

        if os_name == "Darwin":
            candidates = [
                "falcond", "SophosScanD", "SophosServiceManager",
                "symantec", "NortonSecurity", "McAfee", "masvc", "mfemactl",
                "bdredline"
            ]
            found = []
            for p in candidates:
                c, out = run_command(f"pgrep -lf {p}", shell=True)
                if c == 0 and out:
                    found.append(p)
            installed = len(found) > 0
            return {"installed": installed, "running": installed, "name": (", ".join(found) if installed else None)}

        if os_name == "Linux":
            services = ["clamav-daemon", "clamd", "sophosav", "bdscan", "bdredline"]
            found = []
            running_any = False
            for s in services:
                c, out = run_command(f"systemctl is-active {s}")
                if c == 0 and out.strip() == "active":
                    running_any = True
                    found.append(s)
            if not found:
                for p in ["clamd", "freshclam", "savd", "bdscan"]:
                    c, out = run_command(f"pgrep -lf {p}", shell=True)
                    if c == 0 and out:
                        found.append(p)
            installed = len(found) > 0
            return {"installed": installed, "running": installed or running_any, "name": (", ".join(found) if installed else None)}

        return {"installed": None, "running": None, "name": None}
    except Exception:
        return {"installed": None, "running": None, "name": None}


# ---------------- Sleep Policy ----------------

def check_sleep_policy() -> Dict[str, Any]:
    """
    Returns {"timeoutMinutes": <int|None>, "ok": <bool|None>}
    ok=True iff timeout is set and <= 10 minutes.
    """
    os_name = platform.system()
    try:
        if os_name == "Windows":
            c, out = run_command("powercfg /q", shell=True, timeout=25)
            if c == 0 and out:
                m = re.search(r"Sleep after.*?Current AC Power Setting Index:\s*0x([0-9a-fA-F]+)", out, re.S)
                if m:
                    minutes = int(m.group(1), 16)
                    if minutes > 600 and minutes % 60 == 0:
                        minutes //= 60
                    return {"timeoutMinutes": minutes, "ok": minutes != 0 and minutes <= 10}
                m2 = re.search(r"Standby.*?Current AC Power Setting Index:\s*0x([0-9a-fA-F]+)", out, re.S)
                if m2:
                    minutes = int(m2.group(1), 16)
                    if minutes > 600 and minutes % 60 == 0:
                        minutes //= 60
                    return {"timeoutMinutes": minutes, "ok": minutes != 0 and minutes <= 10}
            return {"timeoutMinutes": None, "ok": None}

        if os_name == "Darwin":
            c, out = run_command("pmset -g")
            if c == 0 and out:
                m = re.search(r"\bsleep\s+(\d+)", out)
                if m:
                    minutes = int(m.group(1))
                    return {"timeoutMinutes": minutes, "ok": minutes != 0 and minutes <= 10}
            return {"timeoutMinutes": None, "ok": None}

        if os_name == "Linux":
            # GNOME settings (seconds)
            c, _ = run_command("bash -lc 'command -v gsettings >/dev/null 2>&1'")
            if c == 0:
                c1, ttype = run_command("gsettings get org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type")
                c2, tout = run_command("gsettings get org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout")
                if c1 == 0 and c2 == 0 and ttype:
                    ttype = ttype.strip().strip("'\"")
                    seconds = None
                    try:
                        seconds = int(re.sub(r"[^0-9]", "", tout))
                    except Exception:
                        seconds = None
                    if seconds is not None:
                        minutes = seconds // 60
                        ok = (ttype != "nothing") and (minutes != 0 and minutes <= 10)
                        return {"timeoutMinutes": minutes, "ok": ok}
            return {"timeoutMinutes": None, "ok": None}

        return {"timeoutMinutes": None, "ok": None}
    except Exception:
        return {"timeoutMinutes": None, "ok": None}
