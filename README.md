# ERPQu — Enterprise Resource Planning

ERPQu adalah sistem ERP modular untuk perusahaan Indonesia. Backend ditulis dengan
Rust (Axum + SQLx + PostgreSQL), dengan Web Admin berbasis React/TypeScript dan
aplikasi mobile Expo/React Native untuk operasional lapangan.

## Arsitektur

```text
apps/web-admin (React 19 + Vite)  ─┐
                                   ├── crates/api-server (Axum, :8181) ── PostgreSQL 17
apps/mobile (Expo / React Native) ─┘                                   └── Redis 7
```

Backend disusun sebagai **modular monolith**: satu proses API, tetapi domain
dipisah menjadi crate tersendiri.

| Crate | Tanggung jawab |
| :--- | :--- |
| `crates/api-server` | HTTP API, router, handler, middleware, Swagger |
| `crates/core` | Auth, RBAC, tenant, audit, outbox, metadata kernel |
| `crates/finance` | COA, jurnal, GL, posting, penyusutan, rekonsiliasi |
| `crates/assets` | Aset tetap, lifecycle, disposal |
| `crates/ops` | Work order, maintenance, BOM, quality, fuel, trip |
| `crates/hr` | Karyawan, absensi, payroll, cuti, pinjaman, klaim |
| `crates/crm` | Client, lead, opportunity, pipeline |
| `crates/rental` | Kontrak rental, handover, billing |
| `crates/inventory` | Stock ledger, dokumen stok, valuasi, FIFO |
| `crates/commercial` | Pricing, quotation, kontrak komersial |
| `crates/procurement` | Purchase request/order/bill |
| `crates/telemetry` | Sensor dan telemetry armada |
| `crates/macros` | Proc macro internal |

Modul bisnis yang tersedia: Keuangan, Aset Tetap, Maintenance & Work Order, HR &
Payroll, Inventory & Procurement, Rental, CRM & Penjualan, Manufacturing,
Analytics, Approval Workflow, RBAC, dan Reporting.

## Prasyarat

- Rust (stable, edition 2021) — proyek diuji dengan rustc 1.97
- Node.js 20+ dan npm (Web Admin) serta Bun (opsional, dipakai `start-dev.sh`)
- Docker + Docker Compose (PostgreSQL 17 dan Redis 7)
- `sqlx-cli` (`cargo install sqlx-cli --no-default-features --features postgres`)

## Menjalankan Development

Cara tercepat:

```bash
./start-dev.sh
```

Script ini menyalakan container `postgres` + `redis`, menjalankan migrasi,
memberi hak akses role aplikasi, lalu menjalankan frontend (`:5174`) dan
backend (`:8181`).

Alternatif manual:

```bash
docker compose up -d postgres redis
export SQLX_OFFLINE=false
cargo sqlx migrate run --source database/migrations
cargo run -p api-server
```

Layanan:

| Layanan | URL |
| :--- | :--- |
| Web Admin | http://localhost:5174 |
| Backend API | http://localhost:8181 |
| Health / Readiness | `GET /health`, `GET /ready` |
| Metrics | `GET /metrics` |
| Swagger UI | http://localhost:8181/swagger-ui/ |
| PostgreSQL (host) | `localhost:5436` |
| Redis | `localhost:6379` |

## Konfigurasi Environment

Salin `.env.example` menjadi `.env`. Variabel penting:

```env
SERVER_HOST=0.0.0.0
SERVER_PORT=8181
DATABASE_URL=postgres://erpqu_app:<password>@localhost:5436/management_system?options=-c%20search_path=public,hr,crm,rental,inventory,commercial,finance,ops
MIGRATION_DATABASE_URL=postgres://postgres:<password>@localhost:5436/management_system?options=-c%20search_path=public,hr,crm,rental,inventory,commercial,finance,ops
REDIS_URL=redis://localhost:6379
JWT_SECRET=<minimal 32 karakter, wajib di produksi>
JWT_EXPIRY_HOURS=24
ALLOW_PUBLIC_REGISTRATION=false
ALLOW_DEV_TEST_ROUTES=false
UPLOAD_MAX_SIZE_MB=10
```

