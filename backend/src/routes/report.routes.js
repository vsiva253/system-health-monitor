const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const Machine = require("../models/machine.model.js");
const Report = require("../models/report.model.js");
const { authAgent } = require("../middleware/authAgent.js");
const { deriveIssues } = require("../utils/deriveIssues.js");

const router = express.Router();

// zod schema matching your Python payload
const SnapshotSchema = z.object({
  machineId: z.string().min(1),
  hostname: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  diskEncrypted: z.boolean().nullable().optional(),
  osUpdated: z.boolean().nullable().optional(),
  updatesPending: z.number().int().nullable().optional(),
  antivirusInstalled: z.boolean().nullable().optional(),
  antivirusRunning: z.boolean().nullable().optional(),
  antivirusName: z.string().nullable().optional(),
  sleepPolicyOk: z.boolean().nullable().optional(),
  sleepTimeoutMinutes: z.number().int().nullable().optional(),
  timestamp: z.string().datetime().optional(),
});

router.post("/report", authAgent, async (req, res) => {
  const parse = SnapshotSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "invalid payload", details: parse.error.flatten() });
  }
  const snap = parse.data;

  const { hasIssues, issues } = deriveIssues(snap);

  // upsert latest machine snapshot
  const now = new Date();
  const reportedAt = snap.timestamp ? new Date(snap.timestamp) : now;

  const update = {
    hostname: snap.hostname || null,
    os: snap.os || null,
    osVersion: snap.osVersion || null,

    diskEncrypted: snap.diskEncrypted ?? null,
    osUpdated: snap.osUpdated ?? null,
    updatesPending:
      typeof snap.updatesPending === "number" ? snap.updatesPending : null,

    antivirusInstalled: snap.antivirusInstalled ?? null,
    antivirusRunning: snap.antivirusRunning ?? null,
    antivirusName: snap.antivirusName ?? null,

    sleepPolicyOk: snap.sleepPolicyOk ?? null,
    sleepTimeoutMinutes:
      typeof snap.sleepTimeoutMinutes === "number"
        ? snap.sleepTimeoutMinutes
        : null,

    hasIssues,
    issues,

    lastSeenAt: now,
    reportedAt,
  };

  await Machine.findOneAndUpdate(
    { machineId: snap.machineId },
    {
      $set: update,
      $setOnInsert: { machineId: snap.machineId, firstSeenAt: now },
    },
    { upsert: true, new: true }
  );

  // store history entry
  await Report.create({
    machineId: snap.machineId,
    payload: snap,
    createdAt: now,
  });

  return res.json({ ok: true });
});

module.exports = router;
