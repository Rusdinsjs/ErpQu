# Implementasi Tenancy, RBAC, Segregation of Duties (SoD), dan PostgreSQL RLS (Fase 6)

## 1. Ringkasan Implementasi
Pada Fase 6, model arsitektur yang dirancang pada Fase 5 telah diimplementasikan secara konkret pada skema database, domain kernel, dan middleware aplikasi.

---

## 2. Rincian Komponen yang Diterapkan

### A. Forward-Only Migration RLS & Indeks Tenancy
- **File**: `migrations/20260818000001_phase6_enforce_strict_tenant_rls_and_indexes.sql`
- **Cakupan Tabel**:
  - `journal_entries`, `general_ledger_entries`, `payment_entries`, `purchase_orders`, `stock_entries`, `payroll_entries`.
- **Fitur Database**:
  1. Penambahan kolom `company_id UUID` jika belum tersedia.
  2. Pembuatan B-Tree index pada kolom `company_id`.
  3. Pengaktifan Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
  4. Formulasi kebijakan isolasi data:
     ```sql
     CREATE POLICY <table_name>_tenant_isolation_policy ON public.<table_name>
         FOR ALL
         USING (
             company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
             OR current_setting('app.is_super_tenant', true) = 'true'
         )
         WITH CHECK (
             company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
             OR current_setting('app.is_super_tenant', true) = 'true'
         );
     ```

### B. Segregation of Duties (SoD) Kernel
- **File**: `crates/core/src/domain/sod.rs`
- **Aturan Pencegahan Fraud**:
  - `SOD-004`: Pembuat Purchase Order dilarang menyetujui PO sendiri (`validate_po_approval`).
  - `SOD-003`: Pembuat Journal Entry dilarang mem-posting voucher ke General Ledger (`validate_journal_posting`).
  - `SOD-009`: Pembuat Stock Entry dilarang melakukan submit/posting saldo fisik (`validate_stock_entry_submit`).
  - `SOD-006`: Penyusun Payroll dilarang menyetujui pencairan gaji (`validate_payroll_approval`).

### C. TenantContext Boundary Enforcements
- **File**: `crates/core/src/domain/tenant.rs`
- **Mekanisme**:
  - `enforce_boundary`: Menolak akses lintas `tenant_id` (401/403 Fail-Closed).
  - `enforce_company_boundary`: Menolak akses lintas `company_id` (401/403 Fail-Closed).

---

## 3. Test Suite Integrasi (Fase 6)
- File: `crates/core/tests/tenant_rbac_sod_rls_tests.rs`
  - `test_cross_tenant_isolation_boundary`: **PASS**
  - `test_cross_company_isolation_boundary`: **PASS**
  - `test_sod_purchase_order_approval_violation`: **PASS**
  - `test_sod_journal_posting_violation`: **PASS**
  - `test_sod_stock_entry_submit_violation`: **PASS**
  - `test_sod_payroll_approval_violation`: **PASS**
  - `test_sod_valid_separate_checker_permitted`: **PASS**
