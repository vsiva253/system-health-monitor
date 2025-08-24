// import "dotenv/config.js";
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const reportRouter = require("./routes/report.routes.js");
const machinesRouter = require("./routes/machines.routes.js");

const app = express();


app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "256kb" }));
app.use(morgan("tiny"));

// routes
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);
app.use("/api", reportRouter);
app.use("/api", machinesRouter);

// start
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`✅ API listening on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Mongo connection error:", err.message);
    process.exit(1);
  });
