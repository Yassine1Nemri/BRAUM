export type PortStatus = "open" | "closed";
export type PortRisk = "low" | "high";

export interface PortFinding {
  port: number;
  status: PortStatus;
  risk: PortRisk;
  message: string;
  recommendation: string | null;
}

export interface PortScanResult {
  openPorts: number[];
  riskyPorts: number[];
  score: number;
  findings: PortFinding[];
}
