# Production Incident Response Runbook

Dokumen ini memuat panduan penanganan insiden operasional di lingkungan produksi untuk memulihkan Service Level Objectives (SLO) ERPQu.

---

## 1. Target Service Level Objectives (SLO)

| Indikator | Target SLO | Nilai Ambang Alert |
|---|---|---|
| **System Availability** | 99.9% Uptime | Availability < 99.5% selama 5 menit |
| **API Latency (p95)** | < 250ms | Latensi p95 > 1000ms selama 3 menit |
| **Financial Posting Errors** | 0.00% (Zero Error) | Posting error > 0 dalam 1 menit |
| **Background Queue Lag** | < 100 job | Queue lag > 500 job selama 10 menit |

---

## 2. Penanganan Insiden Utama

### A. Posting Engine Failures (Tingkat Kritis P0)
- **Gejala:** Jurnal umum menolak transaksi karena ketidakseimbangan ($Debit \neq Kredit$) atau periode akuntansi terkunci.
- **Tindakan:**
  1. Periksa log terstruktur: `docker logs mgmt-backend --since 15m | grep "QACC"`
  2. Buka periode akuntansi jika transaksi sah atau instruksikan tim akuntansi melakukan revisi *Draft*.
  3. Jangan pernah membypass `AccountingPostingEngine` langsung via SQL `INSERT`!

### B. Kebocoran Koneksi Database / High CPU
- **Gejala:** Response API timeout (504), pool connection exhausted.
- **Tindakan:**
  1. Periksa koneksi aktif: `docker exec -it mgmt-db psql -U postgres -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"`
  2. Identifikasi kueri lambat: `SELECT pid, query, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != 'idle' ORDER BY age DESC;`

---

## 3. Kontak Eskalasi Insiden

- **Lead Engineer:** `oncall-eng@erpqu.internal`
- **Database Administrator (DBA):** `dba@erpqu.internal`
- **Security Incident Response Team (SIRT):** `security@erpqu.internal`
