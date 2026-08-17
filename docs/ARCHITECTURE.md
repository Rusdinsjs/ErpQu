# ERPQu System Architecture & Engineering Design

## System Overview

ERPQu is an enterprise-grade modular monolith ERP system engineered in **Rust** (backend) and **React / TypeScript / Vite** (web admin). The architecture emphasizes strict type safety, zero runtime panics, high concurrency performance, double-entry accounting integrity, and multi-tenant isolation.

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
                                     │ Reverse Proxy (:8080)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Axum API Gateway                              │
│   • CORS Dynamic Policy  • Security Headers  • API Version Rewrite     │
│   • Rate Limiting        • Request Tracing   • Tenant Context Auth      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   Asset Crate      │    │   Finance Crate    │    │      HR Crate      │
│ Lifecycle & Assets │    │ Accounting Kernel  │    │ Attendance & Payroll│
└──────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Core Infrastructure                            │
│    • PostgreSQL 17 (6 Schemas: public, hr, crm, finance, inventory, ops)│
│    • Redis 7 (Authenticated Session Tracker & Token Revocation Cache)   │
│    • Outbound Webhook Delivery Engine (HMAC-SHA256 Signed)             │
│    • Prometheus Metrics Exporter (/metrics)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Layers & Workspace Crates

| Crate | Responsibility | Technologies |
|-------|----------------|--------------|
| `crates/api-server` | HTTP Server, Routing, Handlers, Middleware, OpenAPI | Axum, Tokio, Utoipa, Tower-HTTP |
| `crates/core` | Domain Entities, Value Objects, Repositories, DTOs, Auth | SQLx, Serde, Chrono, Rust Decimal |
| `crates/finance` | Posting Engine, Closing Engine, Multi-Currency, Indonesian Tax | Double-Entry Kernel, Decimal |
| `crates/assets` | Asset Master, Lifecycle State Machine, Depreciation | SQLx, Rust Decimal |
| `crates/hr` | Employee Directory, Attendance, TER PPh 21, BPJS | SQLx, Chrono |
| `crates/inventory` | Stock Balance, Stock Ledger, Warehouses, Opname | SQLx, Serde |
| `crates/ops` | Quality Trips, P2H Inspections, Maintenance | SQLx |
| `crates/rental` | Rented-Out Operations, Internal Loans, Contracts | SQLx |

---

## Data Integrity & Financial Invariants

1. **Double-Entry Accounting Rule**: $\sum \text{Debit} = \sum \text{Credit}$ enforced both in application posting engine (`posting_engine.rs`) and via PostgreSQL deferred `CONSTRAINT TRIGGER`.
2. **General Ledger Immutability**: `gl_entries` table is append-only. UPDATE and DELETE operations trigger PostgreSQL exceptions (`prevent_gl_entries_mutation`). Reversals are written as distinct reversing entries.
3. **Sequential Period Closing**: Month-end closing validates zero GL variance, zero unposted draft journals, and prior period closed state. Year-end closing automatically calculates P&L and posts net income to Retained Earnings.
4. **Indonesian Tax Engines**:
   - PPh 21 TER (Category A, B, C under PP 58/2023 & PMK 168/2023)
   - Statutory BPJS Ketenagakerjaan & Kesehatan with salary ceilings
   - Effective date-versioned VAT (PPN 10% → 11% → 12%)

---

## Security Architecture

- **Authentication**: JWT signed tokens with unique JTI identifiers.
- **Session Revocation**: In-memory & Redis `SessionTracker` allowing instantaneous logouts and token rotation via `/api/auth/refresh`.
- **RBAC & User Permissions**: Hierarchical role-level enforcement combined with Frappe/ERPNext-style `DocPerm` and `UserPermission` row-level filtering.
- **Reverse Proxy Defense**: Per-endpoint rate limiting zones, security headers (CSP, HSTS, Referrer-Policy, Permissions-Policy), and IP proxy-aware rate limiters.

---

## Multi-Tenancy Design

1. **Tenant Context Resolution**: Resolved via `X-Company-ID` HTTP header or Subdomain matching (`acme.erpqu.com` → `domain_slug = 'acme'`).
2. **Membership Enforcement**: Non-admin users are strictly blocked from requesting data outside their explicitly assigned company membership.
