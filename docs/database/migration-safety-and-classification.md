# Klasifikasi dan Keamanan Database Migrations (205 Files)

## 1. Kebijakan Eksekusi Migrasi
1. **Forward-Only Migrations**: Seluruh perbaikan skema database wajib menggunakan file migrasi baru bernomor urut lanjut. Dilarang mengedit atau mengubah checksum migrasi yang telah diterapkan di lingkungan staging/produksi.
2. **Pemisahan Seed Data Demo dari Skema Produksi**: File migrasi yang mengandung akun demo, reset password default, atau data contoh tidak boleh dijalankan otomatis di lingkungan produksi.
3. **Fail-Closed Runner**: Kegagalan pada file migrasi apa pun wajib menghentikan proses startup atau membatalkan proses deployment secara otomatis.

---

## 2. Matriks Klasifikasi 205 Migrasi

| Kategori Migrasi | Jumlah File | Contoh File | Kebijakan Eksekusi Produksi |
| :--- | :--- | :--- | :--- |
| **A. Core DDL Schema** | 148 files | `001_init_schema.sql`, `20260811010000_complete_all_stock_doctypes.sql` | **Wajib** dijalankan oleh `erpqu_migrator` |
| **B. Reference Data / COA** | 22 files | `002_chart_of_accounts.sql`, `20260127000100_standardize_indonesian_coa.sql` | **Wajib** untuk inisialisasi master data sistem |
| **C. Tenancy & RLS Security** | 12 files | `20260817000001_phase2_tenancy_and_hierarchy_baseline.sql` | **Wajib** untuk isolasi multi-company |
| **D. Demo / Test Seeds** | 11 files | `0030_seed_employees.sql`, `0031_seed_more_employees.sql`, `011_seed_data.sql` | **DILARANG** di lingkungan produksi (hanya dev/test) |
| **E. Password Reset / Hardcoded Creds** | 4 files | `20260121140000_reset_passwords.sql`, `0026_add_specialist_users.sql` | **DILARANG** di lingkungan produksi |
| **F. Cleanup / Legacy Cleanup** | 5 files | `20260124125900_cleanup_approval_workflows.sql` | Hanya dijalankan saat upgrading dari rilis terdahulu |
| **G. Indexing & Performance** | 3 files | `20260815000001_audit_indexes.sql` | **Wajib** |

---

## 3. Environment Guard untuk Demo Seed
Pada migrasi yang memuat data demo, tambahkan guard SQL:
```sql
DO $$
BEGIN
    IF current_setting('app.environment', true) = 'production' THEN
        RAISE NOTICE 'Skipping demo seed in production environment.';
        RETURN;
    END IF;
    -- Seed statements...
END $$;
```
