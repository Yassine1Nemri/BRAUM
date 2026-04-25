# 🛡️ BRAUM — Project Session Log
> Date: April 25, 2026  
> Stack: Angular 17 + Node.js + Express + TypeScript + SQLite

---

## 🎯 Project Summary

**BRAUM** is a full-stack DevSecOps web application that scans any URL for security vulnerabilities across:
- HTTP Security Headers
- SSL/TLS Certificate Analysis
- Open Ports & Services
- Exposed Sensitive Files (/.env, /.git, etc.)

**Repo:** https://github.com/Yassine1Nemri/BRAUM

---

## 🏗️ Architecture Decided

```
braum/
├── braum-frontend/          # Angular 17 SPA
│   ├── pages/home/          # URL input
│   ├── pages/dashboard/     # Live results
│   └── pages/history/       # Past scans
│
└── braum-backend/           # Node.js + Express API
    ├── src/
    │   ├── index.ts                      ✅ DONE
    │   ├── scanners/
    │   │   ├── headers.scanner.ts        ✅ DONE
    │   │   ├── ssl.scanner.ts            ✅ DONE
    │   │   ├── ports.scanner.ts          ✅ DONE
    │   │   └── files.scanner.ts          ⏳ IN PROGRESS
    │   ├── engine/
    │   │   ├── scorer.ts                 ⬜ TODO
    │   │   └── orchestrator.ts           ⬜ TODO
    │   └── websocket/
    │       └── ws.server.ts              ⬜ TODO
    └── package.json
```

---

## 📦 Packages Installed

### Backend
```bash
npm install express cors helmet axios ssl-checker better-sqlite3 zod ws
npm install -D typescript ts-node nodemon @types/express @types/node @types/ws @types/better-sqlite3
```

### Frontend
```bash
npm install tailwindcss chart.js ng2-charts jspdf
```

---

## 🤖 Codex Setup

