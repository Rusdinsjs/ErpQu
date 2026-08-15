# Emergency Containment, Secrets Rotation, and Hygiene (Gate 0)

## 1. Tindakan Containment
1. **Pembersihan Direktori Scratch & Debug**:
   - Direktori `scratch/node_modules` dan `debug/node_modules` telah dihapus sepenuhnya dari working tree.
2. **Pengamanan Repository**:
   - Memastikan tidak ada file `.env`, file dump database, file upload pengguna, atau credential plaintext yang ter-commit ke repositori.
   - Mengaktifkan aturan pengabaian ketat pada `.gitignore`.

---

## 2. Rencana & Prosedur Rotasi Secret (Secret Rotation Protocol)

| Komponen Kredensial | Tindakan Rotasi yang Diwajibkan | Lingkungan Target |
| :--- | :--- | :--- |
| **JWT Secret Key** | Generate 256-bit cryptographically secure random string baru via KMS/Vault. Revoke seluruh active token session. | Production / Staging |
| **Database Passwords** | Pisahkan role `erpqu_migrator` (DDL) dan `erpqu_app` (DML). Rotasi password kedua role di PostgreSQL cluster. | Cloud SQL / Self-hosted PG |
| **Redis Auth Token** | Rotasi `REDIS_PASSWORD` dan flush cache session lama yang berpotensi kompromi. | Redis Cluster |
| **SMTP / Mail Credentials** | Terbitkan API Key / SMTP App Password baru pada penyedia email (Sendgrid / Resend / AWS SES). | Production Mailer |
| **VPS / SSH Deploy Keys** | Ganti authorized_keys pada server produksi dan perbarui GitHub Secrets runner. | Production Infrastructure |
| **Third-Party API Keys** | Terbitkan ulang keys untuk OCR, payment gateway (Midtrans/Xendit), dan integrasi telemetri GPS. | External Integrations |

---

## 3. Reset Status Evaluasi
Status pelaksanaan hardening sebelumnya di-reset menjadi `UNVERIFIED` / `PARTIAL` untuk memastikan setiap gate (Gate 1 hingga Gate 5) diverifikasi ulang secara ketat dengan bukti eksekusi test yang nyata.
