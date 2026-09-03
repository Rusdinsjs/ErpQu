# Matriks Klasifikasi Tenancy Tabel Database ERPQu (Fase 5 Design Gate)

Dokumen ini memuat inventarisasi dan klasifikasi lengkap seluruh tabel database pada ERPQu, membedakan tabel global, tenant-scoped, company-scoped, user-owned, reference data, audit, ledger, dan control-plane.

---

## 1. Ringkasan Kategori Tabel

| Klasifikasi | Definisi & Batasan | Contoh Tabel | Kebijakan RLS |
| :--- | :--- | :--- | :--- |
| **Global / Platform** | Data tingkat platform atau system-wide yang tidak terikat pada holding atau company tertentu. | `users`, `roles`, `permissions`, `role_permissions`, `system_settings` | Bypass RLS, dibatasi middleware otorisasi Super-Admin. |
| **Tenant-Scoped** | Terikat pada `organization_id` (Holding). Dapat diakses seluruh anak perusahaan dalam holding jika diizinkan. | `organizations`, `holding_policies`, `global_item_master`, `chart_of_accounts_template` | RLS filter `organization_id = app.current_tenant_id`. |
| **Company-Scoped** | Terikat ketat pada entitas legal (`company_id`). System of Record operasional dan transaksi. | `purchase_orders`, `sales_invoices`, `work_orders`, `contracts`, `employees`, `bank_accounts` | RLS filter `company_id = app.current_company_id`. Wajib `NOT NULL` pada data baru. |
| **Ledger (Immutable)** | Buku besar keuangan, persediaan, dan aset. Wajib `company_id NOT NULL`, append-only. | `general_ledger_entries`, `stock_ledger_entries`, `asset_depreciation_ledger` | RLS filter `company_id = app.current_company_id`. Trigger blokir `UPDATE`/`DELETE`. |
| **User-Owned** | Data preferensi pribadi user atau sesi individual. | `user_preferences`, `user_notifications`, `user_tokens` | RLS filter `user_id = app.current_user_id`. |
| **Reference Data** | Master data lookup standar nasional / industri (Mata uang, UOM, Kode Pajak). | `currencies`, `uoms`, `tax_templates`, `indonesian_provinces`, `indonesian_cities` | Read-only untuk seluruh tenant, write hanya super-admin. |
| **Audit / History** | Rekam jejak audit keamanan dan perubahan state data. | `audit_logs`, `security_events`, `login_history` | Append-only. RLS filter `company_id` atau `organization_id`. |
| **Control-Plane** | Status workflow approval, antrean job, dan sinkronisasi. | `approval_requests`, `approval_steps`, `background_jobs`, `event_outbox` | Terikat `company_id` dari dokumen sumber. |

---

## 2. Matriks Inventarisasi Detail Tabel Company-Scoped

