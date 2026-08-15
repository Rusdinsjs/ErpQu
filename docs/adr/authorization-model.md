# ADR: Granular Dot-Notation Authorization Model

## Status
**APPROVED** (Design Gate Fase 5)

## Konteks & Masalah
Model otorisasi sebelumnya mengandalkan pencocokan role string kasar (`admin`, `manager`, `user`) dan level angka hierarkis (`role_level <= 2`), yang menyebabkan pemberian hak akses terlalu longgar (*over-privileged*) dan admin dapat secara otomatis membypass aturan bisnis tanpa izin eksplisit.

## Keputusan Arsitektur
1. **Struktur Izin Granular**:
   Izin didefinisikan dengan skema 4-komponen:
   `resource:action:company_scope:data_scope`

2. **Daftar Action Standar (Minimum)**:
   - `read`: Melihat detail atau daftar data.
   - `create`: Membuat draft transaksi baru.
   - `write` / `update`: Mengedit draft transaksi sebelum submit.
   - `submit`: Mengajukan draft ke antrean persetujuan.
   - `approve`: Menyetujui dokumen transaksi (Checker).
   - `post`: Mengunci dan membukukan transaksi ke General Ledger / Stock Ledger.
   - `cancel`: Membatalkan dokumen draft/submitted sebelum posted.
   - `reverse`: Membatalkan transaksi posted melalui jurnal koreksi resmi.
   - `amend`: Membuat versi revisi dari dokumen yang dibatalkan.
   - `export`: Mengunduh data massal ke format Excel/CSV/PDF.
   - `import`: Mengunggah data massal dari file luar.
   - `configure`: Mengubah master setting atau alur persetujuan.

3. **Data Scope Hierarchy**:
   - `own`: Hanya data yang dibuat oleh user sendiri.
   - `team` / `department`: Data dalam departemen atau cost center user.
   - `branch`: Data dalam kantor cabang / site proyek user.
   - `company`: Seluruh data dalam entitas legal PT aktif.
   - `organization`: Seluruh data dalam holding group (Khusus Auditor/Direksi Holding).
   - `explicitly_elevated`: Akses khusus darurat dengan batasan waktu (Time-Bound & Audited).

4. **Penolakan HTTP Verb sebagai Otorisasi Bisnis**:
   Metode HTTP (`GET`, `POST`, `PUT`, `DELETE`) murni sebagai protokol transport; verifikasi otorisasi wajib memeriksa izin bisnis domain (`finance.journal.post` vs `finance.journal.create`).

5. **No Blind Admin Bypass**:
   Role `admin` tidak otomatis memiliki wildcard `*` pada aksi posting keuangan atau approval SoD.

## Konsekuensi
- **Positif**: Fleksibilitas tinggi dalam pembagian peran kerja di organisasi besar, kepatuhan penuh terhadap audit internal.
- **Tantangan**: Manajemen permission matrix membutuhkan antarmuka administrasi role yang jelas di web admin.
