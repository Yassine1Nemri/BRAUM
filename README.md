<div align="center">

# 🛡️ BRAUM

### Website Security Posture Scanner

**Scan any URL for real security vulnerabilities — headers, SSL/TLS, open ports, and exposed files.**  
Built for small teams and startups who care about security without enterprise tooling.

<br/>

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## 🔍 What is BRAUM?

BRAUM is a **DevSecOps web application** that performs a full security audit on any publicly accessible website. Enter a URL and get a real-time security grade — like running SSL Labs, SecurityHeaders.io, and a basic recon tool all at once.

It's designed to be:
- **Fast** — all 4 scan modules run in parallel
- **Visual** — live WebSocket progress, charts, severity badges
- **Actionable** — every finding comes with a clear recommendation

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🧢 **Headers Scanner** | Checks for CSP, HSTS, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| 🔐 **SSL/TLS Analyzer** | Validates certificate, checks expiry, TLS version (1.2/1.3), flags weak ciphers |
| 🔌 **Port Scanner** | Probes 14 common ports, flags dangerous ones (22, 3306, 6379 exposed publicly) |
| 📂 **File Prober** | Tries sensitive paths like `/.env`, `/.git`, `/admin`, `/wp-config.php` |
| 🏆 **Security Grade** | Combines all modules into a final A → F grade with per-module breakdown |
| 📊 **Live Dashboard** | Real-time scan progress via WebSocket + Chart.js severity breakdown |
| 🕘 **Scan History** | Stores and retrieves past scans (SQLite) |
| 📄 **PDF Export** | Download a full audit report |

---

## 🏗️ Architecture

```
braum/
├── braum-frontend/          # Angular 17 SPA
│   ├── pages/
│   │   ├── home/            # URL input
│   │   ├── dashboard/       # Live results
│   │   └── history/         # Past scans
│   └── shared/components/
│       ├── score-badge/     # A/B/C/D/F grade
│       ├── module-card/     # Per-module results
│       └── severity-chart/  # Chart.js donut
│
└── braum-backend/           # Node.js + Express API
    ├── scanners/
    │   ├── headers.scanner.ts
    │   ├── ssl.scanner.ts
    │   ├── ports.scanner.ts
    │   └── files.scanner.ts
    ├── engine/
    │   ├── orchestrator.ts  # Promise.all runner + WS emitter
    │   └── scorer.ts        # Grade calculator
    └── websocket/
        └── ws.server.ts     # Real-time updates
```

---

## 🧰 Tech Stack

**Frontend** — Angular 17, TailwindCSS, Chart.js, WebSocket client, jsPDF  
**Backend** — Node.js, Express, `ws`, `axios`, `ssl-checker`, `net` (built-in), `better-sqlite3`  
**Validation** — Zod  
**Security middleware** — Helmet, CORS

---

## 📊 Scoring System

Each module returns a score 0–100. The final grade is a weighted average.

| Module  | Weight | Key Signals |
|---------|--------|-------------|
| Headers | 30%    | 6 security headers × ~16pts each |
| SSL/TLS | 30%    | Validity + expiry + TLS 1.3 support |
| Ports   | 20%    | -20pts per dangerous open port |
| Files   | 20%    | -50pts per critical file exposed |

| Score | Grade |
|-------|-------|
| 90–100 | **A** 🟢 |
| 75–89  | **B** 🟡 |
| 60–74  | **C** 🟠 |
| 45–59  | **D** 🔴 |
| < 45   | **F** ⛔ |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Angular CLI 17+

### Installation

```bash
# Clone the repo
git clone https://github.com/Yassine1Nemri/BRAUM.git
cd BRAUM

# Backend
cd braum-backend
npm install
npm run dev          # http://localhost:3000

# Frontend (new terminal)
cd braum-frontend
npm install
ng serve             # http://localhost:4200
```

---

## 📡 API Reference

```
POST  /api/scan          →  Start a scan, returns scan_id
GET   /api/scan/:id      →  Get full scan result
GET   /api/history       →  List past scans
WS    ws://localhost:3000 →  Real-time scan progress
```

**WebSocket message format:**
```json
{
  "scanId": "abc123",
  "module": "ssl",
  "status": "complete",
  "result": { "valid": true, "grade": "A", "daysLeft": 87 }
}
```

---

## 🗺️ Roadmap

### Phase 1 — Backend Core
- [ ] Express server + WebSocket setup
- [ ] Headers scanner
- [ ] SSL/TLS scanner
- [ ] Port scanner
- [ ] File prober
- [ ] Orchestrator (`Promise.all` parallel runner)
- [ ] Scorer & grade engine
- [ ] SQLite scan history

### Phase 2 — Frontend
- [ ] Angular project + Tailwind setup
- [ ] URL input page
- [ ] Live WebSocket progress tracker
- [ ] Module result cards
- [ ] Score badge + severity chart

### Phase 3 — Polish
- [ ] PDF export
- [ ] Scan history page
- [ ] Dark mode
- [ ] Recommendations engine
- [ ] Docker Compose setup

---

## ⚠️ Ethical Use

> BRAUM is intended for **authorized security testing only**.  
> Only scan domains you **own or have explicit permission** to test.  
> The authors are not responsible for misuse of this tool.

---

## 👤 Author

**Yassine Nemri**  
[![GitHub](https://img.shields.io/badge/GitHub-Yassine1Nemri-181717?style=flat-square&logo=github)](https://github.com/Yassine1Nemri)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
