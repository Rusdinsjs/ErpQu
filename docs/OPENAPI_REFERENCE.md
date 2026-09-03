# ERPQu API Reference & OpenAPI / Swagger Documentation

Sistem ERPQu dilengkapi dengan dokumentasi API interaktif berbasis standar OpenAPI 3.0 via **Utoipa** dan **Swagger UI**.

---

## 🌐 1. Akses Swagger UI & OpenAPI Spec

- **Swagger UI Interaktif**:
  ```text
  http://localhost:8181/swagger-ui/
  ```
  *(Atau melalui domain reverse proxy produksi: `https://erp.perusahaan.co.id/swagger-ui/`)*
- **OpenAPI 3.0 JSON Schema**:
  ```text
  http://localhost:8181/api-docs/openapi.json
  ```

### Autentikasi di Swagger UI:
1. Jalankan request login di endpoint `POST /api/auth/login`.
2. Salin token dari respons: `"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`.
3. Klik tombol **Authorize (Gembok)** di pojok kanan atas halaman Swagger UI.
4. Tempelkan token Anda dan klik **Authorize**. Seluruh panggilan API berikutnya akan otomatis membawa header `Authorization: Bearer <token>`.

---

## 📡 2. Konvensi Header HTTP

| Header | Wajib / Opsional | Keterangan |
|---|---|---|
| `Authorization` | Wajib (Protected) | `Bearer <jwt_token>` |
| `Content-Type` | Wajib (POST/PUT) | `application/json` (atau `text/csv` untuk download e-Faktur) |
| `X-Company-ID` | Opsional | UUID perusahaan aktif untuk konteks multi-company |
| `Idempotency-Key` | Opsional (Disarankan) | UUID unik untuk mencegah duplikasi posting invoice atau jurnal |

---

## 📑 3. Katalog Endpoint Lengkap per Modul Bisnis

### A. Autentikasi & Keamanan (`/api/auth`)
- `POST /api/auth/login`: Login pengguna (mendapatkan JWT access & refresh token).
- `POST /api/auth/refresh`: Refresh expired access token.
- `POST /api/auth/logout`: Logout dan memasukkan JWT ke blacklist Redis.
- `GET /api/auth/me`: Mengambil profil dan hak akses pengguna aktif.

---

### B. Keuangan & Akuntansi PSAK (`/api/finance`, `/api/v1/finance`)
- `GET /api/finance/accounts`: Daftar Chart of Accounts (COA) per company.
- `POST /api/finance/accounts`: Tambah akun buku besar baru.
- `GET /api/finance/account-mappings`: Daftar pemetaan akun dinamis (`AR`, `AP`, `COGS`, `INVENTORY`, `REVENUE`, `VAT`).
- `PUT /api/finance/account-mappings`: Perbarui pemetaan akun buku besar dinamis.
- `GET /api/finance/general-ledger`: Laporan Buku Besar Umum dengan filter `account_id`, `start_date`, dan `end_date`.
- `GET /api/finance/trial-balance`: Neraca Saldo multi-company.
- `GET /api/finance/balance-sheet`: Laporan Neraca (Aset, Kewajiban, Ekuitas).
- `GET /api/finance/profit-loss`: Laporan Laba Rugi (Pendapatan vs Beban).
- `GET /api/finance/budgets`: Daftar anggaran per pusat biaya.
- `POST /api/finance/budgets`: Buat alokasi anggaran tahunan baru.
- `GET /api/finance/budgets/variance`: Laporan realisasi anggaran vs aktual belanja buku besar.
- `GET /api/finance/exchange-rates`: Kurs valuta asing harian (USD, SGD, EUR).
- `POST /api/finance/exchange-rates`: Input kurs harian Bank Indonesia.

---

### C. e-Faktur DJP Online Indonesia (`/api/tax/e-faktur`, `/api/v1/tax/e-faktur`)
- `GET /api/tax/e-faktur`: Daftar Faktur Pajak Keluaran (PPN 11%).
- `POST /api/tax/e-faktur`: Terbitkan Faktur Pajak Keluaran baru (NSFP & NPWP).
- `GET /api/tax/e-faktur/export`: **Download file CSV resmi e-Faktur DJP** (format baris `FK` dan `OF` standar DJP Online 3.0/4.0).

---

### D. Notifikasi & WhatsApp Gateway (`/api/notifications`, `/api/v1/notifications`)
- `GET /api/notifications/whatsapp/config`: Ambil konfigurasi WhatsApp Gateway.
- `PUT /api/notifications/whatsapp/config`: Simpan pengaturan provider (Fonnte/Wablas/Webhook) dan token.
- `POST /api/notifications/whatsapp/send`: Kirim pesan WhatsApp langsung / pemicu otomatis.
- `GET /api/notifications/whatsapp/logs`: Riwayat audit trail pengiriman pesan WA.

---

### E. Persediaan & Rantai Pasok (`/api/inventory`, `/api/v1/inventory`)
- `GET /api/inventory/items`: Master data barang/suku cadang gudang.
- `GET /api/inventory/analytics/abc`: **Analisis Pareto ABC (80/20)** dengan rekomendasi jadwal audit fisik stok (*cycle count*).
- `GET /api/inventory/alerts/low-stock`: **Pemantauan Defisit Stok Kritis** (stok saat ini < batas minimum).

---

### F. Manufaktur & Operasional Pabrik (`/api/manufacturing`, `/api/v1/manufacturing`)
- `GET /api/manufacturing/boms`: Daftar Master Resep / Formula Bill of Materials.
- `POST /api/manufacturing/boms`: Daftarkan formula BOM baru.
- `GET /api/manufacturing/boms/:id/requirements?target_qty=...`: **Kalkulator MRP Material Exploding** dengan penambahan persentase scrap allowance.
- `GET /api/manufacturing/production-orders`: Daftar Surat Perintah Kerja (SPK) Produksi.
- `POST /api/manufacturing/production-orders`: Buat SPK baru.
- `PUT /api/manufacturing/production-orders/:id/status`: Transisi status siklus SPK (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`).

---

### G. CRM & Penjualan B2B (`/api/crm`, `/api/v1/crm`)
- `GET /api/crm/leads`: Daftar prospek penjualan baru.
- `POST /api/crm/leads`: Daftarkan prospek baru.
- `POST /api/crm/leads/:id/convert`: Konversi prospek menjadi Peluang Penjualan (*Opportunity*).
- `GET /api/crm/opportunities`: Daftar peluang penjualan aktif.
- `GET /api/crm/pipeline/summary`: **Ringkasan Kanban Penjualan** (agregasi nilai rupiah per tahap transaksi).
- `PUT /api/crm/opportunities/:id/stage`: Pindahkan tahap penjualan (`PROSPECTING`, `QUALIFICATION`, `PROPOSAL`, `WON`, `LOST`).
- `GET /api/crm/analytics/win-loss`: **Analisis Rasio Kemenangan & Nilai Rata-rata Deal**.
