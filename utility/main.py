import sys
import time
from pathlib import Path

# Add checks folder to path
BASE_DIR = Path(__file__).parent
CHECKS_DIR = BASE_DIR
sys.path.insert(0, str(CHECKS_DIR))

import random

import config
import utils
import summary
import disk_encryption
import os_updates
import antivirus
import sleep_settings

log = utils.log
send_report = utils.send_report
stable_machine_id = utils.stable_machine_id
hash_payload = utils.hash_payload
load_last_state = utils.load_last_state
save_last_state = utils.save_last_state


def clamp_interval(m: int) -> int:
    return max(15, min(60, int(m)))


def collect_snapshot() -> dict:
    try:
        os_info = summary.get_os_summary()
    except Exception as e:
        log(f"OS summary check failed: {e}")
        os_info = {"os": None, "osVersion": None}

    try:
        disk_encrypted = disk_encryption.check_disk_encryption()
    except Exception as e:
        log(f"Disk encryption check failed: {e}")
        disk_encrypted = None

    try:
        updates = os_updates.check_updates()
    except Exception as e:
        log(f"Update check failed: {e}")
        updates = {"upToDate": None, "pending": None}

    try:
        av = antivirus.check_antivirus()
    except Exception as e:
        log(f"Antivirus check failed: {e}")
        av = {"installed": None, "running": None, "name": None}

    try:
        sleep = sleep_settings.check_sleep_policy()
    except Exception as e:
        log(f"Sleep policy check failed: {e}")
        sleep = {"ok": None, "timeoutMinutes": None}

    return {
        "machineId": stable_machine_id(),
        "hostname": __import__("platform").node(),
        "os": os_info["os"],
        "osVersion": os_info["osVersion"],
        "diskEncrypted": disk_encrypted,
        "osUpdated": updates.get("upToDate"),
        "updatesPending": updates.get("pending"),
        "antivirusInstalled": av.get("installed"),
        "antivirusRunning": av.get("running"),
        "antivirusName": av.get("name"),
        "sleepPolicyOk": sleep.get("ok"),
        "sleepTimeoutMinutes": sleep.get("timeoutMinutes"),
        "timestamp": utils.now_iso(),
    }


def loop():
    interval = clamp_interval(config.INTERVAL_MINUTES)
    jitter = int(config.JITTER_SECONDS)

    log(f"syshealth utility starting. interval={interval}m ±{jitter}s  id={stable_machine_id()}")

    snapshot = collect_snapshot()
    ok, status, text = send_report(snapshot)
    if ok:
        save_last_state(snapshot)
        log("initial report sent ✅")
    else:
        log(f"initial report failed ({status}): {text[:200]}")

    last_hash = hash_payload(snapshot, exclude_keys={"timestamp"})

    while True:
        sleep_s = (interval * 60) + random.randint(-jitter, jitter)
        if sleep_s < 60:
            sleep_s = 60
        time.sleep(sleep_s)

        snap = collect_snapshot()
        h = hash_payload(snap, exclude_keys={"timestamp"})

        if h != last_hash:
            ok, status, text = send_report(snap)
            if ok:
                save_last_state(snap)
                last_hash = h
                log("change detected → report sent ✅")
            else:
                log(f"send failed ({status}): {text[:200]}")
        else:
            log("no change → not sending")


if __name__ == "__main__":
    try:
        loop()
    except KeyboardInterrupt:
        log("exiting on user interrupt")
