import platform
from utils import run_command

def check_updates():
    os_name = platform.system()
    if os_name == "Windows":
        # Placeholder: return None for simplicity
        return {"pending": None, "upToDate": None}
    if os_name == "Darwin":
        return {"pending": None, "upToDate": None}
    if os_name == "Linux":
        return {"pending": None, "upToDate": None}
    return {"pending": None, "upToDate": None}
