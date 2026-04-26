import Database from "better-sqlite3";
import type { ScanHistoryItem, ScanResult, ScanStatus } from "../types/scan.js";

const db = new Database("braum.sqlite");

db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    scan_id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    hostname TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0,
    grade TEXT NOT NULL DEFAULT 'F',
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    result_json TEXT
  )
`);

export function createScanRecord(input: {
  scanId: string;
  url: string;
  hostname: string;
  startedAt: string;
}): void {
  db.prepare(
    `INSERT INTO scans (
      scan_id,
      url,
      hostname,
      status,
      started_at
    ) VALUES (?, ?, ?, ?, ?)`,
  ).run(input.scanId, input.url, input.hostname, "running", input.startedAt);
}

export function saveScanResult(result: ScanResult): void {
  db.prepare(
    `UPDATE scans
      SET score = ?,
          grade = ?,
          status = ?,
          completed_at = ?,
          result_json = ?
      WHERE scan_id = ?`,
  ).run(
    result.grade.score,
    result.grade.grade,
    result.status,
    result.completedAt,
    JSON.stringify(result),
    result.scanId,
  );
}

export function getScanResult(scanId: string): ScanResult | null {
  const row = db
    .prepare("SELECT result_json FROM scans WHERE scan_id = ?")
    .get(scanId) as { result_json: string | null } | undefined;

  if (row?.result_json === undefined || row.result_json === null) {
    return null;
  }

  return JSON.parse(row.result_json) as ScanResult;
}

export function getScanHistory(): ScanHistoryItem[] {
  const rows = db
    .prepare(
      `SELECT
        scan_id AS scanId,
        url,
        hostname,
        score,
        grade,
        status,
        started_at AS startedAt,
        completed_at AS completedAt
      FROM scans
      ORDER BY started_at DESC`,
    )
    .all() as Array<{
    scanId: string;
    url: string;
    hostname: string;
    score: number;
    grade: string;
    status: ScanStatus;
    startedAt: string;
    completedAt: string | null;
  }>;

  return rows;
}
