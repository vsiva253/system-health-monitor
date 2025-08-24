const { getMachines } = require("../controllers/machine.controller.js");
const Machine = require("../models/machine.model.js");
const express = require("express");

const router = express.Router();

router.get("/machines", getMachines);

// single machine details
router.get("/machines/:machineId", async (req, res) => {
  const doc = await Machine.findOne({ machineId: req.params.machineId }).lean();
  if (!doc) return res.status(404).json({ error: "not found" });
  res.json(doc);
});

module.exports = router;


