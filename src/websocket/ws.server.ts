import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

const clientsByScanId = new Map<string, Set<WebSocket>>();

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket, request) => {
    const scanId = getScanId(request.url);

    if (scanId !== null) {
      addClient(scanId, socket);
    }

    socket.on("message", (rawMessage) => {
      const nextScanId = scanIdFromMessage(rawMessage.toString());

      if (nextScanId !== null) {
        addClient(nextScanId, socket);
      }
    });

    socket.on("close", () => {
      removeClient(socket);
    });

    socket.on("error", () => {
      removeClient(socket);
    });
  });

  return wss;
}

export function broadcastToClient(scanId: string, message: unknown): void {
  const clients = clientsByScanId.get(scanId);

  if (clients === undefined) {
    return;
  }

  const payload = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

export function closeClientsForScan(scanId: string): void {
  const clients = clientsByScanId.get(scanId);

  if (clients === undefined) {
    return;
  }

  for (const client of clients) {
    try {
      client.close();
    } catch {
      // ignore
    }
  }

  clientsByScanId.delete(scanId);
}

function addClient(scanId: string, socket: WebSocket): void {
  const clients = clientsByScanId.get(scanId) ?? new Set<WebSocket>();

  clients.add(socket);
  clientsByScanId.set(scanId, clients);
}

function removeClient(socket: WebSocket): void {
  for (const [scanId, clients] of clientsByScanId.entries()) {
    clients.delete(socket);

    if (clients.size === 0) {
      clientsByScanId.delete(scanId);
    }
  }
}

function getScanId(requestUrl: string | undefined): string | null {
  if (requestUrl === undefined) {
    return null;
  }

  const url = new URL(requestUrl, "http://localhost");

  return url.searchParams.get("scanId");
}

function scanIdFromMessage(message: string): string | null {
  try {
    const parsed = JSON.parse(message) as { scanId?: unknown };

    return typeof parsed.scanId === "string" ? parsed.scanId : null;
  } catch {
    return null;
  }
}
