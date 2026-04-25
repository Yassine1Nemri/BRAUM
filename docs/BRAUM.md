# 🛡️ BRAUM — Website Security Posture Scanner

> A full-stack DevSecOps web application that scans any URL for security vulnerabilities across headers, SSL/TLS, open ports, and exposed sensitive files — built with Angular + Node.js.

---

## 📌 Project Overview

| Field        | Detail                                      |
|--------------|---------------------------------------------|
| **Name**     | Braum                                       |
| **Stack**    | Angular 17+ · Node.js · Express · SQLite    |
| **Domain**   | DevSecOps / SCA / Web Security Auditing     |
| **Target**   | Small teams & startups                      |
| **Type**     | Learning playground → Portfolio project     |

---

## 🎯 Core Features

| Module              | What it does                                                             |
|---------------------|--------------------------------------------------------------------------|
| 🧢 Headers Scanner  | Checks CSP, HSTS, X-Frame-Options, X-XSS-Protection, Referrer-Policy, CORP |
| 🔐 SSL/TLS Analyzer | Cert validity, expiry date, TLS version (1.2 / 1.3), weak ciphers       |
| 🔌 Port Scanner     | Probes top 20 ports (22, 80, 443, 3306, 5432, 6379, 8080…)              |
| 📂 File Probe       | Tries /.env, /.git, /admin, /wp-admin, /config, /backup, /debug         |
| 🏆 Score Engine     | Combines module results into A → F security grade                        |
| 📊 Dashboard        | Real-time WebSocket progress + charts + CVE-style cards                  |
| 🕘 Scan History     | Stores past scans per session (SQLite)                                   |
| 📄 PDF Export       | Download full audit report                                               |

---

## 🏗️ Architecture

```
braum/
├── braum-frontend/               # Angular 17 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── services/
│   │   │   │   │   ├── scan.service.ts       # HTTP + WebSocket client
│   │   │   │   │   └── report.service.ts     # PDF export
│   │   │   │   └── models/
│   │   │   │       └── scan-result.model.ts
│   │   │   ├── pages/
│   │   │   │   ├── home/                     # URL input + scan trigger
│   │   │   │   ├── dashboard/                # Live results dashboard
│   │   │   │   └── history/                  # Past scans list
│   │   │   └── shared/
│   │   │       ├── components/
│   │   │       │   ├── score-badge/          # A/B/C/D/F grade badge
│   │   │       │   ├── module-card/          # Per-module result card
│   │   │       │   └── severity-chart/       # Donut chart (Chart.js)
│   │   │       └── pipes/
│   │   │           └── severity-color.pipe.ts
│   └── tailwind.config.js
│
├── braum-backend/                # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── scan.routes.ts        # POST /api/scan
│   │   │   └── history.routes.ts     # GET /api/history
│   │   ├── scanners/
│   │   │   ├── headers.scanner.ts    # HTTP response header analysis
│   │   │   ├── ssl.scanner.ts        # TLS/cert checker
│   │   │   ├── ports.scanner.ts      # TCP socket probing
│   │   │   └── files.scanner.ts      # Sensitive path prober
│   │   ├── engine/
│   │   │   ├── orchestrator.ts       # Promise.all runner + WS emitter
│   │   │   └── scorer.ts             # Grade calculator
│   │   ├── websocket/
│   │   │   └── ws.server.ts          # Real-time scan progress
│   │   ├── db/
│   │   │   └── sqlite.db             # Scan history storage
│   │   └── utils/
│   │       └── url-validator.ts
│   └── package.json
│
└── README.md
```

---

## 🧰 Tech Stack

### Frontend
| Tool           | Purpose                        | Version   |
|----------------|--------------------------------|-----------|
| Angular        | SPA framework                  | 17+       |
| TailwindCSS    | Utility-first styling          | 3+        |
| Chart.js       | Severity donut / bar charts    | 4+        |
| ng2-charts     | Angular wrapper for Chart.js   | latest    |
| ngx-websocket  | WebSocket client               | latest    |
| jsPDF          | Export scan report as PDF      | latest    |

### Backend
| Tool           | Purpose                        |
|----------------|--------------------------------|
| Express        | REST API server                |
| ws             | WebSocket server (real-time)   |
| axios          | HTTP probing (headers, files)  |
| ssl-checker    | TLS/cert analysis              |
| net (built-in) | TCP socket port scanner        |
| better-sqlite3 | Lightweight scan history DB    |
| zod            | Input validation (URL)         |
| cors / helmet  | Security middleware            |

---

## 🔌 API Design

```
POST   /api/scan              → Start a full scan, returns scan_id
GET    /api/scan/:id          → Get result of a scan
GET    /api/history           → List past scans
DELETE /api/history/:id       → Delete a scan record
WS     ws://localhost:3000    → Real-time scan progress stream
```

