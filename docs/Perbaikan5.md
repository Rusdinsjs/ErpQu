O. Backup dan disaster recovery
 BLOCKER: Buat backup database otomatis.
 Backup object storage dan attachment.
 Encrypt backup.
 Pisahkan lokasi backup dari VPS produksi.
 Terapkan retention policy.
 Verifikasi checksum backup.
 Uji restore ke environment baru.
 Uji database dan file attachment bersama-sama.
 Dokumentasikan RPO dan RTO.
 Lakukan minimal dua restore drill yang berhasil.
 Pastikan aplikasi dapat login dan menjalankan transaksi setelah restore.
 Simpan bukti waktu mulai, waktu selesai dan hasil verifikasi.

Kriteria lulus: Restore drill nyata berhasil, bukan sekadar mengubah field restore_verified_at.

P. Pengujian wajib
 Hapus atau ubah test yang hanya menetapkan nilai seperti is_reproducible = true.
 Golden invariant harus menguji service, API, database atau infrastructure nyata.
 Unit test untuk domain calculation.
 Repository integration test dengan PostgreSQL nyata.
 API integration test.
 Cross-tenant negative test.
 RBAC dan SoD test.
 Accounting invariant test.
 Concurrency test.
 Idempotency test.
 Migration fresh dan upgrade test.
 Backup restore test.
 WebSocket authorization test.
 Upload security test.
 End-to-end P2P, O2C, payroll, rental dan asset test.
 Load test berdasarkan volume target produksi.
 Soak test staging.
 Penetration test.
 UAT dengan pengguna bisnis.

Kriteria lulus: Seluruh test berjalan otomatis dan menguji perilaku nyata, bukan simulasi variabel lokal.

Q. API, frontend dan mobile
 Lengkapi OpenAPI untuk seluruh route utama.
 Saat ini anotasi OpenAPI masih jauh lebih sedikit daripada jumlah route.
 Tetapkan format error yang konsisten.
 Terapkan pagination, filtering dan sorting.
 Terapkan request validation.
 Gunakan optimistic locking atau version field untuk update kritis.
 Tampilkan status workflow yang sebenarnya.
 Jangan menjadikan permission frontend sebagai security control.
 Tangani expired session dan revocation.
 Hilangkan informasi sensitif dari console log.
 Tambahkan frontend error boundary.
 Tambahkan accessibility test.
 Tambahkan mobile offline conflict resolution jika fitur offline dipakai.
 Tampilkan audit dan document trail kepada pengguna berwenang.

Kriteria lulus: API contract stabil, terdokumentasi, versioned, dan diuji oleh frontend serta mobile.

Dari point O, P dan Q di atas :

1. Riset dan Teliti apakah aplikasi Erpqu saat ini sudah memenuhi item2 di point O, P dan Q di atas? 
2. List yang sudah dan belum memenuhi kriteria.
3. Jika belum Memenuhi, buatkan Implementation Plan-nya  
4. Jangan mengarang, mengada-ada atau berhalusinasi. Riset dan teliti dengan Jujur dan Tepat, laporkan sesuai kondisi yang sebenarnya.
5. Buatkan juga Tasks