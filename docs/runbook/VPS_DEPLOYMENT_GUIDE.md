# Panduan Operasional: Deployment Server VPS Produksi & Otomatisasi CD

Panduan resmi langkah demi langkah (*Runbook SOP*) untuk meluncurkan sistem ERPQu ke server VPS nyata (*Virtual Private Server*) berbasis Ubuntu 22.04 / 24.04 LTS atau Debian 12 secara otomatis dengan perlindungan keamanan enterprise.

---

## 🖥️ 1. Rekomendasi Spesifikasi Server VPS

| Komponen | Spesifikasi Minimum | Spesifikasi Rekomendasi (50–200 User) |
|:---|:---|:---|
| **vCPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB (dengan Swap 4GB) | 8 GB |
| **Penyimpanan (Storage)**| 40 GB SSD / NVMe | 80 GB SSD NVMe |
| **Sistem Operasi** | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS (x86_64) |
| **Rekomendasi Provider** | Hetzner (CPX21 / CAX21), DigitalOcean, IDCloudHost, Biznet GIO, AWS EC2 (`t3.medium`) | Hetzner Cloud (CPX31) atau DigitalOcean Droplet 8GB |

---

## ⚡ 2. Langkah 1: Provisioning Server Otomatis (*One-Command Setup*)

Setelah menyewa VPS dan menerima kredensial IP serta password/SSH key dari penyedia hosting:

1. **Masuk ke Server via SSH**:
   ```bash
   ssh root@<IP_VPS_ANDA>
   ```

2. **Jalankan Skrip Otomasi ERPQu**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/Rusdinsjs/erp-system/main/deploy/scripts/setup_vps.sh | bash
   ```

### 🛡️ Apa yang Dilakukan oleh Skrip ini Secara Otomatis?
- Mengatur zona waktu server ke **WIB (`Asia/Jakarta`)**.
- Mengonfigurasi **Swap Memory 4GB** untuk mencegah server crash akibat lonjakan memori (*OOM*).
- Mengaktifkan **Firewall UFW** (hanya port `22`, `80`, dan `443` yang terbuka; port database PostgreSQL dan Redis terlindungi di jaringan internal).
- Memasang **Fail2ban** untuk memblokir otomatis IP peretas yang mencoba brute-force password SSH.
- Menginstal versi resmi terbaru dari **Docker Engine** dan **Docker Compose v2**.
- Menyiapkan direktori produksi di `/opt/erpqu` dan mengkloning kode repositori terbaru.
- Menghasilkan file konfigurasi rahasia `/opt/erpqu/.env` dengan kata sandi acak kuat (*SCRAM-SHA-256*, *Redis Password*, dan *JWT Secret*).
- Menghasilkan **SSH Deploy Key** untuk dihubungkan ke GitHub Actions.

---

## 🌐 3. Langkah 2: Konfigurasi Domain & DNS A-Record

Agar aplikasi dapat diakses menggunakan domain perusahaan (contoh: `erp.perusahaan.co.id`):

1. Buka DNS Management pada penyedia domain Anda (Cloudflare, Niagahoster, Rumahweb, dll.).
2. Tambahkan **A-Record**:
   - **Type**: `A`
   - **Name / Host**: `erp` (atau `@` jika menggunakan root domain)
   - **IPv4 Address**: Masukkan `<IP_PUBLIK_VPS>`
   - **TTL**: Auto / 1 Menit
3. Di server VPS, perbarui nilai `NGINX_HOST` di `/opt/erpqu/.env`:
   ```bash
   nano /opt/erpqu/.env
   ```
   Ubah baris:
   ```env
   NGINX_HOST=erp.perusahaan.co.id
   CORS_ALLOWED_ORIGINS=https://erp.perusahaan.co.id
   ```
   Simpan dengan menekan `CTRL+O`, `Enter`, lalu keluar dengan `CTRL+X`.

---

## 🤖 4. Langkah 3: Menghubungkan Continuous Deployment (CD) GitHub Actions

Jalur deployment otomatis (*Continuous Deployment*) telah dikonfigurasi pada [`.github/workflows/deploy.yml`](file:///wsl.localhost/archlinux/home/rus/projects/erp-system/.github/workflows/deploy.yml). Setiap kali developer melakukan `git push origin main`, server VPS akan otomatis melakukan *pull image*, menjalankan migrasi database, dan me-restart container tanpa downtime.

### Konfigurasi GitHub Repository Secrets:
Buka: **GitHub Repository ➔ Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret**

Tambahkan 3 rahasia berikut (nilainya ditampilkan di layar terminal saat skrip `setup_vps.sh` selesai dijalankan):

| Nama Secret | Deskripsi | Contoh Nilai |
|:---|:---|:---|
| **`VPS_HOST`** | Alamat IP Publik server VPS Anda | `194.163.140.25` |
| **`VPS_USERNAME`** | Pengguna SSH server | `root` |
| **`VPS_SSH_KEY`** | Kunci privat SSH (tampilkan via: `cat /root/.ssh/id_erpqu_github_actions`) | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |

---

## 🚀 5. Langkah 4: Menyalakan Aplikasi Pertama Kali Secara Manual

Jika ingin menyalakan seluruh stack aplikasi segera tanpa menunggu git push:

```bash
cd /opt/erpqu

