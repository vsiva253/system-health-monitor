const mongoose = require("mongoose");
const ReportSchema = new mongoose.Schema(
  {
    machineId: { type: String, index: true },
    payload: { type: Object, required: true }, // raw snapshot from agent
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false }
);

const Report = mongoose.model("Report", ReportSchema);

module.exports = Report;
