import platform

def get_os_summary():
    os_name = platform.system()
    version = platform.version()
    return {"os": os_name, "osVersion": version}
