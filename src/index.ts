import crypto = require("node:crypto");
import express from "express";
import helmet from "helmet";
import cors from "cors";

const app = express();
const port = 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/scan", (_req, res) => {
  res.status(202).json({
    scanId: crypto.randomUUID(),
    status: "started",
  });
});

app.listen(port, () => {
  console.log(`Braum API listening on port ${port}`);
});
