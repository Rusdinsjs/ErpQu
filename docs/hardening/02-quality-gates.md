# Spesifikasi dan Kebijakan Trusted Quality Gates (Fase 2)

## 1. Daftar Quality Gates & Cakupan Pipeline

| Gate Name | Runner & Environment | Perintah Eksekusi | Kriteria Lolos (Failure Policy) |
| :--- | :--- | :--- | :--- |
| **Backend Quality Gate** | Rust Stable, PostgreSQL 15, Redis 7 | `cargo fmt --all -- --check`<br>`cargo check --workspace --all-targets`<br>`cargo clippy --workspace --all-targets`<br>`cargo test --workspace --tests` | **Zero Warning / Error** (Fail-Closed) |
| **Frontend Quality Gate** | Node.js 20 LTS (`./web-admin`) | `npm ci`<br>`npx tsc --noEmit`<br>`npm run lint`<br>`npx vitest run`<br>`npm run build` | **Zero Type Error, Lint Clean, 100% Tests Pass, Bundle Succeeded** |
| **Mobile Quality Gate** | Node.js 20 LTS (`./mobile`) | `npm ci`<br>`npx tsc --noEmit`<br>`npx expo config --type public` | **Zero Type Error, Valid Expo Config** |
| **Security Audit Gate** | Gitleaks v2 & RustSec Audit | `gitleaks-action@v2`<br>`rustsec/audit-check-action@v1.4.1` | **Blocking (No `continue-on-error`)** |

---

## 2. Perintah Verifikasi Lokal Pengembang

### A. Backend (Rust Workspace)
```bash
# 1. Format Check
cargo fmt --all -- --check

# 2. Workspace Type & Syntax Check
cargo check --workspace --all-targets

# 3. Strict Linter
cargo clippy --workspace --all-targets

# 4. Behavioral & Integration Tests
cargo test --workspace --tests
```

### B. Frontend (`web-admin`)
```bash
cd web-admin

# 1. Type Check
npx tsc --noEmit

# 2. Lint Check
npm run lint

# 3. Unit Tests
npx vitest run

# 4. Production Build
npm run build
```

### C. Mobile (`mobile`)
```bash
cd mobile

# 1. Type Check
npx tsc --noEmit

# 2. Expo Configuration Validation
npx expo config --type public
```

---

## 3. Required Environment Variables (Testing CI)

```ini
# PostgreSQL Test Service
DATABASE_URL=postgres://postgres:postgrespassword@localhost:5432/erp_system_test
MIGRATION_DATABASE_URL=postgres://postgres:postgrespassword@localhost:5432/erp_system_test

# Redis Test Service
REDIS_URL=redis://localhost:6379

# JWT & Environment Config
JWT_SECRET=super-secret-key-for-testing-only-minimum-16-chars
ENVIRONMENT=test
```

---

## 4. Failure Policy & Quality Boundary
1. **Zero Silent Bypass**: Seluruh perintah CI dilarang menggunakan `continue-on-error: true` atau `|| true` pada pemeriksaan keamanan, build, linting, dan testing.
2. **Real Infrastructure Verification**: Seluruh database integration test wajib beroperasi terhadap instance PostgreSQL 15 nyata dengan service healthcheck yang terisolasi.
3. **Pemisahan Deployment**: Workflow `deploy.yml` hanya dapat dieksekusi setelah seluruh 4 quality gate di `ci.yml` berstatus **SUCCEEDED (HIJAU)**.

---

## 5. Daftar Test yang Diperbaiki & Diverifikasi

1. **`web-admin/src/components/ui/__tests__/Button.test.tsx`**:
   - Memperbaiki regex assertion varian `danger` (`/bg-destructive|bg-red-600|bg-rose-600/`) agar sesuai dengan styling tema token `bg-rose-600`.
   - Hasil: 5 test suite (22 unit tests) di `web-admin` lulus 100%.
2. **`crates/core/tests/auth_fallback_elimination_tests.rs`**:
   - Memvalidasi siklus hash & verifikasi password, deteksi akun nonaktif, serta ketiadaan default role `super_admin`.
   - Hasil: 3 tests lulus 100%.
3. **`crates/core/tests/` & Workspace Crates Tests**:
   - Seluruh test suite modular `management-system-core`, `finance`, `assets`, `ops`, `api-server` lulus tanpa kegagalan.
