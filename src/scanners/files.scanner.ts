import axios, { AxiosError } from "axios";
import type { FileFinding, FileScanResult, FileSeverity } from "../types/file-scan.js";

interface FileProbe {
  path: string;
  severity: FileSeverity;
}

const FILE_PROBES: FileProbe[] = [
  { path: "/.env", severity: "CRITICAL" },
  { path: "/.git/HEAD", severity: "CRITICAL" },
  { path: "/config.php", severity: "CRITICAL" },
  { path: "/database.yml", severity: "CRITICAL" },
  { path: "/wp-config.php", severity: "CRITICAL" },
  { path: "/admin", severity: "HIGH" },
  { path: "/phpmyadmin", severity: "HIGH" },
  { path: "/backup", severity: "HIGH" },
  { path: "/dump.sql", severity: "HIGH" },
  { path: "/.htpasswd", severity: "HIGH" },
  { path: "/debug", severity: "MEDIUM" },
  { path: "/test", severity: "MEDIUM" },
  { path: "/staging", severity: "MEDIUM" },
  { path: "/swagger", severity: "MEDIUM" },
  { path: "/api-docs", severity: "MEDIUM" },
];

const EXPOSED_STATUS_CODES = new Set([200, 403]);
const SCORE_PENALTIES: Record<FileSeverity, number> = {
  CRITICAL: 50,
  HIGH: 20,
  MEDIUM: 10,
};
const REQUEST_TIMEOUT_MS = 4000;

export async function scanFiles(baseUrl: string): Promise<FileScanResult> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const findings = await Promise.all(
    FILE_PROBES.map((probe) => scanFile(normalizedBaseUrl, probe)),
  );
  const exposedFiles = findings
    .filter((finding) => finding.status === "exposed")
    .map((finding) => ({
      path: finding.path,
      severity: finding.severity,
      statusCode: finding.statusCode as number,
    }));
  const penalty = exposedFiles.reduce(
    (total, exposedFile) => total + SCORE_PENALTIES[exposedFile.severity],
    0,
  );

  return {
    exposedFiles,
    score: Math.max(0, 100 - penalty),
    findings,
  };
}

async function scanFile(
  normalizedBaseUrl: string,
  probe: FileProbe,
): Promise<FileFinding> {
  const statusCode = await headStatus(`${normalizedBaseUrl}${probe.path}`);
  const exposed =
    statusCode !== null && EXPOSED_STATUS_CODES.has(statusCode);

  if (exposed) {
    return {
      path: probe.path,
      severity: probe.severity,
      status: "exposed",
      statusCode,
      message: `${probe.path} appears to exist with HTTP ${statusCode}.`,
      recommendation:
        "Remove sensitive files from the web root or block public access at the server level.",
    };
  }

    return {
      path: probe.path,
      severity: probe.severity,
      status: "safe",
      statusCode,
      message:
        statusCode === null
          ? `${probe.path} did not return an exposed response.`
          : `${probe.path} returned HTTP ${statusCode}.`,
      recommendation: null,
    };
}

async function headStatus(url: string): Promise<number | null> {
  try {
    const response = await axios.head(url, {
      maxRedirects: 5,
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });

    return response.status;
  } catch (error) {
    if (error instanceof AxiosError && error.response !== undefined) {
      return error.response.status;
    }

    return null;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
