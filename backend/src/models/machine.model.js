const mongoose = require("mongoose");

const MachineSchema = new mongoose.Schema(
  {
    machineId: { type: String, index: true, unique: true },
    hostname: String,
    os: String,
    osVersion: String,

    diskEncrypted: { type: Boolean, default: null },
    osUpdated: { type: Boolean, default: null },
    updatesPending: { type: Number, default: null },

    antivirusInstalled: { type: Boolean, default: null },
    antivirusRunning: { type: Boolean, default: null },
    antivirusName: { type: String, default: null },

    sleepPolicyOk: { type: Boolean, default: null },
    sleepTimeoutMinutes: { type: Number, default: null },

    hasIssues: { type: Boolean, default: false },
    issues: { type: [String], default: [] },

    firstSeenAt: { type: Date, default: () => new Date() },
    lastSeenAt: { type: Date, default: () => new Date(), index: true },
    reportedAt: { type: Date, default: () => new Date() }, // from agent 'timestamp'
  },
  { timestamps: true }
);

const Machine = mongoose.model("Machine", MachineSchema);

module.exports = Machine;
