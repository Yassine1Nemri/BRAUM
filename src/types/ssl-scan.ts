export type SSLFindingSeverity = "info" | "warning" | "critical";

export interface SSLFinding {
  check: string;
  severity: SSLFindingSeverity;
  message: string;
  recommendation: string | null;
}

export interface SSLScanResult {
  valid: boolean;
  expiresAt: string;
  daysLeft: number;
  tlsVersion: string;
  score: number;
  findings: SSLFinding[];
}
