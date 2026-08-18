L. EAM, rental, fleet dan telemetry
 Perbaiki tanggal depreciation schedule agar meningkat per periode.
 Hubungkan depreciation schedule ke asset ledger dan GL.
 Implementasikan asset capitalization, transfer, impairment, disposal dan gain/loss.
 Simpan custody serta location history secara append-only.
 Hubungkan work order ke spare part, tenaga kerja, downtime dan biaya.
 Settlement biaya work order ke asset atau expense.
 Hubungkan rental timesheet ke billing engine.
 Simpan operating, standby, breakdown dan minimum charge.
 Implementasikan tarif kontrak berdasarkan effective date.
 Validasi SIM/SIO sebelum dispatch.
 Implementasikan durable telemetry ingestion.
 Tambahkan device authentication.
 Terapkan deduplication dan sequence checking.
 Simpan event geofence dan fuel anomaly.
 Hubungkan telemetry anomaly dengan maintenance/work order.

Kriteria lulus: Timesheet menghasilkan invoice yang dapat direkonstruksi, dan biaya asset dapat direkonsiliasi ke GL.

M. Outbox, background jobs dan integration reliability
 Implementasikan outbox dispatcher produksi.
 Ambil event memakai locking seperti FOR UPDATE SKIP LOCKED.
 Implementasikan retry dan exponential backoff.
 Implementasikan dead-letter queue.
 Buat handler idempotent.
 Tandai event Completed hanya setelah side effect berhasil.
 Tambahkan outbox lag metric.
 Implementasikan distributed job lock.
 Jangan memakai scheduler lokal tanpa cluster locking.
 Pastikan scheduler tidak berhenti karena object lifecycle.
 Simpan execution history.
 Tambahkan manual retry dengan authorization dan audit.
 Uji process crash sebelum dan setelah side effect.

Kriteria lulus: Restart atau crash tidak menghilangkan event dan tidak menciptakan duplicate business effect.

N. Observability dan operasional

 Tambahkan /health untuk liveness.

 Tambahkan /ready yang memeriksa PostgreSQL, Redis dan dependency kritis.

 Tambahkan /metrics.

 Implementasikan structured JSON logging.

 Tambahkan correlation ID.

 Redact password, token, cookie, authorization header dan PII.

 Gunakan centralized log aggregation.

 Tambahkan tracing untuk request, database dan background jobs.

 Definisikan SLI dan SLO.

 Buat alert untuk:

Error rate
Latency
Database saturation
Redis failure
Outbox lag
Failed login
Failed payment
GL imbalance
Backup failure

 Sinkronkan waktu server.

 Terapkan resource limit dan capacity monitoring.

 Buat runbook insiden.

Kriteria lulus: Operator dapat menemukan penyebab kegagalan transaksi dari correlation ID tanpa membuka database secara manual.

Dari point L, M dan N di atas :

1. Riset dan Teliti apakah aplikasi Erpqu saat ini sudah memenuhi item2 di point L, M dan N di atas? 
2. List yang sudah dan belum memenuhi kriteria.
3. Jika belum Memenuhi, buatkan Implementation Plan-nya  
4. Jangan mengarang, mengada-ada atau berhalusinasi. Riset dan teliti dengan Jujur dan Tepat, laporkan sesuai kondisi yang sebenarnya.
5. Buatkan juga Tasks