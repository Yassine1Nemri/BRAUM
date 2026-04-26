<div align="center">

# 🛡️ BRAUM

### Website Security Posture Scanner

**Scan any URL for real security vulnerabilities — headers, SSL/TLS, open ports, and exposed files.**  
Built for small teams and startups who care about security without enterprise tooling.

<br/>

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Live-brightgreen?style=for-the-badge)

![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## 🔍 What is BRAUM?

BRAUM is a **full-stack DevSecOps web application** that performs a real-time security audit on any publicly accessible website. Enter a URL and get a live security grade — like running SSL Labs, SecurityHeaders.io, and a basic recon tool all at once.

> Built from scratch as a hands-on DevSecOps learning project — every scanner, every endpoint, every component written and understood line by line.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🧢 **Headers Scanner** | Checks CSP, HSTS, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| 🔐 **SSL/TLS Analyzer** | Validates certificate, checks expiry, TLS version (1.2/1.3), flags weak ciphers |
| 🔌 **Port Scanner** | Probes 14 common ports, flags dangerous ones (3306, 6379, 27017 exposed publicly) |
| 📂 **File Prober** | Tries sensitive paths like `/.env`, `/.git`, `/admin`, `/wp-config.php` |
| 🏆 **Security Grade** | Combines all modules into a final A → F grade with per-module breakdown |
| 📊 **Live Dashboard** | Real-time scan progress via WebSocket + polling fallback |
| 🕘 **Scan History** | Stores and retrieves past scans (SQLite) |
| ⏱️ **Timeout Protection** | 30s global scan timeout, prevents hanging on slow/malicious targets |

---

## 🏗️ Architecture

```
braum/
├── src/                         # Node.js + Express Backend
│   ├── index.ts                 # Express server + HTTP server
│   ├── scanners/
│   │   ├── headers.scanner.ts   # HTTP response header analysis
│   │   ├── ssl.scanner.ts       # TLS/cert checker
│   │   ├── ports.scanner.ts     # TCP socket port scanner
│   │   └── files.scanner.ts     # Sensitive path prober
│   ├── engine/
│   │   ├── orchestrator.ts      # Promise.allSettled runner + WS emitter
│   │   └── scorer.ts            # A-F grade calculator
│   ├── websocket/
│   │   └── ws.server.ts         # Real-time WebSocket server
│   └── db/
│       └── database.ts          # SQLite scan history
│
└── braum-frontend/              # Angular 17 SPA
    └── src/app/
        ├── pages/
        │   ├── home/            # URL input + scan trigger
        │   └── dashboard/       # Live results + grade
        └── shared/
            ├── score-badge/     # A/B/C/D/F colored badge
            └── module-card/     # Per-module result card
```

---

## 🧰 Tech Stack

**Frontend** — Angular 17, TailwindCSS, WebSocket client  
**Backend** — Node.js, Express, TypeScript, `ws`, `axios`, `ssl-checker`, `net` (built-in), `better-sqlite3`  
**Validation** — Zod  
**Security middleware** — Helmet, CORS

---

## 📊 Scoring System

| Module  | Weight | Key Signals |
|---------|--------|-------------|
| Headers | 30%    | 6 security headers × ~16pts each |
| SSL/TLS | 30%    | Validity + expiry + TLS 1.3 support |
| Ports   | 20%    | -20pts per dangerous open port |
| Files   | 20%    | -50pts CRITICAL, -20pts HIGH, -10pts MEDIUM |

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
- Node.js 20+
- Angular CLI 17+

### Installation

```bash
# Clone the repo
git clone https://github.com/Yassine1Nemri/BRAUM.git
cd BRAUM

# Backend
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
POST  /api/scan          →  Start a scan, returns scanId
GET   /api/scan/:id      →  Get full scan result
GET   /api/history       →  List past scans
WS    ws://localhost:3000/ws?scanId=:id  →  Real-time progress
```

---

## 🗺️ Roadmap

- [x] Headers scanner
- [x] SSL/TLS scanner  
- [x] Port scanner
- [x] Sensitive file prober
- [x] Scoring engine (A-F grade)
- [x] Real-time WebSocket dashboard
- [x] Scan history (SQLite)
- [x] Global scan timeout
- [ ] PDF report export
- [ ] DNS/SPF/DMARC analysis
- [ ] CORS misconfiguration detection
- [ ] Docker Compose
- [ ] Deploy online

---

## ⚠️ Ethical Use

> BRAUM is intended for **authorized security testing only**.  
> Only scan domains you **own or have explicit permission** to test.

---

## 👤 Author

**Yassine Nemri**  
[![GitHub](https://img.shields.io/badge/GitHub-Yassine1Nemri-181717?style=flat-square&logo=github)](https://github.com/Yassine1Nemri)

---

## 📄 License

MIT License
