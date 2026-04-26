import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { getScanHistory, getScanResult } from "./db/database.js";
import { runScan } from "./engine/orchestrator.js";
import { broadcastToClient, setupWebSocketServer } from "./websocket/ws.server.js";

const app = express();
const port = 3000;
const server = createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/scan", (req, res) => {
  const url = req.body?.url;

  if (typeof url !== "string" || url.trim().length === 0) {
    res.status(400).json({ error: "Request body must include a non-empty url." });
    return;
  }

  const scanId = randomUUID();

  res.status(202).json({
    scanId,
    status: "started",
  });

  void runScan(scanId, url, broadcastToClient)
    .then((result) => {
      broadcastToClient(scanId, {
        scanId,
        status: result.status,
        result,
      });
    })
    .catch((error) => {
      broadcastToClient(scanId, {
        scanId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown scan error",
      });
    });
});

app.get("/api/scan/:id", (req, res) => {
  const result = getScanResult(req.params.id);

  if (result === null) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  res.status(200).json(result);
});

app.get("/api/history", (_req, res) => {
  res.status(200).json(getScanHistory());
});

setupWebSocketServer(server);

server.listen(port, () => {
  console.log(`Braum API listening on port ${port}`);
});
