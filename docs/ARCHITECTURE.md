# ERPQu System Architecture & Engineering Design

## 1. System Overview

ERPQu is an enterprise-grade modular monolith ERP system engineered in **Rust** (backend) and **React 18 / TypeScript / Vite** (web admin). The architecture emphasizes strict type safety, zero runtime panics, high concurrency performance, double-entry accounting integrity, and multi-tenant corporate isolation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Applications                           │
│     Web Admin (React/Vite)   │   Mobile App (Flutter)   │   Third-Party  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / WSS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy & TLS                          │
│     • Rate Limiting (Zones)  • Let's Encrypt TLS 1.3  • Gzip / HTTP/2     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Reverse Proxy (:8181)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Axum API Gateway                              │
│   • CORS Dynamic Policy   • Security Headers   • Dual Routing /api & /v1│
│   • Token Blacklisting    • Request Tracing    • Multi-Tenant Isolation │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
       ┌───────────────────┬─────────┴─────────┬───────────────────┐
       ▼                   ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Finance Crate │    │Inventory     │    │CRM Crate     │    │Ops & Mfg     │
│• GL Isolation│    │• ABC Pareto  │    │• Pipeline    │    │• BOM Explode │
│• PSAK COA    │    │• Stock Alert │    │• Win/Loss    │    │• SPK Orders  │
│• e-Faktur DJP│    │• Ledger FIFO │    │• Leads       │    │• Quality Gate│
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       └───────────────────┼───────────────────┴───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Core Infrastructure                            │
│    • PostgreSQL 17 (Schemas: public, hr, crm, finance, inventory, ops)  │
│    • Redis 7 (Authenticated Session Tracker & Token Revocation Cache)   │
│    • Outbound Webhook Delivery Engine (HMAC-SHA256 Signed)             │
│    • WhatsApp Notification Gateway (Indonesian Telco Normalization)    │
│    • Prometheus Metrics Exporter (/metrics) & Swagger UI (/swagger-ui)  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Layers & Workspace Crates

| Crate | Responsibility | Key Domain Logic |
|---|---|---|
| `crates/api-server` | HTTP Gateway, Route Versioning (`/api/v1/`), Handlers, Swagger UI | Axum, Tower-HTTP, Utoipa |
| `crates/core` | Core Domain Entities, RBAC, Tenancy, WhatsApp Gateway, Outbox Engine | SQLx, Serde, Chrono, Rust Decimal |
| `crates/finance` | Multi-Tenant CoA, Posting Engine, Budget Variance, e-Faktur DJP | Double-Entry Invariant, PSAK Standard |
| `crates/inventory` | Stock Balance, Stock Documents, ABC Pareto Analysis, Low Stock Alerts | Pareto 80/20 Math, Deficit Engine |
| `crates/crm` | Lead Management, Multi-Stage Opportunity Pipeline, Win/Loss Funnel | Funnel Analytics, Sales Stage Lifecycle |
| `crates/ops` | Bill of Materials (BOM), Production Orders (SPK), Quality Control, Inspections | Scrap Multipliers, QC Tolerance Invariants |
| `crates/assets` | Fixed Asset Master, Depreciation (Straight-Line, DDB, SYD), Asset Disposal | Capitalization, Book Value Validation |
| `crates/rental` | Heavy Equipment Rental Contracts, Mobilization, Rental Billing Cycles | Billing Scheduling, Overdue Accruals |
| `crates/hr` | Employee Directory, Attendance, Payroll, TER PPh 21, BPJS Ketenagakerjaan | Indonesian Tax & BPJS Formulas |
| `crates/commercial` | Decoupled Pricing Rules, Quotations, Price Lists | Decoupled Sales Contracts |

---

## 3. Multi-Tenancy & Data Isolation Model

ERPQu enforces a **Shared Database, Logical Schema & Row-Level Security (RLS)** multi-tenancy model:

1. **Company Isolation**:
   - Master entities (`chart_of_accounts`, `account_mappings`, `inventory_items`, `boms`, `production_orders`, `opportunities`) require a mandatory `company_id: Uuid`.
   - SQL queries strictly bind `company_id = $1` resolved from the validated JWT token via `TenantExtractor` / `TenantContext`.
2. **Schema Organization**:
   - `public`: Core platforms, users, companies, roles, permissions.
   - `inventory`: `inventory_items`, `inventory_categories`, `stock_ledger_entries`.
   - `crm`: `leads`, `opportunities`, `crm_activities`.
   - `ops`: `boms`, `bom_items`, `production_orders`, `work_orders`, `qc_inspections`.
   - `rental`: `rentals`, `rental_billings`, `rental_assets`.
   - `hr`: `employees`, `attendance`, `payroll`, `leaves`.

---

## 4. Core Domain Invariants & Mathematical Guarantees

### A. Double-Entry Accounting Invariant
- Every journal voucher and invoice posting enforces $\sum \text{Debit} = \sum \text{Credit}$ down to the exact sub-unit (using `rust_decimal::Decimal`, never floating-point `f64`).
- Imbalanced journals are rejected with atomic rollback before hitting persistence.

### B. Bill of Materials (BOM) Material Exploding Math
$$\text{Gross Required Qty} = \text{Target Order Qty} \times \text{Item Component Qty} \times \left(1 + \frac{\text{Scrap Rate \%}}{100}\right)$$
This ensures material procurement always accounts for operational waste and manufacturing tolerances.

### C. ABC Inventory Pareto Distribution
- **Class A**: Top 70% of cumulative inventory valuation (Weekly cycle count audit).
- **Class B**: Next 20% of cumulative inventory valuation (Monthly cycle count audit).
- **Class C**: Remaining 10% of cumulative inventory valuation (Semi-annual audit).

### D. Quality Control (QC) Gatekeeping Invariant
- Items received under strict QC cannot transition to available stock without an accepted inspection record where all measured parameters fall within nominal tolerances $[\text{Min}, \text{Max}]$.

---

## 5. Security Architecture

1. **Authentication**: JWT token with Bearer scheme, HS256 signature, and token revocation via Redis authenticated blacklist (`jti` tracking).
2. **Brute-Force Protection**: Automatic login lockout after 5 consecutive failed attempts with a 15-minute exponential backoff window.
3. **Password Hashing**: Argon2id cryptographic hashing with enterprise-grade salt and cost factors.
4. **Database Privilege Separation**:
   - `postgres` (Superuser): Only used during container initialization and `sqlx migrate run`.
   - `erpqu_app` (Restricted Application User): Only possesses DML rights (`SELECT, INSERT, UPDATE, DELETE`) with no DDL permissions (`DROP TABLE, ALTER`).

---

## 6. Frontend Architecture (Web Admin)

- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS with enterprise neutral palettes and responsive breakpoints.
- **Dynamic Routing**: Accordion sidebar with automatic group discovery, dynamic Launchpad doc types, and React `lazy` code-splitting.
- **State Management**: Zustand lightweight reactive stores with session persistence.
