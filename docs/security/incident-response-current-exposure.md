# Incident Response Guide: Public Exposure Containment & Credential Rotation

## Ringkasan Insiden
Pada audit repositori publik ERPQu, teridentifikasi bahwa commit history dan working tree sebelumnya melacak artefak sensitif meliputi:
- File konfigurasi `.env` berisi database credential, JWT secret, dan parameter server.
- Database dump operasional (`erpqu_backup_latest.sql`).
- Runtime log dan trace file (`backend.log`, `backend_backtrace.log`).
- File request autentikasi lokal (`login_req.json`).
- Artefak upload media pengguna (`uploads/`).

Karena repositori sempat berstatus publik, seluruh kredensial yang pernah tercatat dalam Git history harus dianggap telah **terkompromi (compromised)**.

---

## Prosedur Tindakan Manual Pemilik Sistem (Wajib Segera Dilakukan)

### 1. Ubah Visibilitas Repositori Menjadi Private
- Buka repositori di GitHub: `Settings` -> `Danger Zone` -> `Change repository visibility` -> Pilih **Make private**.

### 2. Rotasi Kredensial Database PostgreSQL (VPS & Staging)
1. Login ke server database PostgreSQL:
   ```bash
   sudo -u postgres psql
   ```
2. Ganti password pengguna database:
   ```sql
   ALTER USER postgres WITH PASSWORD '<GENERATE_NEW_STRONG_PASSWORD_1>';
   ALTER USER erpqu_app WITH PASSWORD '<GENERATE_NEW_STRONG_PASSWORD_2>';
   ```
3. Perbarui `MIGRATION_DATABASE_URL` dan `DATABASE_URL` pada file `.env` di VPS.

### 3. Rotasi JWT Secret & Invalidasi Seluruh Sesi Aktif
1. Generate JWT secret baru yang aman (minimal 32 karakter acak):
   ```bash
   openssl rand -base64 48
   ```
2. Pasang nilai baru tersebut pada parameter `JWT_SECRET` di `.env`.
3. Restart backend service agar seluruh token JWT lama otomatis tertolak (*invalidated*).
4. Jika menggunakan Redis untuk token blacklist/session, lakukan flush key session:
   ```bash
   redis-cli -a "<REDIS_PASSWORD>" FLUSHDB
   ```

### 4. Rotasi Kredensial SMTP, Object Storage, dan Third-Party API
1. Reset App Password / API Key pada penyedia SMTP (SendGrid, Mailgun, Google Workspace, dll.).
2. Reset access key & secret key object storage (S3 / MinIO / Cloudflare R2).
3. Reset seluruh external API token yang pernah diuji coba.

### 5. Rotasi SSH Key & Akses VPS
1. Buat keypair SSH baru untuk akses deploy dan administrator:
   ```bash
   ssh-keygen -t ed25519 -C "admin@erpqu-prod"
   ```
2. Hapus public key lama dari `~/.ssh/authorized_keys` di VPS.
3. Perbarui secret `VPS_SSH_KEY` pada GitHub Actions Repository Secrets.

### 6. Audit Fork, Clone, dan Artifacts GitHub
1. Periksa daftar *Forks* pada GitHub repository (jika ada fork eksternal sebelum repositori dijadikan private).
2. Periksa menu `Actions` -> Hapus build logs dan artifact lama yang berpotensi menyimpan log koneksi.
3. Periksa image di GitHub Container Registry (`ghcr.io/rusdinsjs/erp-backend`) dan hapus image lama yang memuat file `.env` di dalam layer container.

### 7. Asesmen Data Produksi vs Dummy
1. Periksa isi data pada `erpqu_backup_latest.sql` di lingkungan lokal terisolasi.
2. Tentukan apakah data mencakup:
   - Data riil karyawan / nasabah / vendor (PII)
   - Data nomor rekening atau nilai transaksi riil
3. Jika data tersebut adalah data produksi riil, lakukan asesmen kewajiban notifikasi insiden privasi data sesuai ketentuan regulasi pelindungan data pribadi (UU PDP).

### 8. Prosedur Purge Git History (Rewrite History)
Gunakan alat resmi `git-filter-repo` pada salinan bersih repositori lokal:
```bash
# 1. Pastikan repo lokal bersih dan buat mirror backup
git clone --bare https://github.com/Rusdinsjs/erp-system.git erp-system-clean-backup.git
cd erp-system-clean-backup.git

# 2. Hapus file sensitif dari seluruh riwayat commit
git filter-repo --invert-paths \
  --path .env \
  --path-glob "*.env" \
  --path-glob "*.log" \
  --path-glob "*.sql" \
  --path-glob "uploads/*" \
  --path login_req.json \
  --path login_resp.json \
  --path erpqu_backup_latest.sql

# 3. Verifikasi riwayat telah bersih sebelum melakukan force push ke private remote
```
*Peringatan*: Jangan melakukan force push rewrite history sebelum seluruh tim/kontributor menyelaraskan branch lokal mereka.
