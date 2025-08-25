function deriveIssues(snapshot) {
  // returns { hasIssues, issues[] }
  const issues = [];

  if (snapshot.diskEncrypted === false) issues.push("disk_not_encrypted");
  if (snapshot.osUpdated === false) issues.push("os_outdated");
  if (
    typeof snapshot.updatesPending === "number" &&
    snapshot.updatesPending > 0
  ) {
    issues.push("updates_pending");
  }
  if (snapshot.antivirusInstalled === false) issues.push("antivirus_missing");
  if (
    snapshot.antivirusInstalled === true &&
    snapshot.antivirusRunning === false
  ) {
    issues.push("antivirus_not_running");
  }
  if (snapshot.sleepPolicyOk === false) issues.push("sleep_policy_too_high");

  return { hasIssues: issues.length > 0, issues };
}

module.exports = { deriveIssues };
