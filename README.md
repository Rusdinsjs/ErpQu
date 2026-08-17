# ERPQu — Enterprise Resource Planning System

[![CI/CD Pipeline](https://github.com/Rusdinsjs/erp-system/actions/workflows/ci.yml/badge.svg)](https://github.com/Rusdinsjs/erp-system/actions/workflows/ci.yml)
[![Rust Version](https://img.shields.io/badge/rust-1.80%2B-blue.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Enterprise Ready](https://img.shields.io/badge/production-enterprise--grade-success.svg)](#production-readiness)

**ERPQu** is a production-ready, enterprise-grade ERP system built with a high-performance **Rust** modular monolith backend and a modern **React / Vite / TypeScript** web frontend.

---

## 🌟 Key Features & Core Modules

### 💰 Finance & Accounting Kernel
- **Trusted Accounting Kernel**: Strict $\sum \text{Debit} = \sum \text{Credit}$ invariant enforced via application posting engine and database deferred constraint triggers.
- **Append-Only Immutability**: `gl_entries` table is protected by trigger against `UPDATE` or `DELETE`. Reversals are written as audit-linked reversing entries.
- **Accounting Period Closing**: Month-end close with automated pre-close checklist (GL balance, unposted journals, sequential period enforcement). Year-end close with P&L to Retained Earnings transfer.
- **Multi-Currency**: Daily exchange rate management, date-fallback rate lookup, currency conversion, and realized forex gain/loss calculation.
- **Indonesian Tax Compliance**: PPh 21 TER (PP 58/2023 & PMK 168/2023), PPh 23 withholding tax, VAT effective-date versioning (10% → 11% → 12%), BPJS Ketenagakerjaan & Kesehatan calculations.

### 📦 Asset Management & Operations
- **Asset Master & Lifecycle**: Complete tracking, transfers, custodian history, category templates, and geolocation mapping.
- **Preventive Maintenance**: Scheduled work orders, checklist tasks, technician assignments, digital sign-offs, and photo uploads.
- **Fuel & Telemetry**: Fuel consumption logs, efficiency calculations, IoT threshold alerts.

### 👥 Human Resources & Payroll
- **Employee 360**: Employee directory, career history, shift management, attendance logs (face scan & geolocation).
- **Payroll Engine**: Statutory overtime (SPKL under Kepmenakertrans No. 102/2004), BPJS deductions, monthly salary slip generation, and automatic GL posting bridge.

### 📡 API & Integration
- **`/api/v1/` Versioning**: URL-level version rewrite middleware with `X-API-Version: v1` header.
- **Outbound Webhook System**: Event emission (`asset.created`, `work_order.completed`, `invoice.paid`, `period.closed`) with HMAC-SHA256 signing and 5-attempt retry engine.
- **OpenAPI 3.0 Documentation**: Interactive Swagger UI at `/swagger-ui`.
- **Standardized DTOs**: Unified `ListQueryParams` (page, per_page, sort_by, sort_order, search, status, date range) and `ApiErrorResponse`.

### 🔒 Security & SRE Observability
- **JWT & Session Revocation**: Token refresh (`/api/auth/refresh`) and instantaneous revocation (`/api/auth/logout`) backed by Redis.
- **Security Headers**: HSTS, Referrer-Policy, Permissions-Policy, X-Request-ID, CSP.
- **Rate Limiting**: Proxy-aware `X-Forwarded-For` per-path rate limiting.
- **Structured JSON Logging**: `LOG_FORMAT=json` for Loki/ELK integration.
- **Prometheus Exporter**: `/metrics` endpoint returning exposition format text.
- **Three-Tier Health Probes**: `/health` (liveness), `/health/ready` (DB readiness), `/health/detailed` (diagnostics).

---

## 🏗️ Architecture

See detailed architecture guide: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

```
crates/
├── api-server/   # HTTP Server, Axum routes, middleware, OpenAPI docs
├── core/         # Domain entities, value objects, repositories, DTOs
├── finance/      # Posting engine, closing engine, multi-currency, tax
├── assets/       # Asset master, lifecycle tracking, depreciation
├── hr/           # Employees, attendance, PPh 21 TER, BPJS
├── inventory/    # Stock ledger, warehouses, stock reconciliation
├── ops/          # Work orders, quality trips, P2H inspections
└── rental/       # Rented-out operations, internal loans
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- Rust 1.80+
- PostgreSQL 17+
- Redis 7+
- Node.js 20+ / Bun

### Backend Setup
```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Run migrations
cargo run --bin management-system -- --migrate-only

# 3. Start development server
cargo run
```
API server runs on `http://localhost:8080`.
Swagger UI available at `http://localhost:8080/swagger-ui`.

### Frontend Setup
```bash
cd web-admin
npm install
npm run dev
```
Web admin UI runs on `http://localhost:5173`.

---

## 🐳 Production Deployment

See complete deployment guide: [docs/ADMIN_DEPLOYMENT.md](docs/ADMIN_DEPLOYMENT.md)

```bash
# 1. Prepare environment secrets
cp .env.production.example .env

# 2. Run migrations
docker compose -f docker-compose.prod.yml --profile migrate up

# 3. Start production stack
docker compose -f docker-compose.prod.yml up -d
```

### Kubernetes (K8s) Deployment
```bash
kubectl create namespace erpqu
kubectl apply -k ./k8s/
```

---

## 📚 Documentation Index

- [Architecture & Design](docs/ARCHITECTURE.md)
- [Admin & Deployment Operations Guide](docs/ADMIN_DEPLOYMENT.md)
- [End-User Feature Guide](docs/USER_GUIDE.md)

---

## 📄 License

Proprietary Software. All rights reserved.
