export type SSLFindingSeverity = "info" | "warning" | "critical";

export interface SSLFinding {
  check: string;
  severity: SSLFindingSeverity;
  message: string;
  recommendation: string | null;
}

export interface TimeoutFinding {
  message: string;
  severity?: string;
}

export interface SSLScanResult {
  status?: "timeout";
  valid: boolean;
  expiresAt: string;
  daysLeft: number;
  tlsVersion: string;
  score: number;
  findings: Array<SSLFinding | TimeoutFinding>;
}