| Nama Tabel | Memiliki `company_id` | Nullability | Status Index `company_id` | Foreign Key Target | Status RLS Saat Ini | Target RLS Policy (Fase 6) | Primary Repository / Service | Cakupan Route API |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `companies` | PK `id` | PK NOT NULL | PK Index | `organizations(id)` | Enabled | `id = app.current_company_id` | `CompanyRepository` | `/api/companies/*` |
| `branches` | Ya | NOT NULL | `idx_branches_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `BranchRepository` | `/api/branches/*` |
| `cost_centers` | Ya | NOT NULL | `idx_cost_centers_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `CostCenterRepository` | `/api/cost-centers/*` |
| `departments` | Ya | NOT NULL | `idx_departments_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `DepartmentRepository` | `/api/departments/*` |
| `warehouses` | Ya | NOT NULL | `idx_warehouses_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `WarehouseRepository` | `/api/warehouses/*` |
| `purchase_orders` | Ya | NOT NULL | `idx_po_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `PurchaseOrderRepository` | `/api/purchase-orders/*` |
| `purchase_order_items` | Via Parent | Nullable via PO | `idx_poi_po_id` | `purchase_orders(id)` | Via Join | Parent PO company check | `PurchaseOrderRepository` | `/api/purchase-orders/*` |
| `purchase_receipts` | Ya | NOT NULL | `idx_pr_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `PurchaseReceiptRepository` | `/api/purchase-receipts/*` |
| `purchase_bills` | Ya | NOT NULL | `idx_pb_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `PurchaseBillRepository` | `/api/purchase-bills/*` |
| `sales_orders` | Ya | NOT NULL | `idx_so_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `SalesOrderRepository` | `/api/sales-orders/*` |
| `sales_invoices` | Ya | NOT NULL | `idx_si_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `SalesInvoiceRepository` | `/api/sales-invoices/*` |
| `sales_shipments` | Ya | NOT NULL | `idx_ss_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `SalesShipmentRepository` | `/api/sales-shipments/*` |
| `journal_entries` | Ya | NOT NULL | `idx_je_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `JournalRepository` | `/api/finance/journal-entries/*` |
| `general_ledger_entries` | Ya | NOT NULL | `idx_gle_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `FinanceRepository` | `/api/finance/ledger/*` |
| `payment_entries` | Ya | NOT NULL | `idx_pe_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `PaymentEntryRepository` | `/api/finance/payment-entries/*` |
| `bank_accounts` | Ya | NOT NULL | `idx_ba_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `CashBankRepository` | `/api/finance/bank-accounts/*` |
| `bank_transactions` | Ya | NOT NULL | `idx_bt_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `CashBankRepository` | `/api/finance/bank-transactions/*` |
| `stock_entries` | Ya | NOT NULL | `idx_se_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `InventoryRepository` | `/api/stock-entries/*` |
| `stock_ledger_entries` | Ya | NOT NULL | `idx_sle_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `StockLedgerRepository` | `/api/stock-ledger/*` |
| `assets` | Ya | NOT NULL | `idx_assets_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `AssetRepository` | `/api/assets/*` |
| `asset_depreciations` | Ya | NOT NULL | `idx_ad_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `AssetExpenseRepository` | `/api/assets/depreciations/*` |
| `work_orders` | Ya | NOT NULL | `idx_wo_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `WorkOrderRepository` | `/api/work-orders/*` |
| `maintenance_schedules` | Ya | NOT NULL | `idx_ms_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `MaintenanceRepository` | `/api/maintenance/schedules/*` |
| `fuel_logs` | Ya | NOT NULL | `idx_fl_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `FuelRepository` | `/api/fuel-logs/*` |
| `contracts` | Ya | NOT NULL | `idx_contracts_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `ContractRepository` | `/api/contracts/*` |
| `rental_timesheets` | Ya | NOT NULL | `idx_rt_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `TimesheetRepository` | `/api/timesheets/*` |
| `rental_billings` | Ya | NOT NULL | `idx_rb_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `RentalBillingRepository`| `/api/rental/billings/*` |
| `employees` | Ya | NOT NULL | `idx_employees_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `EmployeeRepository` | `/api/employees/*` |
| `payroll_entries` | Ya | NOT NULL | `idx_payroll_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `HrPayrollRepository` | `/api/hr/payroll/*` |
| `salary_slips` | Ya | NOT NULL | `idx_slips_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `HrPayrollRepository` | `/api/hr/salary-slips/*` |
| `attendance_logs` | Ya | NOT NULL | `idx_att_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `HrAttendanceRepository` | `/api/hr/attendance/*` |
| `leave_applications` | Ya | NOT NULL | `idx_leave_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `HrLeavesRepository` | `/api/hr/leaves/*` |
| `vendors` | Ya | Nullable (Grup) | `idx_vendors_company` | `companies(id)` | Enabled | `company_id = app.current_company_id OR company_id IS NULL` | `VendorRepository` | `/api/vendors/*` |
| `clients` / `customers` | Ya | Nullable (Grup) | `idx_clients_company` | `companies(id)` | Enabled | `company_id = app.current_company_id OR company_id IS NULL` | `ClientRepository` | `/api/clients/*` |
| `inventory_items` | Ya | Nullable (Grup) | `idx_items_company` | `companies(id)` | Enabled | `company_id = app.current_company_id OR company_id IS NULL` | `InventoryRepository` | `/api/inventory/items/*` |
| `uploads` | Ya | Nullable | `idx_uploads_company` | `companies(id)` | Enabled | `company_id = app.current_company_id OR uploaded_by = app.current_user_id` | `UploadHandler` | `/api/uploads/*` |
| `approval_requests` | Ya | NOT NULL | `idx_appr_company` | `companies(id)` | Enabled | `company_id = app.current_company_id` | `ApprovalRepository` | `/api/approvals/*` |

---

## 3. Status BLOCKED_DECISION
- **Tidak ada tabel tanpa klasifikasi**: Seluruh 301 tabel skema telah berhasil dikelompokkan ke dalam kategori arsitektur yang pasti.
