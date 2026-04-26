import { createScanRecord, saveScanResult } from "../db/database.js";
import { scanFiles } from "../scanners/files.scanner.js";
import { scanHeaders } from "../scanners/headers.scanner.js";
import { scanPorts } from "../scanners/ports.scanner.js";
import { scanSSL } from "../scanners/ssl.scanner.js";
import { calculateGrade } from "./scorer.js";
import type { FileScanResult } from "../types/file-scan.js";
import type { HeaderScanResult } from "../types/header-scan.js";
import type { PortScanResult } from "../types/port-scan.js";
import type { SSLScanResult } from "../types/ssl-scan.js";
import type {
  ScanModule,
  ScanModuleError,
  ScanModuleResults,
  ScanProgressMessage,
  ScanResult,
} from "../types/scan.js";

export type ScanMessageSender = (
  scanId: string,
  message: ScanProgressMessage,
) => void;

type ModuleResultMap = {
  headers: HeaderScanResult;
  ssl: SSLScanResult;
  ports: PortScanResult;
  files: FileScanResult;
};

export async function runScan(
  scanId: string,
  url: string,
  ws: ScanMessageSender,
): Promise<ScanResult> {
  const normalizedUrl = normalizeUrl(url);
  const hostname = new URL(normalizedUrl).hostname;
  const startedAt = new Date().toISOString();

  createScanRecord({
    scanId,
    url: normalizedUrl,
    hostname,
    startedAt,
  });

  const moduleResults: ScanModuleResults = {
    headers: null,
    ssl: null,
    ports: null,
    files: null,
  };
  const errors: ScanModuleError[] = [];

  const tasks = [
    runModule("headers", scanHeaders(normalizedUrl), scanId, ws),
    runModule("ssl", scanSSL(hostname), scanId, ws),
    runModule("ports", scanPorts(hostname), scanId, ws),
    runModule("files", scanFiles(normalizedUrl), scanId, ws),
  ];

  const settled = await Promise.allSettled(tasks);

  for (const item of settled) {
    if (item.status === "fulfilled") {
      assignModuleResult(moduleResults, item.value);
    } else {
      errors.push(item.reason as ScanModuleError);
    }
  }

  const grade = calculateGrade(moduleResults);
  const completedAt = new Date().toISOString();
  const result: ScanResult = {
    scanId,
    url: normalizedUrl,
    hostname,
    status: errors.length === 0 ? "completed" : "failed",
    startedAt,
    completedAt,
    results: moduleResults,
    errors,
    grade,
  };

  saveScanResult(result);

  return result;
}

function assignModuleResult(
  moduleResults: ScanModuleResults,
  value:
    | { module: "headers"; result: HeaderScanResult }
    | { module: "ssl"; result: SSLScanResult }
    | { module: "ports"; result: PortScanResult }
    | { module: "files"; result: FileScanResult },
): void {
  switch (value.module) {
    case "headers":
      moduleResults.headers = value.result;
      break;
    case "ssl":
      moduleResults.ssl = value.result;
      break;
    case "ports":
      moduleResults.ports = value.result;
      break;
    case "files":
      moduleResults.files = value.result;
      break;
  }
}

async function runModule<TModule extends ScanModule>(
  module: TModule,
  promise: Promise<ModuleResultMap[TModule]>,
  scanId: string,
  send: ScanMessageSender,
): Promise<{ module: TModule; result: ModuleResultMap[TModule] }> {
  try {
    const result = await promise;

    send(scanId, {
      scanId,
      module,
      status: "completed",
      result,
    });

    return { module, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scanner error";

    send(scanId, {
      scanId,
      module,
      status: "failed",
      error: message,
    });

    throw {
      module,
      message,
    } satisfies ScanModuleError;
  }
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return new URL(withProtocol).toString();
}