# 1. Jalankan seluruh container (Nginx, Backend, Frontend, PostgreSQL, Redis)
docker compose -f docker-compose.prod.yml up -d --build

# 2. Periksa status kesehatan seluruh service
docker compose -f docker-compose.prod.yml ps
```

Hasil yang diharapkan:
```
NAME              STATUS                  PORTS
erpqu-nginx       Up (healthy)            0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
erpqu-backend     Up (healthy)            8181/tcp
erpqu-frontend    Up                      80/tcp
erpqu-db          Up (healthy)            5432/tcp (internal only)
erpqu-redis       Up (healthy)            6379/tcp (internal only)
```

---

## 🛠️ 6. Runbook Operasional & Troubleshooting

### A. Melihat Log Aplikasi Real-time:
```bash
# Log Backend Rust Axum:
docker compose -f /opt/erpqu/docker-compose.prod.yml logs -f --tail 100 backend

# Log Nginx Web Server (Akses & Error HTTP):
docker compose -f /opt/erpqu/docker-compose.prod.yml logs -f --tail 100 nginx

# Log Database PostgreSQL:
docker compose -f /opt/erpqu/docker-compose.prod.yml logs -f --tail 50 postgres
```

### B. Membuat Backup Database PostgreSQL Manual:
```bash
docker compose -f /opt/erpqu/docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres -Fc management_system > /backups/manual_backup_$(date +%Y%m%d_%H%M%S).dump
```

### C. Memulihkan Database (*Disaster Recovery Restore*):
```bash
# Salin file backup ke dalam container dan jalankan pg_restore
docker compose -f /opt/erpqu/docker-compose.prod.yml exec -T postgres \
  pg_restore -U postgres -d management_system --clean --if-exists /backups/nama_file_backup.dump
```

### D. Restart Seluruh Stack Tanpa Kehilangan Data:
```bash
cd /opt/erpqu && docker compose -f docker-compose.prod.yml restart
```

---

## 🔄 7. Alur Kerja Rutin: Local ➔ GitHub ➔ Deploy VPS

Berikut adalah Standar Operasional Prosedur (SOP) rutin saat Anda melakukan perbaikan bug atau penambahan fitur baru:

### 1. Di Komputer Lokal (Development & Testing)
1. **Buat Branch Kerja Baru** (opsional tapi disarankan):
   ```bash
   git checkout -b fix/nama-perbaikan
   ```
2. **Lakukan Koding / Modifikasi**:
   - Jika membuat migrasi database, pastikan trigger menggunakan `DROP TRIGGER IF EXISTS <nama_trigger> ON <tabel>;` sebelum `CREATE TRIGGER`.
3. **Jalankan Verifikasi Kualitas Otomatis Sebelum Push**:
   ```bash
   ./scripts/dev/pre-push.sh
   ```
   *Skrip ini akan menguji kompilasi Rust, test integrasi akuntansi/inventori, type check TypeScript, build bundle Vite, serta mengaudit idempotency SQL secara otomatis.*

### 2. Di GitHub (Version Control & CI Quality Gate)
1. **Commit & Push**:
   ```bash
   git add .
   git commit -m "fix(modul): deskripsi perbaikan"
   git push origin main
   ```
2. **Pantau Pipeline CI**:
   - Buka tab **Actions** di repositori GitHub.
   - Pastikan alur `ERPQu Quality Gate CI Pipeline` berwarna hijau (lulus).

### 3. Di Server VPS (Deployment)

#### Cara A: Otomatis via GitHub Actions (Rekomendasi)
Jika Secret `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`, serta `CLOUDFLARE_ZONE_ID` & `CLOUDFLARE_API_TOKEN` telah dikonfigurasi di GitHub Secrets, deployment berjalan 100% otomatis saat push ke `main`.

#### Cara B: Manual / One-Click Script di Terminal VPS
Jika Anda login langsung ke terminal VPS, cukup jalankan skrip resmi yang telah disediakan:
```bash
cd /opt/erpqu

# Tarik kode terbaru
git pull origin main

# Jalankan deployment aman dengan backup mandatori, migrasi, dan health check
./deploy/scripts/deploy_vps.sh
```

*Skrip `deploy_vps.sh` secara otomatis:*
- Membuat file cadangan database (`pg_dump`) ke `/backups/pre_deploy_<timestamp>.dump`.
- Memperbarui image container frontend & backend.
- Menjalankan migrasi database (*fail-closed* — jika migrasi gagal, sistem batal deploy dan DB tetap utuh).
- Melakukan rolling restart container.
- Menunggu hingga backend siap merespons `/health` (jika gagal, otomatis me-restore database dan container versi lama).
- Melakukan pembersihan cache CDN Cloudflare (jika `CLOUDFLARE_API_TOKEN` diset di `.env`).

