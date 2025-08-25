import random
import time
from datetime import datetime, timezone

from checks import (
    get_os_summary, check_disk_encryption, check_updates,
    check_antivirus, check_sleep_policy
)
from config import INTERVAL_MINUTES, JITTER_SECONDS
from utils import (
    now_iso, stable_machine_id, load_last_state, save_last_state,
    hash_payload, send_report
)


def clamp_interval(m: int) -> int:
    return max(15, min(60, int(m)))


def collect_snapshot() -> dict:
    os_info = get_os_summary()
    disk_encrypted = check_disk_encryption()
    updates = check_updates()
    av = check_antivirus()
    sleep = check_sleep_policy()

    payload = {
        "machineId": stable_machine_id(),
        "hostname": __import__("platform").node(),
        "os": os_info["os"],
        "osVersion": os_info["osVersion"],
        "diskEncrypted": disk_encrypted,                # True/False/None
        "osUpdated": updates.get("upToDate"),           # True/False/None
        "updatesPending": updates.get("pending"),       # int/None
        "antivirusInstalled": av.get("installed"),
        "antivirusRunning": av.get("running"),
        "antivirusName": av.get("name"),
        "sleepPolicyOk": sleep.get("ok"),
        "sleepTimeoutMinutes": sleep.get("timeoutMinutes"),
        "timestamp": now_iso(),
    }
    return payload


def loop():
    interval = clamp_interval(INTERVAL_MINUTES)
    jitter = int(JITTER_SECONDS)

    print(f"[{now_iso()}] syshealth utility starting. interval={interval}m ±{jitter}s  id={stable_machine_id()}")

    # send once on start so backend sees this machine
    snapshot = collect_snapshot()
    ok, status, text = send_report(snapshot)
    if ok:
        save_last_state(snapshot)
        print(f"[{now_iso()}] initial report sent ✅")
    else:
        print(f"[{now_iso()}] initial report failed ({status}): {text[:200]}")

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
                print(f"[{now_iso()}] change detected → report sent ✅")
            else:
                print(f"[{now_iso()}] send failed ({status}): {text[:200]}")
        else:
            print(f"[{now_iso()}] no change → not sending")


if __name__ == "__main__":
    try:
        loop()
    except KeyboardInterrupt:
        print(f"[{now_iso()}] exiting on user interrupt")
