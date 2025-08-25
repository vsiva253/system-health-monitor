const Report = require("../models/report.model");

const getReportsByMachineId = async (req, res) => {
  try {
    const machineId = req.params.machineId;
    const reports = await Report.find({ machineId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
    getReportsByMachineId,
};