Catatan penting:

- `DATABASE_URL` harus memakai role least-privilege `erpqu_app`, sedangkan
  `MIGRATION_DATABASE_URL` memakai role migrasi. Jangan gunakan superuser untuk
  koneksi runtime — hal itu menyembunyikan pelanggaran RLS.
- Produksi wajib menyediakan `JWT_SECRET`; aplikasi menolak start bila kosong.
- Jangan pernah commit `.env` atau file kunci.

Untuk Web Admin, `apps/web-admin/.env` cukup berisi:

```env
VITE_API_URL=/api
```

## Migrasi Database

```bash
# jalankan migrasi
cargo sqlx migrate run --source database/migrations

# status
cargo sqlx migrate info --source database/migrations
```

Seluruh migrasi berada di `database/migrations/`. Backend juga dapat menjalankan
migrasi saat startup (fail-closed) dan tersedia mode *migration-only* untuk
runner terpisah di deployment.

## Testing dan Lint

```bash
# gerbang kualitas lengkap (TypeScript, build, test integritas, audit migrasi)
./scripts/dev/pre-push.sh

# backend
cargo fmt --all -- --check
cargo clippy --workspace --all-targets
cargo test --workspace --tests

# frontend
cd apps/web-admin
npx tsc --noEmit
npm run lint
npm test
npm run build
```

CI berada di `.github/workflows/ci.yml` (fmt, clippy, migrasi, test backend,
typecheck/lint/test/build frontend, validasi mobile, Gitleaks).

## Deployment

Panduan lengkap ada di `docs/runbook/DEPLOYMENT_RUNBOOK.md`. Ringkasnya:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Komponen produksi: PostgreSQL, Redis, backend, frontend (Nginx), dan migration
runner terpisah. Konfigurasi Nginx ada di `deploy/nginx/`.

## Keamanan

- Autentikasi JWT dengan rotating refresh token dan revokasi via Redis.
- Password di-hash dengan Argon2.
- RBAC default-deny per route.
- Multi-company dengan PostgreSQL Row Level Security (RLS).
- Audit trail append-only, idempotency key, dan transactional outbox.
- File upload tervalidasi (magic bytes, decode ulang gambar, kuota tenant) dan
  hanya dapat diakses melalui sesi terautentikasi.

Dokumen terkait:

- `docs/security/` — hardening auth, token, upload
- `docs/architecture/` — desain tenant, RBAC, SoD, RLS
- `docs/hardening/STATUS.md` — status gate hardening (sumber kebenaran status)
- `SECURITY.md` — kebijakan pelaporan kerentanan

## Dokumentasi Lain

| Dokumen | Isi |
| :--- | :--- |
| `docs/ARCHITECTURE.md` | Arsitektur sistem |
| `docs/OPENAPI_REFERENCE.md`, `docs/openapi.yaml` | Referensi API |
| `docs/USER_GUIDE.md` | Panduan pengguna |
| `docs/SOP_MANUAL.md` | SOP operasional |
| `docs/runbook/` | Deployment, disaster recovery, release readiness |
| `docs/database/` | Role database dan pemisahan hak akses |

## Struktur Repository

```text
apps/
  web-admin/        React + TypeScript + Vite
  mobile/           Expo / React Native
crates/             Backend Rust (domain + api-server)
database/
  migrations/       Migrasi SQL
  seeds/            Seed data
deploy/             Konfigurasi Nginx dan deployment
docs/               Dokumentasi
scripts/            Script dev, db, testing, deploy
tests/              Integration test
```

## Kontribusi

1. Buat branch dari `master`.
2. Jalankan `./scripts/dev/pre-push.sh` sampai hijau.
3. Sertakan bukti pengujian pada deskripsi perubahan.
4. Jangan commit kredensial atau data produksi.