### WebSocket message format
```json
{
  "scan_id": "abc123",
  "module": "ssl",
  "status": "complete",
  "result": { "valid": true, "grade": "A", "expiresIn": 87 }
}
```

---

## 📊 Scoring System

Each module returns a score 0–100. Final grade = weighted average.

| Module   | Weight | Criteria                                       |
|----------|--------|------------------------------------------------|
| Headers  | 30%    | 6 headers × ~17pts each                       |
| SSL/TLS  | 30%    | Validity + expiry + TLS version + ciphers      |
| Ports    | 20%    | -20pts per dangerous open port                 |
| Files    | 20%    | -50pts per critical file found (/.env, /.git)  |

| Score  | Grade |
|--------|-------|
| 90-100 | **A** |
| 75-89  | **B** |
| 60-74  | **C** |
| 45-59  | **D** |
| < 45   | **F** |

---

## 🚀 Development Phases

### Phase 1 — Backend Core (Week 1)
- [ ] Express server + routes setup
- [ ] Headers scanner (axios + header checks)
- [ ] SSL scanner (ssl-checker)
- [ ] Port scanner (net.createConnection)
- [ ] File probe scanner (axios HEAD requests)
- [ ] Orchestrator with `Promise.all` (parallel scan)
- [ ] Scorer & grade calculator
- [ ] SQLite history persistence

### Phase 2 — Real-time + Frontend (Week 2)
- [ ] WebSocket server (ws)
- [ ] Angular project setup (TailwindCSS + routing)
- [ ] URL input page + form validation
- [ ] Live progress tracker (WebSocket consumer)
- [ ] Score badge + 4 module result cards
- [ ] Severity chart (Chart.js donut)

### Phase 3 — Polish (Week 3)
- [ ] Scan history page
- [ ] PDF export (jsPDF)
- [ ] Dark mode
- [ ] Recommendations engine ("Add HSTS header", "Close port 3306")
- [ ] Docker compose setup

---

## 🤖 AI Engineering Guide

This section is your cheat sheet for using AI tools (Codex, Claude, Copilot, Cursor) effectively throughout the project.

---

### 🛠️ Tool Stack for AI-Assisted Development

| Tool               | Best Used For                                          |
|--------------------|--------------------------------------------------------|
| **Codex / Cursor** | Scaffold entire files, boilerplate, repetitive logic   |
| **Claude**         | Architecture decisions, debug complex logic, code review |
| **GitHub Copilot** | Line-by-line autocomplete while coding                 |
| **ChatGPT**        | Quick API/library usage questions                      |

---

### 🧠 Prompting Strategy (Codex / Cursor)

#### Rule 1 — Always give context first
```
Context: I'm building a Node.js + Express security scanner called Braum.
Task: [your specific task here]
Constraints: [TypeScript, no external paid APIs, use net module for ports]
```

#### Rule 2 — One module at a time
Never ask for the whole app at once. Use this sequence:

```
1. "Scaffold the Express server with CORS, helmet, and a /api/scan POST route stub"
2. "Write the headers scanner module that checks these 6 headers: ..."
3. "Write the SSL scanner using ssl-checker npm package"
4. "Write the port scanner using Node's net module for these ports: ..."
5. "Write the file prober using axios HEAD requests for this wordlist: ..."
6. "Write the orchestrator that runs all 4 scanners in parallel with Promise.all"
7. "Write the scorer that takes module results and returns A-F grade"
```

#### Rule 3 — Specify output format
```
"Return a TypeScript interface + implementation. 
The function signature should be: 
  scanHeaders(url: string): Promise<HeaderResult>
where HeaderResult = { score: number; findings: Finding[] }"
```

---

### 📋 Ready-to-Use Codex Prompts

#### 🔷 Headers Scanner
```
Build a TypeScript Node.js module called `headers.scanner.ts`.
It exports an async function `scanHeaders(url: string): Promise<HeaderScanResult>`.
It should:
1. Fetch the URL using axios (GET, timeout 5s, follow redirects)
2. Check for these headers: Content-Security-Policy, Strict-Transport-Security,
   X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
3. For each header: record if present/missing, the value, and a recommendation if missing
4. Return a score out of 100 (each header = ~16.6 pts) and array of findings
```

#### 🔷 SSL Scanner
```
Build a TypeScript module `ssl.scanner.ts` that exports:
  async function scanSSL(hostname: string): Promise<SSLScanResult>
Use the `ssl-checker` npm package.
Check: certificate validity, expiry date (warn if < 30 days), TLS version support,
and flag if using TLS 1.0 or 1.1 as critical.
Return: { valid, expiresAt, daysLeft, tlsVersion, grade, findings }
```

