export type FileSeverity = "CRITICAL" | "HIGH" | "MEDIUM";
export type FileFindingStatus = "exposed" | "safe";

export interface ExposedFile {
  path: string;
  severity: FileSeverity;
  statusCode: number;
}

export interface FileFinding {
  path: string;
  severity: FileSeverity;
  status: FileFindingStatus;
  statusCode: number | null;
  message: string;
  recommendation: string | null;
}

export interface FileScanResult {
  exposedFiles: ExposedFile[];
  score: number;
  findings: FileFinding[];
}
