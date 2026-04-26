export interface HeaderFinding {
  header: string;
  present: boolean;
  value: string | null;
  recommendation: string | null;
}

export interface TimeoutFinding {
  message: string;
  severity?: string;
}

export interface HeaderScanResult {
  status?: "timeout";
  score: number;
  findings: Array<HeaderFinding | TimeoutFinding>;
}
