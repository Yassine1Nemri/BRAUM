import net from "node:net";

export type PortStatus = "open" | "closed";
export type PortRisk = "low" | "high";

export interface PortFinding {
  port: number;
  status: PortStatus;
  risk: PortRisk;
  message: string;
  recommendation?: string;
}

export interface PortScanResult {
  openPorts: number[];
  riskyPorts: number[];
  score: number;
  findings: PortFinding[];
}

const PORTS_TO_SCAN = [
  21, 22, 23, 25, 80, 443, 3000, 3306, 5432, 5900, 6379, 8080, 8443, 27017,
];
const HIGH_RISK_PORTS = new Set([21, 23, 3306, 5432, 6379, 27017]);
const CONNECT_TIMEOUT_MS = 1500;
const RISKY_PORT_PENALTY = 20;

export async function scanPorts(hostname: string): Promise<PortScanResult> {
  const results = await Promise.all(
    PORTS_TO_SCAN.map(async (port) => ({
      port,
      status: await checkPort(hostname, port),
    })),
  );

  const openPorts = results
    .filter((result) => result.status === "open")
    .map((result) => result.port);
  const riskyPorts = openPorts.filter((port) => HIGH_RISK_PORTS.has(port));
  const findings = results.map(({ port, status }) =>
    createFinding(port, status),
  );
  const score = Math.max(0, 100 - riskyPorts.length * RISKY_PORT_PENALTY);

  return {
    openPorts,
    riskyPorts,
    score,
    findings,
  };
}

function checkPort(hostname: string, port: number): Promise<PortStatus> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port });

    const finish = (status: PortStatus) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.once("connect", () => finish("open"));
    socket.once("timeout", () => finish("closed"));
    socket.once("error", () => finish("closed"));
  });
}

function createFinding(port: number, status: PortStatus): PortFinding {
  const highRisk = HIGH_RISK_PORTS.has(port);

  if (status === "open" && highRisk) {
    return {
      port,
      status,
      risk: "high",
      message: `High-risk port ${port} is open.`,
      recommendation:
        "Restrict this service to trusted networks or close the port if it is not required.",
    };
  }

  if (status === "open") {
    return {
      port,
      status,
      risk: "low",
      message: `Port ${port} is open.`,
    };
  }

  return {
    port,
    status,
    risk: highRisk ? "high" : "low",
    message: `Port ${port} is closed.`,
  };
}
