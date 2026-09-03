# Standard Operating Procedure (SOP): Disaster Recovery & Cloud Offsite Backup

Dokumen resmi Prosedur Operasional Standar (*Standard Operating Procedure*) penanganan darurat pemulihan bencana (*Disaster Recovery*) dan strategi pencadangan *offsite* ke Cloud Object Storage untuk sistem ERPQu.

---

## 🎯 1. Target Metrik Keandalan (SLA)

| Parameter | Target Enterprise | Deskripsi |
|:---|:---|:---|
| **RTO (Recovery Time Objective)** | **&lt; 15 Menit** | Waktu maksimal yang dibutuhkan untuk menyalakan kembali sistem ERPQu setelah terjadi kerusakan server total. |
| **RPO (Recovery Point Objective)** | **&lt; 24 Jam** | Batas maksimal data transaksi yang hilang dihitung dari jadwal backup harian terakhir (atau &lt; 1 jam dengan streaming WAL). |
| **Enkripsi Transit & At-Rest** | **AES-256-CBC (PBKDF2)** | Seluruh file arsip dienkripsi sebelum meninggalkan server lokal sehingga aman disimpan di cloud publik manapun. |
| **Penyedia Cloud Offsite** | **Cloudflare R2 / AWS S3 / Wasabi** | Kompatibel penuh dengan protokol AWS S3 API. |

---

## ☁️ 2. Konfigurasi Cloud Object Storage (Cloudflare R2 / AWS S3)

Untuk mengaktifkan sinkronisasi otomatis ke cloud *offsite*, tambahkan variabel berikut pada file `/opt/erpqu/.env` di server produksi:

```env
# --- CLOUD BACKUP CONFIGURATION (S3 / CLOUDFLARE R2) ---
# Nama Bucket
S3_BUCKET=s3://erpqu-production-backups

# Endpoint URL (Wajib diisi untuk Cloudflare R2, Wasabi, atau MinIO)
# Contoh Cloudflare R2: https://<account_id>.r2.cloudflarestorage.com
S3_ENDPOINT_URL=https://abc123xyz.r2.cloudflarestorage.com

# Kredensial Akses Cloud Storage
AWS_ACCESS_KEY_ID=kunci_akses_s3_anda
AWS_SECRET_ACCESS_KEY=kunci_rahasia_s3_anda
AWS_DEFAULT_REGION=auto

# Kunci Enkripsi AES-256 Client-Side (Wajib minimal 32 karakter!)
BACKUP_ENCRYPTION_KEY=KunciRahasiaEnkripsiBackupSuperKuat32Char!

# Notifikasi Alert WhatsApp
ALERT_WHATSAPP_NUMBER=6281234567890
```

> **💡 Rekomendasi:** Gunakan **Cloudflare R2** karena tidak mengenakan biaya transfer keluar (*Zero Egress Fee*), menghemat anggaran operasional secara signifikan saat memulihkan database puluhan Gigabyte.

---

## 🔒 3. Mekanisme Enkripsi AES-256 Client-Side

1. **Proses Enkripsi (Otomatis saat Backup)**:
   Data PostgreSQL di-*dump* secara lokal, lalu dienkripsi menggunakan perintah:
   ```bash
   openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
     -in database.dump -out database.dump.enc -pass "pass:$BACKUP_ENCRYPTION_KEY"
   ```
2. **Proses Dekripsi (Otomatis saat Restore)**:
   Skrip `restore.sh` secara cerdas mendeteksi ekstensi `.enc` dan langsung mendekripsi arsip ke dalam memory buffer/temp terisolasi sebelum di-inject ke PostgreSQL:
   ```bash
   ./scripts/restore.sh /backups/daily/management_system_20260903.dump.enc --yes
   ```

---

## 🧪 4. Latihan Pemulihan Rutin (*Automated Disaster Recovery Drill*)

Kebijakan terbaik operasional database adalah menguji restore secara berkala tanpa menyentuh database produksi aktif.

Jalankan perintah uji drill kapan saja:
```bash
cd /opt/erpqu
./scripts/test_restore_drill.sh
```

### Apa yang Dilakukan oleh Skrip Drill?
1. Mengambil arsip backup terakhir (termasuk yang terenkripsi `.dump.enc`).
2. Membuat database terisolasi sementara bernama `erpqu_drill_<timestamp>`.
3. Memulihkan seluruh 8 skema (`public`, `hr`, `crm`, `rental`, `inventory`, `commercial`, `finance`, `ops`).
4. Memvalidasi jumlah tabel dasar (&gt; 20 tabel) dan keterbacaan data master.
5. Menghapus database drill setelah verifikasi sukses (*Clean Up*).

---

## 🚨 5. Prosedur Tanggap Darurat Bencana (*Disaster Failover SOP*)

Jika server VPS utama terbakar, terkena ransomware, atau mati total:

### Langkah 1: Siapkan VPS Baru dalam 3 Menit
Sewa server baru di penyedia hosting pilihan, lalu jalankan *One-Command Provisioning*:
```bash
ssh root@<IP_VPS_BARU>
curl -fsSL https://raw.githubusercontent.com/Rusdinsjs/erp-system/main/deploy/scripts/setup_vps.sh | bash
```

### Langkah 2: Unduh File Backup Terakhir dari Cloud Storage
```bash
cd /opt/erpqu

# Unduh via AWS CLI dari Cloudflare R2 / AWS S3:
aws s3 cp --endpoint-url https://abc123xyz.r2.cloudflarestorage.com \
  s3://erpqu-production-backups/daily/ /backups/daily/ --recursive
```

### Langkah 3: Jalankan Pemulihan Database
```bash
export BACKUP_ENCRYPTION_KEY="KunciRahasiaEnkripsiBackupSuperKuat32Char!"

# Restore file backup terenkripsi ke database produksi:
./scripts/restore.sh /backups/daily/management_system_TERBARU.dump.enc --yes
```

### Langkah 4: Nyalakan Seluruh Container & Alihkan DNS
```bash
# 1. Nyalakan seluruh stack aplikasi
docker compose -f docker-compose.prod.yml up -d

# 2. Alihkan DNS A-Record domain perusahaan
# Buka Cloudflare / DNS Manager: Ubah IP A-Record erp.perusahaan.co.id ke <IP_VPS_BARU>
```

🎉 **Sistem ERPQu kembali online 100% dalam waktu &lt; 15 menit dengan integritas data utuh!**
