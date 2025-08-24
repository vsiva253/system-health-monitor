const Machine = require("../models/machine.model"); // import your Machine model

const getMachines = async (req, res) => {
  try {
    const {
      os,
      hasIssues,
      q,
      antivirus,
      updatedSinceMinutes,
      page = 1,
      limit = 50,
      sort = "-lastSeenAt",
    } = req.query;

    const filter = {};
    if (os) filter.os = os;
    if (hasIssues === "true") filter.hasIssues = true;
    if (hasIssues === "false") filter.hasIssues = false;

    if (antivirus === "missing") filter.antivirusInstalled = false;
    if (antivirus === "notrunning")
      filter.$and = [{ antivirusInstalled: true }, { antivirusRunning: false }];

    if (updatedSinceMinutes && Number(updatedSinceMinutes)) {
      const dt = new Date(Date.now() - Number(updatedSinceMinutes) * 60_000);
      filter.lastSeenAt = { $gte: dt };
    }

    if (q) {
      filter.$or = [
        { machineId: new RegExp(q, "i") },
        { hostname: new RegExp(q, "i") },
      ];
    }

    // sort format: "-lastSeenAt" or "hostname"
    const sortSpec = {};
    const s = String(sort);
    if (s.startsWith("-")) sortSpec[s.slice(1)] = -1;
    else sortSpec[s] = 1;

    const pageNum = Math.max(1, parseInt(page));
    const lim = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * lim;

    const [items, total] = await Promise.all([
      Machine.find(filter).sort(sortSpec).skip(skip).limit(lim).lean(),
      Machine.countDocuments(filter),
    ]);

    res.json({
      total,
      page: pageNum,
      pageSize: lim,
      items,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.error("Error fetching machines:", error);
  }
};

module.exports = { getMachines };
