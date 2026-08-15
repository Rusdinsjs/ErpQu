# ADR: PostgreSQL Row-Level Security (RLS) as Second Line of Defense

## Status
**APPROVED** (Design Gate Fase 5)

## Konteks & Masalah
Otorisasi di tingkat aplikasi rentan terhadap kesalahan manusia (misal: developer lupa menambahkan klausa `WHERE company_id = $1` pada raw SQL query). Diperlukan lapisan pertahanan kedua pada tingkat mesin database PostgreSQL untuk menjamin data tidak akan pernah bocor meskipun terjadi celah logika di lapisan kode aplikasi.

## Keputusan Arsitektur
1. **RLS sebagai Pertahanan Kedua (Defense-in-Depth)**:
   - Seluruh tabel transaksional dan ledger wajib mengaktifkan Row-Level Security: `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.
   - Kebijakan RLS diterapkan secara ketat pada role aplikasi `erpqu_app`.
2. **Runtime Role Tanpa Bypass RLS**:
   - Role `erpqu_app` dilarang memiliki atribut `SUPERUSER` atau `BYPASSRLS`.
   - Hanya role migrasi `erpqu_migrator` yang dapat memanipulasi DDL dan skema.
3. **Session Context Parameters**:
   Sebelum mengeksekusi query bisnis, koneksi pool menyetel parameter sesi:
   ```sql
   SET LOCAL app.current_tenant_id = '<ORGANIZATION_UUID>';
   SET LOCAL app.current_company_id = '<COMPANY_UUID>';
   SET LOCAL app.current_user_id = '<USER_UUID>';
   ```
4. **Formulasi Kebijakan Standar**:
   ```sql
   CREATE POLICY company_isolation_policy ON public.journal_entries
       FOR ALL
       TO erpqu_app
       USING (
           company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
           OR (current_setting('app.is_super_tenant', true) = 'true')
       )
       WITH CHECK (
           company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
       );
   ```
5. **Larangan `company_id IS NULL` pada Tabel Transaksi**:
   - Seluruh tabel transaksi keuangan dan operasional wajib mendefinisikan kolom `company_id UUID NOT NULL REFERENCES companies(id)`.

## Konsekuensi
- **Positif**: Jaminan matematis bahwa kebocoran data lintas perusahaan dieliminasi pada level kernel database PostgreSQL.
- **Tantangan**: Overhead minimal pada set parameter sesi per transaksi koneksi pool; diatasi dengan koneksi transaksi terpadu di `CommandContext`.
