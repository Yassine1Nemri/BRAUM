import type { FileScanResult } from "./file-scan.js";
import type { GradeResult } from "./grade.js";
import type { HeaderScanResult } from "./header-scan.js";
import type { PortScanResult } from "./port-scan.js";
import type { SSLScanResult } from "./ssl-scan.js";

export type ScanModule = "headers" | "ssl" | "ports" | "files";
export type ScanModuleStatus = "completed" | "failed";
export type ScanStatus = "running" | "completed" | "failed";

export interface ScanModuleResults {
  headers: HeaderScanResult | null;
  ssl: SSLScanResult | null;
  ports: PortScanResult | null;
  files: FileScanResult | null;
}

export interface ScanModuleError {
  module: ScanModule;
  message: string;
}

export interface ScanProgressMessage {
  scanId: string;
  module: ScanModule;
  status: ScanModuleStatus;
  result?: HeaderScanResult | SSLScanResult | PortScanResult | FileScanResult;
  error?: string;
}

export interface ScanResult {
  scanId: string;
  url: string;
  hostname: string;
  status: ScanStatus;
  startedAt: string;
  completedAt: string;
  results: ScanModuleResults;
  errors: ScanModuleError[];
  grade: GradeResult;
}

export interface ScanHistoryItem {
  scanId: string;
  url: string;
  hostname: string;
  score: number;
  grade: string;
  status: ScanStatus;
  startedAt: string;
  completedAt: string | null;
}
