export type PortStatus = "open" | "closed";
export type PortRisk = "low" | "high";

export interface TimeoutFinding {
  message: string;
  severity?: string;
}

export interface PortFinding {
  port: number;
  status: PortStatus;
  risk: PortRisk;
  message: string;
  recommendation: string | null;
}

export interface PortScanResult {
  status?: "timeout";
  openPorts: number[];
  riskyPorts: number[];
  score: number;
  findings: Array<PortFinding | TimeoutFinding>;
}
