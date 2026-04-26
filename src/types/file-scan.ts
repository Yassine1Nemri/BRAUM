export type FileSeverity = "CRITICAL" | "HIGH" | "MEDIUM";
export type FileFindingStatus = "exposed" | "safe";

export interface TimeoutFinding {
  message: string;
  severity?: string;
}

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
  status?: "timeout";
  exposedFiles: ExposedFile[];
  score: number;
  findings: Array<FileFinding | TimeoutFinding>;
}