#### 🔷 Port Scanner
```
Build a TypeScript module `ports.scanner.ts` that exports:
  async function scanPorts(hostname: string): Promise<PortScanResult>
Use Node's built-in `net` module only.
Scan these ports: [21, 22, 23, 25, 80, 443, 3000, 3306, 5432, 5900, 6379, 8080, 8443, 27017]
For each port: try to connect (timeout 1.5s), record open/closed.
Flag these as HIGH risk if open: 21, 23, 3306, 5432, 6379, 27017
Return: { openPorts, riskyPorts, score, findings }
```

#### 🔷 File Prober
```
Build a TypeScript module `files.scanner.ts` that exports:
  async function scanFiles(baseUrl: string): Promise<FileScanResult>
Use axios HEAD requests (timeout 4s).
Probe these paths:
  CRITICAL: /.env, /.git/HEAD, /config.php, /database.yml, /wp-config.php
  HIGH:     /admin, /phpmyadmin, /backup, /dump.sql, /.htpasswd
  MEDIUM:   /debug, /test, /staging, /swagger, /api-docs
Return: { exposedFiles: [{path, severity, statusCode}], score, findings }
If a path returns 200 or 403 → mark as exposed. 404/other → safe.
```

#### 🔷 Orchestrator + WebSocket
```
Build `orchestrator.ts` that:
1. Accepts a scanId, url, and a WebSocket connection
2. Runs all 4 scanners (headers, ssl, ports, files) in parallel using Promise.allSettled
3. After each scanner resolves, emits a WS message: { scanId, module, status, result }
4. Saves full result to SQLite via better-sqlite3
5. Returns the combined ScanResult with overall grade from scorer.ts
```

#### 🔷 Angular Scan Dashboard
```
Create an Angular 17 standalone component `DashboardComponent`.
It receives a scan result object via route param (scan_id).
Display:
- A large grade badge (A/B/C/D/F) with color (green/yellow/orange/red)
- 4 cards: Headers, SSL, Ports, Exposed Files — each with pass/warn/fail items
- A Chart.js donut chart showing score breakdown per module
- A findings list with severity badges (Critical / High / Medium / Low)
Use TailwindCSS for styling. Dark theme preferred.
```

---

### 🔍 When to Use Claude vs Codex

| Situation                              | Use           |
|----------------------------------------|---------------|
| Scaffold a new file from scratch       | Codex / Cursor|
| Debug a weird async/WebSocket bug      | Claude        |
| Design the scoring algorithm logic     | Claude        |
| Write repetitive similar functions     | Codex / Copilot|
| Review security of your own scanner   | Claude        |
| Generate the Angular template HTML     | Codex / Cursor|
| Choose between 2 architectural approaches | Claude     |

---

### 🧪 Testing Prompts

```
"Write a Jest unit test for the headers scanner. 
Mock axios to return headers with only HSTS present. 
Assert that score is approximately 16, 
and findings contain 5 missing header warnings."
```

```
"Write an integration test for POST /api/scan that:
- Sends { url: 'https://example.com' }
- Expects a 200 response with { scanId, status: 'started' }
- Verifies the WebSocket receives at least one message within 10 seconds"
```

---

### ⚠️ Common Pitfalls to Avoid

| Pitfall                            | Fix                                                  |
|------------------------------------|------------------------------------------------------|
| Port scan takes too long           | Set `net.createConnection` timeout to max 1.5s       |
| File prober flags 403 as safe      | Treat 403 as exposed (server exists, access denied)  |
| SSL check on raw IP fails          | Validate hostname before calling ssl-checker         |
| Angular WS reconnect on nav        | Use a singleton service, not component-level WS      |
| Scanning localhost in production   | Add URL validation to block private/internal IPs     |

---

## 🔐 Ethical & Legal Note

> Braum is a **learning and authorized testing tool**.
> Always scan only domains you **own or have explicit permission** to test.
> Never scan third-party services without consent.
> Consider adding a disclaimer checkbox in the UI before scanning.

---

## 📦 Getting Started

```bash
# Clone and install
git clone https://github.com/yourname/braum
cd braum

# Backend
cd braum-backend
npm install
npm run dev        # runs on :3000

# Frontend
cd braum-frontend
npm install
ng serve           # runs on :4200
```

---

## 📈 Future Ideas (Post-MVP)

- [ ] GitHub Action integration (scan on every push)
- [ ] DNS record analysis (SPF, DMARC, DNSSEC)
- [ ] CORS misconfiguration detection
- [ ] Rate limiting & abuse protection
- [ ] Public shareable scan report links
- [ ] Slack/Discord webhook alerts
