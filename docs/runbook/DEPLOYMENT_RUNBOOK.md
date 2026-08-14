# Production Deployment Runbook

Dokumen ini berisi prosedur baku untuk melakukan deployment, rollback, backup, dan pemulihan (*restore drill*) platform ERPQu di lingkungan Produksi.

---

## 1. Persiapan Sebelum Deployment

1. **Pastikan Quality Gate CI Lulus:** Seluruh 16 poin pengujian di GitHub Actions (`ci.yml`) harus berstatus sukses.
2. **Periksa Variabel Lingkungan (.env Produksi):**
   - `ENVIRONMENT=production`
   - `JWT_SECRET` minimal 32 karakter acak (BUKAN default).
   - `MIGRATION_DATABASE_URL` menggunakan kredensial migrasi terisolasi.
   - `DATABASE_URL` menggunakan akun pengguna aplikasi `erpqu_app` (least-privilege).
   - `REDIS_PASSWORD` aktif dan bukan default.
3. **Imutabilitas Image Tag:** Tentukan tag rilis spesifik (contoh: `IMAGE_TAG=v0.1.0-build.142`). Dilarang mengandalkan `:latest` di produksi.

---

## 2. Prosedur Automated Backup & Restore Drill

### Backup Database Otomatis
```bash
# Eksekusi backup fisik dan logical
export BACKUP_FILE="erpqu_prod_$(date +%Y%m%d_%H%M%S).sql.gz"
docker exec mgmt-db pg_dump -U postgres -d management_system | gzip > "/var/backups/erpqu/${BACKUP_FILE}"
```

### Prosedur Restore Drill (Uji Pemulihan)
```bash
# Test restore ke instance PostgreSQL sementara
gunzip -c "/var/backups/erpqu/${BACKUP_FILE}" | docker exec -i mgmt-db-restore-test psql -U postgres -d erp_restore_test
```

---

## 3. Eksekusi Rolling Deployment

```bash
# 1. Pull image spesifik versi
export IMAGE_TAG="v0.1.0-build.142"
docker compose pull backend frontend

# 2. Jalankan migrasi schema secara terisolasi
docker compose run --rm migrate

# 3. Restarts layanan backend & frontend dengan Zero-Downtime
docker compose up -d --no-deps backend frontend

# 4. Verifikasi Healthcheck & Readiness
curl -f http://localhost:8181/health
```

---

## 4. Prosedur Rollback Rilis

Jika terjadi anomali atau kenaikan error rate pada observabilitas:

```bash
# Rollback ke versi tag sebelumnya yang stabil
export IMAGE_TAG="v0.1.0-build.141"
docker compose up -d --no-deps backend frontend

# Verifikasi status kesehatan pasca-rollback
curl -f http://localhost:8181/health
```
