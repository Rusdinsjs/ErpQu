

A Authentication dan session security
BLOCKER: Pindahkan session revocation dari HashMap ke Redis atau database.

Pindahkan login lockout dari memory ke Redis.

Gunakan access token berumur pendek.

Gunakan rotating refresh token.

Simpan hash refresh token di server.

Tambahkan endpoint refresh, logout, logout-all, dan revoke-session.

Cabut semua sesi setelah:

Password diubah
Role diubah
User dinonaktifkan
Indikasi kompromi
Gunakan expiry dari konfigurasi, bukan hard-coded 24 jam.

Jangan mengabaikan kegagalan update_last_login.

Permission lookup gagal harus menghasilkan penolakan, bukan fallback longgar.

Jangan menyimpan bearer token jangka panjang di localStorage.

Gunakan HttpOnly, Secure, SameSite cookie atau pola BFF.

Implementasikan CSRF protection bila memakai cookie.

Tambahkan MFA untuk super-admin, finance approver, payroll approver, dan release payment.

Terapkan rate limit per IP, akun, dan device fingerprint.

Audit login sukses, gagal, lockout, refresh, logout, dan revocation.

Kriteria lulus: Logout dan perubahan role berlaku pada semua instance server dalam hitungan detik.

B. Upload dan attachment
Validasi file berdasarkan isi sebenarnya, bukan ekstensi atau MIME dari client.
Tolak file image yang gagal didekode.
Jalankan malware scanning.
Gunakan quarantine sebelum file tersedia.
Simpan file di private object storage.
Gunakan signed URL dengan expiry singkat.
Terapkan authorization berdasarkan resource induk.
Admin tidak boleh otomatis mengakses file lintas company.
Pastikan file dan metadata tersimpan secara konsisten.
Hapus file bila transaksi metadata gagal.
Tangani kegagalan penghapusan file.
Tambahkan quota per tenant.
Audit upload, download, preview, dan delete.
Kriteria lulus: Anonymous access, IDOR, traversal, polyglot file, MIME spoofing, dan cross-company download seluruhnya ditolak.

Dari point A dan B di atas

1. Riset dan Teliti apakah aplikasi Erpqu saat ini sudah memenuhi item2 di point A dan B di atas? 
2. List yang sudah dan belum memenuhi kriteria.
3. Jika belum Memenuhi, buatkan Implementation Plan-nya  
4. Jangan mengarang, mengada-ada atau berhalusinasi. Riset dan teliti dengan Jujur dan Tepat, laporkan sesuai kondisi yang sebenarnya.
5. Buatkan juga Tasks