**Version:** Custom Codex CLI (not OpenAI's)  
**Full auto flag:** `--full-auto` (NOT `--approval-mode full-auto`)

```bash
# Alias set in ~/.bashrc
alias codex="codex --full-auto"
```

---

## 📋 Codex Prompts Used (Copy-Paste Ready)

### ✅ 1. Express Server (DONE)
```
Context: I'm building a Node.js + Express TypeScript security scanner called Braum.
Task: Scaffold src/index.ts — an Express server with CORS, helmet middleware,
a POST /api/scan route stub that returns { scanId, status: "started" },
and a GET /api/health route. Run on port 3000.
```

### ✅ 2. Headers Scanner (DONE)
```
Context: Braum is a Node.js Express TypeScript security scanner.
Task: Create src/scanners/headers.scanner.ts.
Export async function scanHeaders(url: string): Promise<HeaderScanResult>.
1. Fetch the URL using axios (GET, timeout 5s, follow redirects)
2. Check for these 6 headers: Content-Security-Policy, Strict-Transport-Security,
   X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
3. For each header record: present/missing, value, and a recommendation if missing
4. Return score out of 100 (each header = 16.6 pts) and array of findings
Define all interfaces in the same file. Run npx tsc --noEmit to verify.
```

### ✅ 3. SSL Scanner (DONE)
```
Context: Braum is a Node.js Express TypeScript security scanner.
Task: Create src/scanners/ssl.scanner.ts.
Export async function scanSSL(hostname: string): Promise<SSLScanResult>.
Use the ssl-checker npm package.
Check: certificate validity, expiry date (warn if < 30 days, critical if expired),
TLS version (flag 1.0 and 1.1 as critical), and flag self-signed certs.
Return: { valid, expiresAt, daysLeft, tlsVersion, score, findings }
Score out of 100. Define all interfaces in the same file.
Run npx tsc --noEmit to verify.
```

### ✅ 4. Port Scanner (DONE)
```
Context: Braum is a Node.js Express TypeScript security scanner.
Task: Create src/scanners/ports.scanner.ts.
Export async function scanPorts(hostname: string): Promise<PortScanResult>.
Use Node's built-in net module only (no external packages).
Scan these ports: [21, 22, 23, 25, 80, 443, 3000, 3306, 5432, 5900, 6379, 8080, 8443, 27017]
For each port: try to connect with timeout 1.5s, record open/closed.
Flag these as HIGH risk if open: 21, 23, 3306, 5432, 6379, 27017
Return: { openPorts, riskyPorts, score, findings }
Score starts at 100, -20pts per risky open port, minimum 0.
Define all interfaces in the same file.
Run npx tsc --noEmit to verify.
```

### ⏳ 5. File Prober (IN PROGRESS)
```
Context: Braum is a Node.js Express TypeScript security scanner.
Task: Create src/scanners/files.scanner.ts.
Export async function scanFiles(baseUrl: string): Promise<FileScanResult>.
Use axios HEAD requests only (timeout 4s per request).
Probe these paths:
  CRITICAL: /.env, /.git/HEAD, /config.php, /database.yml, /wp-config.php
  HIGH:     /admin, /phpmyadmin, /backup, /dump.sql, /.htpasswd
  MEDIUM:   /debug, /test, /staging, /swagger, /api-docs
Rules:
  - 200 or 403 = exposed
  - 404 or other = safe
Return: { exposedFiles: [{path, severity, statusCode}], score, findings }
Score starts at 100, -50pts CRITICAL, -20pts HIGH, -10pts MEDIUM, minimum 0.
Define all interfaces in the same file.
Run npx tsc --noEmit to verify.
```

### ⬜ 6. Scorer
```
Context: Braum is a Node.js Express TypeScript security scanner.
Task: Create src/engine/scorer.ts.
Export function calculateGrade(results: {
  headers: HeaderScanResult,
  ssl: SSLScanResult,
  ports: PortScanResult,
  files: FileScanResult
}): GradeResult

Weights: Headers 30%, SSL 30%, Ports 20%, Files 20%
Final score = weighted average of all module scores.
Grade: A (90-100), B (75-89), C (60-74), D (45-59), F (<45)
Return: { score, grade, breakdown: { headers, ssl, ports, files } }
Define all interfaces in the same file.
Run npx tsc --noEmit to verify.
```

### ⬜ 7. Orchestrator
```
Context: Braum is a Node.js Express TypeScript security scanner.
Task: Create src/engine/orchestrator.ts.
Export async function runScan(scanId: string, url: string, ws: WebSocket): Promise<ScanResult>
1. Run all 4 scanners in parallel using Promise.allSettled:
   scanHeaders, scanSSL, scanPorts, scanFiles
2. After each scanner resolves, emit a WebSocket message:
   { scanId, module, status: "complete" | "error", result }
3. Pass all results to calculateGrade from scorer.ts
4. Save full result to SQLite using better-sqlite3
5. Return the complete ScanResult
Define all interfaces in the same file.
Run npx tsc --noEmit to verify.
```

### ⬜ 8. WebSocket Server
```
Context: Braum is a Node.js Express TypeScript security scanner.
Task: Create src/websocket/ws.server.ts.
Set up a WebSocket server using the ws package attached to the existing Express HTTP server.
On connection: store the socket with a unique clientId.
Export a function broadcastToClient(scanId: string, message: object) 
that sends a JSON message to the right connected client.
Handle disconnects cleanly.
Run npx tsc --noEmit to verify.
```

---

## 🔍 How to Verify Each Scanner

```bash
# Type check
npx tsc --noEmit

# Test headers scanner
npx ts-node -e "
import { scanHeaders } from './src/scanners/headers.scanner';
scanHeaders('https://github.com').then(r => console.log(JSON.stringify(r, null, 2)));
"

# Test SSL scanner
npx ts-node -e "
import { scanSSL } from './src/scanners/ssl.scanner';
scanSSL('github.com').then(r => console.log(JSON.stringify(r, null, 2)));
"

# Test port scanner
npx ts-node -e "
import { scanPorts } from './src/scanners/ports.scanner';
scanPorts('github.com').then(r => console.log(JSON.stringify(r, null, 2)));
"

# Test file prober
npx ts-node -e "
import { scanFiles } from './src/scanners/files.scanner';
scanFiles('https://github.com').then(r => console.log(JSON.stringify(r, null, 2)));
"
```

---

## 📊 Scoring System

| Module  | Weight | Deductions |
|---------|--------|------------|
| Headers | 30%    | -16.6pts per missing header |
| SSL/TLS | 30%    | Validity + expiry + TLS version |
| Ports   | 20%    | -20pts per dangerous open port |
| Files   | 20%    | -50pts CRITICAL, -20pts HIGH, -10pts MEDIUM |

| Score  | Grade |
|--------|-------|
| 90-100 | A 🟢 |
| 75-89  | B 🟡 |
| 60-74  | C 🟠 |
| 45-59  | D 🔴 |
| < 45   | F ⛔ |

---

## 🐛 Issues Fixed

| Problem | Fix |
|---------|-----|
| `codex --approval-mode` not found | Use `--full-auto` flag instead |
| Wrong codex package installed | This is a different Codex CLI, flag is `--full-auto` |
| `git push` rejected on first push | `git pull origin main --rebase` then push |
| `helmet()` type error | Use `helmet.default()` |
| `cors` missing types | Added `src/types/cors.d.ts` manually |

---

## 🗺️ What's Left (Next Sessions)

### Backend
- [ ] files.scanner.ts
- [ ] scorer.ts
- [ ] orchestrator.ts
- [ ] ws.server.ts
- [ ] Wire everything into POST /api/scan

### Frontend
- [ ] Angular setup + Tailwind
- [ ] URL input page
- [ ] WebSocket progress tracker
- [ ] Dashboard with score badge + module cards
- [ ] Chart.js donut chart
- [ ] Scan history page
- [ ] PDF export

### Polish
- [ ] Docker Compose
- [ ] Dark mode
- [ ] Recommendations engine

---

## ⚠️ Key Reminders

- Always `git commit` after each working scanner
- Always run `npx tsc --noEmit` before committing
- Codex flag is `--full-auto` (not `--approval-mode full-auto`)
- Only scan domains you own or have permission to test
