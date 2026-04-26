export interface HeaderFinding {
  header: string;
  present: boolean;
  value: string | null;
  recommendation: string | null;
}

export interface HeaderScanResult {
  score: number;
  findings: HeaderFinding[];
}
