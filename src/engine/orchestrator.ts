import { saveScanResult } from "../db/database.js";
import { scanFiles } from "../scanners/files.scanner.js";
import { scanHeaders } from "../scanners/headers.scanner.js";
import { scanPorts } from "../scanners/ports.scanner.js";
import { scanSSL } from "../scanners/ssl.scanner.js";
import { calculateGrade } from "./scorer.js";
import { normalizeUrl } from "../utils/url.js";
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
  message: unknown,
) => void;

type ModuleResultMap = {
  headers: HeaderScanResult;
  ssl: SSLScanResult;
  ports: PortScanResult;
  files: FileScanResult;
};

const GLOBAL_SCAN_TIMEOUT_MS = 20000; // 20 second global timeout for entire scan

export async function runScan(
  scanId: string,
  url: string,
  ws: ScanMessageSender,
  closeClients: (scanId: string) => void,
  startedAt = new Date().toISOString(),
): Promise<ScanResult> {
  const normalizedUrl = normalizeUrl(url);
  const hostname = new URL(normalizedUrl).hostname;

  const moduleResults: ScanModuleResults = {
    headers: null,
    ssl: null,
    ports: null,
    files: null,
  };
  const errors: ScanModuleError[] = [];

  const tasks = [
    runModule("headers", scanHeaders(normalizedUrl), scanId, ws).then((value) =>
      assignModuleResult(moduleResults, value),
    ),
    runModule("ssl", scanSSL(hostname), scanId, ws).then((value) =>
      assignModuleResult(moduleResults, value),
    ),
    runModule("ports", scanPorts(hostname), scanId, ws).then((value) =>
      assignModuleResult(moduleResults, value),
    ),
    runModule("files", scanFiles(normalizedUrl), scanId, ws).then((value) =>
      assignModuleResult(moduleResults, value),
    ),
  ];

  const timedOut = await Promise.race([
    Promise.allSettled(tasks).then(() => false),
    sleep(GLOBAL_SCAN_TIMEOUT_MS).then(() => true),
  ]);

  if (timedOut) {
    fillTimeoutResultIfMissing("headers", moduleResults, scanId, ws);
    fillTimeoutResultIfMissing("ssl", moduleResults, scanId, ws);
    fillTimeoutResultIfMissing("ports", moduleResults, scanId, ws);
    fillTimeoutResultIfMissing("files", moduleResults, scanId, ws);
  }

  const grade = calculateGrade(moduleResults);
  const completedAt = new Date().toISOString();
  const result: ScanResult = {
    scanId,
    url: normalizedUrl,
    hostname,
    status: "completed",
    startedAt,
    completedAt,
    results: moduleResults,
    errors,
    grade,
  };

  saveScanResult(result);

  ws(scanId, {
    scanId,
    status: result.status,
    result,
  });
  closeClients(scanId);

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
    } satisfies ScanProgressMessage);

    return { module, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scanner error";

    send(scanId, {
      scanId,
      module,
      status: "failed",
      error: message,
    } satisfies ScanProgressMessage);

    return { module, result: errorResultForModule(module, message) };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fillTimeoutResultIfMissing(
  module: ScanModule,
  moduleResults: ScanModuleResults,
  scanId: string,
  send: ScanMessageSender,
): void {
  switch (module) {
    case "headers": {
      if (moduleResults.headers !== null) {
        return;
      }

      const result = timeoutResultForModule("headers");
      moduleResults.headers = result;
      send(scanId, { scanId, module, status: "timeout", result } satisfies ScanProgressMessage);
      break;
    }
    case "ssl": {
      if (moduleResults.ssl !== null) {
        return;
      }

      const result = timeoutResultForModule("ssl");
      moduleResults.ssl = result;
      send(scanId, { scanId, module, status: "timeout", result } satisfies ScanProgressMessage);
      break;
    }
    case "ports": {
      if (moduleResults.ports !== null) {
        return;
      }

      const result = timeoutResultForModule("ports");
      moduleResults.ports = result;
      send(scanId, { scanId, module, status: "timeout", result } satisfies ScanProgressMessage);
      break;
    }
    case "files": {
      if (moduleResults.files !== null) {
        return;
      }

      const result = timeoutResultForModule("files");
      moduleResults.files = result;
      send(scanId, { scanId, module, status: "timeout", result } satisfies ScanProgressMessage);
      break;
    }
  }
}

function timeoutResultForModule<TModule extends ScanModule>(
  module: TModule,
): ModuleResultMap[TModule] {
  switch (module) {
    case "headers":
      return {
        status: "timeout",
        score: 0,
        findings: [{ message: "timeout" }],
      } as unknown as ModuleResultMap[TModule];
    case "ssl":
      return {
        status: "timeout",
        valid: false,
        expiresAt: "",
        daysLeft: 0,
        tlsVersion: "",
        score: 0,
        findings: [{ message: "timeout" }],
      } as unknown as ModuleResultMap[TModule];
    case "ports":
      return {
        status: "timeout",
        openPorts: [],
        riskyPorts: [],
        score: 0,
        findings: [{ message: "timeout" }],
      } as unknown as ModuleResultMap[TModule];
    case "files":
      return {
        status: "timeout",
        exposedFiles: [],
        score: 0,
        findings: [{ message: "timeout" }],
      } as unknown as ModuleResultMap[TModule];
  }
}

function errorResultForModule<TModule extends ScanModule>(
  module: TModule,
  message: string,
): ModuleResultMap[TModule] {
  switch (module) {
    case "headers":
      return {
        score: 0,
        findings: [{ message }],
      } as unknown as ModuleResultMap[TModule];
    case "ssl":
      return {
        valid: false,
        expiresAt: "",
        daysLeft: 0,
        tlsVersion: "",
        score: 0,
        findings: [{ message }],
      } as unknown as ModuleResultMap[TModule];
    case "ports":
      return {
        openPorts: [],
        riskyPorts: [],
        score: 0,
        findings: [{ message }],
      } as unknown as ModuleResultMap[TModule];
    case "files":
      return {
        exposedFiles: [],
        score: 0,
        findings: [{ message }],
      } as unknown as ModuleResultMap[TModule];
  }
}
