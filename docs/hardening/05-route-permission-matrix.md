# Matriks Route, Otorisasi, dan Scope Izin (Fase 5 Design Gate)

Dokumen ini memetakan seluruh rute API backend pada ERPQu terhadap resource, action, permission dot-notation, sumber resolusi company, bypass rule, dan sensitivitas data.

---

## 1. Skema Resolusi Company Context pada Route
1. **Authenticated Membership Header / Session**: `TenantContext` disuntikkan dari JWT klaim atau header `X-Company-ID` yang telah divalidasi ke tabel `user_company_memberships`.
2. **Path & Payload Rejection**: Nilai `company_id` pada path URL atau body request yang tidak sesuai dengan active membership user **wajib ditolak (403 Forbidden)**.
3. **Role Bypass Policy**: Admin/Manager tidak boleh otomatis membypass batasan company atau aturan Segregation of Duties.

---

## 2. Matriks Route Utama & Permission Mapping

| Route Pattern | HTTP Method | Resource | Action | Permission Dot-Notation | Company Source | Data Scope | Role Bypass Permitted? | Sensitivitas Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | `auth` | `authenticate` | `public` | None (Pre-Auth) | Global | N/A | High (Kredensial) |
| `/api/auth/refresh` | `POST` | `auth` | `refresh_token` | `public` | Token JTI | User | N/A | High (Token) |
| `/api/auth/me` | `GET` | `user` | `read` | `authenticated` | Token Context | Own | No | Medium |
| `/api/companies` | `GET` | `company` | `read` | `company.read` | User Memberships | Organization | No | Low |
| `/api/companies` | `POST` | `company` | `create` | `company.create` | Token Context | Organization | No (Admin only) | High |
| `/api/branches` | `GET` | `branch` | `read` | `branch.read` | `TenantContext` | Company | No | Low |
| `/api/cost-centers` | `GET` | `cost_center` | `read` | `cost_center.read` | `TenantContext` | Company | No | Low |
| `/api/finance/journal-entries` | `GET` | `journal` | `read` | `finance.journal.read` | `TenantContext` | Company | No | High (Keuangan) |
| `/api/finance/journal-entries` | `POST` | `journal` | `create` | `finance.journal.create` | `TenantContext` | Company | No (Maker only) | High (Keuangan) |
| `/api/finance/journal-entries/:id/post` | `POST` | `journal` | `post` | `finance.journal.post` | `TenantContext` | Company | **NO (SoD Enforced)** | Critical (GL Lock) |
| `/api/finance/journal-entries/:id/reverse`| `POST` | `journal` | `reverse` | `finance.journal.reverse` | `TenantContext` | Company | **NO (SoD Enforced)** | Critical (GL Lock) |
| `/api/finance/payment-entries` | `GET` | `payment` | `read` | `finance.payment.read` | `TenantContext` | Company | No | High |
| `/api/finance/payment-entries` | `POST` | `payment` | `create` | `finance.payment.create` | `TenantContext` | Company | No (Maker only) | High |
| `/api/finance/payment-entries/:id/approve`| `POST` | `payment` | `approve` | `finance.payment.approve` | `TenantContext` | Company | **NO (SoD Enforced)** | Critical (Dana Keluar) |
| `/api/purchase-orders` | `GET` | `purchase_order` | `read` | `procurement.po.read` | `TenantContext` | Company / Branch | No | Medium |
| `/api/purchase-orders` | `POST` | `purchase_order` | `create` | `procurement.po.create` | `TenantContext` | Company | No (Maker only) | High |
| `/api/purchase-orders/:id/approve` | `POST` | `purchase_order` | `approve` | `procurement.po.approve` | `TenantContext` | Company | **NO (SoD Enforced)** | High |
| `/api/purchase-bills` | `POST` | `purchase_bill` | `create` | `procurement.bill.create` | `TenantContext` | Company | No (Maker only) | High |
| `/api/purchase-bills/:id/approve` | `POST` | `purchase_bill` | `approve` | `procurement.bill.approve` | `TenantContext` | Company | **NO (SoD Enforced)** | High |
| `/api/sales-orders` | `POST` | `sales_order` | `create` | `sales.order.create` | `TenantContext` | Company | No | Medium |
| `/api/sales-invoices` | `POST` | `sales_invoice` | `create` | `sales.invoice.create` | `TenantContext` | Company | No | High |
| `/api/stock-entries` | `POST` | `stock_entry` | `create` | `inventory.stock.create` | `TenantContext` | Company / Warehouse | No | High (Fisik Barang) |
| `/api/stock-entries/:id/submit` | `POST` | `stock_entry` | `submit` | `inventory.stock.submit` | `TenantContext` | Company / Warehouse | **NO (SoD Enforced)** | Critical (Mutasi Ledger) |
| `/api/assets` | `GET` | `asset` | `read` | `asset.read` | `TenantContext` | Company / Branch | No | Medium |
| `/api/assets` | `POST` | `asset` | `create` | `asset.create` | `TenantContext` | Company | No | High (Kapitalisasi) |
| `/api/assets/:id/depreciate` | `POST` | `asset` | `post` | `asset.depreciation.post` | `TenantContext` | Company | No | High (Biaya Buku) |
| `/api/work-orders` | `POST` | `work_order` | `create` | `ops.work_order.create` | `TenantContext` | Company / Site | No | Medium |
| `/api/work-orders/:id/complete` | `POST` | `work_order` | `submit` | `ops.work_order.complete` | `TenantContext` | Company / Site | No | Medium |
| `/api/contracts` | `POST` | `contract` | `create` | `rental.contract.create` | `TenantContext` | Company | No | High (Legalitas) |
| `/api/contracts/:id/approve` | `POST` | `contract` | `approve` | `rental.contract.approve` | `TenantContext` | Company | **NO (SoD Enforced)** | Critical (Komitmen Nilai) |
| `/api/hr/employees` | `GET` | `employee` | `read` | `hr.employee.read` | `TenantContext` | Company / Branch | No | High (PII) |
| `/api/hr/employees` | `POST` | `employee` | `create` | `hr.employee.create` | `TenantContext` | Company | No | High (PII) |
| `/api/hr/payroll/calculate` | `POST` | `payroll` | `create` | `hr.payroll.calculate` | `TenantContext` | Company | No (Maker only) | Critical (Finansial) |
| `/api/hr/payroll/:id/approve` | `POST` | `payroll` | `approve` | `hr.payroll.approve` | `TenantContext` | Company | **NO (SoD Enforced)** | Critical (Gaji Karyawan) |
| `/api/hr/payroll/:id/disburse` | `POST` | `payroll` | `post` | `hr.payroll.disburse` | `TenantContext` | Company | **NO (SoD Enforced)** | Critical (Kas Keluar) |
| `/api/uploads` | `POST` | `upload` | `create` | `upload.file` | `TenantContext` | Company | No | Medium |
| `/api/uploads/*` | `GET` | `upload` | `read` | `upload.read` | Metadata Lookup | Company / Own | No (IDOR Protected) | Medium-High |
| `/api/audit-logs` | `GET` | `audit` | `read` | `audit.log.read` | `TenantContext` | Company / Org | No (Auditor only) | Critical (Compliance) |
