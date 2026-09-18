# Status Pelaksanaan Hardening ERPQu (Post-Audit Corrective Gates)

> **Dokumen ini adalah sumber kebenaran (source of truth) untuk status kesiapan rilis.**
> `docs/runbook/RELEASE_READINESS.md` bersifat historis — ia mencatat klaim penutupan
> Fase 0–14 pada tanggalnya dan **tidak** diperbarui setiap kali ditemukan regresi.
> Jika kedua dokumen berbeda, gunakan tabel di bawah ini.
>
> Pembaruan 2026-09-10: audit ulang menemukan regresi yang membuat klaim "sealed"
> pada RELEASE_READINESS tidak lagi akurat. Gate 3 dan Gate 4 diturunkan kembali
> menjadi **IN_PROGRESS** sampai item pada bagian "Temuan Terbuka" ditutup.

| Phase / Gate | Status | Commit | Started | Completed | Evidence & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gate 0: Containment Darurat** | **PASS** | `b9839e9` | 2026-08-15 | 2026-08-15 | `docs/security/00-emergency-containment-and-rotation.md`, node_modules purged |
| **Gate 1: Trusted Build & Deployment** | **PASS** | `b9839e9` | 2026-08-15 | 2026-08-15 | Migrasi unik & terverifikasi, clippy bersih, test suite dengan DB nyata lulus |
| **Gate 2: Trusted ERP Kernel Vertical Slice** | **PASS** | `b9839e9` | 2026-08-15 | 2026-08-15 | `P2pVerticalSliceEngine` (PO -> GR -> Bill -> Approval -> Payment -> GL -> Bank Recon), Maker-Checker SoD, 3-way match, exact cancellation reversals |
| **Gate 3: Multi-Tenant & Security Kernel** | **IN_PROGRESS** | - | 2026-08-15 | - | RequestContext, Redis token revocation, route registry sudah ada; **regresi RLS ditemukan 2026-09-10** (lihat Temuan Terbuka #1) dan sebagian sudah diperbaiki |
| **Gate 4: Domain Integration** | **PARTIAL** | - | - | - | Valuation engine ke stock posting; placeholder fungsional sedang ditutup |
| **Gate 5: Statutory Compliance & Pilot** | **UNVERIFIED** | - | - | - | Tax true-up, payroll, outbox worker, dan DR drill belum diverifikasi ulang oleh pihak independen |

---

## Temuan Terbuka (Audit 2026-09-10)

| # | Temuan | Dampak | Status |
| :--- | :--- | :--- | :--- |
| 1 | RLS aktif tanpa policy pada `refresh_tokens`, `user_sessions`, `scheduled_job_executions`, `outbox_dlq`, `cash_bank_transactions` | Deny-all bagi role runtime `erpqu_app`. Refresh token gagal disimpan (sesi mati setelah access token kedaluwarsa), DLQ & job history tidak terbaca | **Diperbaiki** — migrasi `20260910130000_fix_rls_tables_without_policies.sql`, plus assertion agar RLS tanpa policy gagal saat migrasi |
| 2 | Direktori `uploads/` disajikan sebagai static file publik | Seluruh dokumen/aset dapat diunduh tanpa autentikasi | **Diperbaiki** — `private_file_gate_middleware` (bearer / signed URL / cookie HttpOnly bertanda-tangan). `uploads/avatars/` tetap publik untuk branding pra-login |
| 3 | `GRANT ALL` otomatis ke seluruh schema saat startup | Melanggar prinsip least privilege | **Diperbaiki** — dibatasi ke DML pada schema runtime saja |
| 4 | Endpoint placeholder (`/api/placeholder_tx`) dan fitur yang mengembalikan sukses palsu | Menyesatkan pengguna & integrator API | **Diperbaiki** — route dihapus; cash/bank, rental handover, rental photo, metadata validation, dan WO cancel sudah diimplementasikan |
| 5 | Aktor audit dari input atau UUID acak, bukan JWT | Audit trail tidak dapat dipercaya | **Diperbaiki** — `sensor_handler`, `hr_lifecycle_handler`, `cancel_work_order` memakai klaim JWT |
| 6 | `.env` lokal memakai role `postgres` (superuser) sebagai `DATABASE_URL` | RLS ter-bypass di lokal sehingga regresi tidak terdeteksi | **Terbuka** — ubah ke `erpqu_app` agar dev memetakan kondisi produksi |
| 7 | CI: coverage dan RustSec audit non-blocking (`|| true`, `continue-on-error`) | Regresi bisa lolos pipeline | **Terbuka** |
| 8 | Belum ada test isolasi tenant per-modul dan contract test OpenAPI | Klaim multi-tenant belum terbukti menyeluruh | **Sebagian** — verifikasi manual lintas company untuk cash/bank sudah dilakukan |
| 9 | `docs/openapi.yaml` berpotensi drift dari route aktual (mis. `/api/me` vs `/api/auth/me`) | Integrator memakai kontrak yang salah | **Terbuka** |

## Kriteria Penutupan Gate 3 & 4

Gate 3 dapat kembali berstatus PASS apabila:

1. `DATABASE_URL` di seluruh environment memakai role non-superuser.
2. Assertion "RLS tanpa policy" dipertahankan di CI.
3. Test isolasi lintas company tersedia dan lulus untuk setiap modul ber-`company_id`.
4. Seluruh upload privat hanya dapat diakses lewat mekanisme terautentikasi.

Gate 4 dapat kembali berstatus PASS apabila:

1. Tidak ada lagi endpoint yang mengembalikan data kosong/sukses palsu.
2. Semua endpoint daftar memiliki pagination dan filter.
3. Contract test OpenAPI disetujui dan dijalankan di CI.

---

### Catatan Penilaian Gate 1 & 2 (Evaluation Notes):
- **Gate 1 (Trusted Build & Deploy)**:
  - 212 migrasi dieksekusi dari fresh database dengan exit code 0 tanpa konflik prefix/kolom.
  - `cargo clippy --workspace --all-targets -- -D warnings` bersih 0 warning.
  - `cargo fmt --all -- --check` bersih 0 formatting discrepancy.
  - `.github/workflows/deploy.yml` dikonfigurasi dengan immutable image tag SHA, dedicated migration runner fail-closed, dan readiness probe 8181/8080 dengan auto rollback.
- **Gate 2 (Trusted ERP Kernel Vertical Slice)**:
  - Mengimplementasikan `crates/finance/src/domain/p2p_vertical_slice.rs` & `crates/finance/tests/p2p_vertical_slice_integration_tests.rs`.
  - Invariant yang teruji secara otomatis:
    1. Mandatory non-nil `company_id` pada setiap entitas dan transaksi.
    2. 3-Way Matching validator antara PO, Goods Receipt, dan Purchase Bill dengan price & quantity tolerance.
    3. Segregation of Duties (SoD) Maker-Checker yang ketat (pembuat dokumen ditolak saat mencoba menyetujui dokumen sendiri).
    4. Non-optional Posting Engine menghasilkan entitas General Ledger (GRIR Clearing, Accounts Payable, Bank) secara seimbang ($\sum 	ext{Debit} == \sum 	ext{Credit}$).
    5. Immutability dokumen posted (tidak dapat diedit / di-revert ke Draft).
    6. Pembatalan dokumen menghasilkan jurnal pembalik (exact reversal) yang tercatat lengkap.
    7. Alokasi pembayaran menurunkan `outstanding_amount` purchase bill secara terverifikasi.
    8. Bank Reconciliation mencocokkan mutasi bank statement secara eksak.
