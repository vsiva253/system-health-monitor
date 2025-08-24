import platform
import re
from utils import run_command

def check_disk_encryption():
    os_name = platform.system()
    try:
        if os_name == "Windows":
            code, out = run_command("manage-bde -status C:")
            if code == 0 and out:
                if "Fully Encrypted" in out or "Protection On" in out:
                    return True
                return False
        if os_name == "Darwin":
            code, out = run_command("fdesetup status")
            if code == 0 and "On" in out:
                return True
            return False
        if os_name == "Linux":
            code, out = run_command("lsblk -o NAME,TYPE,MOUNTPOINT -n")
            if code == 0 and "crypt" in out:
                return True
            return False
        return None
    except Exception:
        return None
