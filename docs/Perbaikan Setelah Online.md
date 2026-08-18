

**A. Multi-tenant dan company isolation**

* &#x20;BLOCKER: Jadikan tenant dan company context wajib pada seluruh transaksi bisnis.
* &#x20;Tolak request tanpa company context untuk resource company-scoped.
* &#x20;Tolak X-Company-ID yang malformed.
* &#x20;Validasi company terhadap membership pengguna.
* &#x20;Admin tidak boleh otomatis melewati company boundary.
* &#x20;Terapkan company\_id NOT NULL pada seluruh tabel company-scoped.
* &#x20;Lakukan backfill data lama sebelum menambahkan NOT NULL.
* &#x20;Tambahkan foreign key dari company\_id ke tabel company.
* &#x20;Tambahkan composite unique constraint yang menyertakan company.
* &#x20;Terapkan RLS pada seluruh tabel company-scoped.
* &#x20;Gunakan FORCE ROW LEVEL SECURITY.
* &#x20;Runtime role tidak boleh menjadi table owner atau memiliki BYPASSRLS.
* &#x20;Atur app.current\_company\_id menggunakan set\_config(..., true) dalam transaksi.
* &#x20;Bersihkan tenant context setelah transaksi selesai.
* &#x20;Hapus kebijakan yang mengizinkan company\_id IS NULL untuk transaksi.
* &#x20;Perbaiki RLS yang merujuk tabel general\_ledger\_entries bila tabel aktual adalah gl\_entries.
* &#x20;Lengkapi matriks seluruh tabel aktual, bukan hanya sampel.
* &#x20;Tambahkan pengujian API dan database:

  1. Company A tidak membaca Company B
  2. Company A tidak mengubah Company B
  3. Company A tidak menghapus Company B
* Request tanpa company ditolak
* Admin tetap mengikuti batas legal entity



Kriteria lulus: Seluruh cross-company negative test menghasilkan 403 atau tidak mengembalikan data, termasuk saat repository dipanggil langsung.



B.  RBAC dan Segregation of Duties



* &#x20;BLOCKER: Hapus permission mapping berdasarkan HTTP verb saja.
* &#x20;Jangan memetakan seluruh POST sebagai .create.
* &#x20;Buat route-action registry eksplisit:

  1. create
  2. submit
  3. approve
  4. reject
  5. post
  6. reverse
  7. release
  8. disburse
  9. cancel



* &#x20;Terapkan default-deny untuk setiap route.
* &#x20;Hapus bypass global berdasarkan role\_level <= 2.
* &#x20;Batasi wildcard \*.
* &#x20;Terapkan SoD pada service bisnis, bukan hanya middleware.
* &#x20;Wajibkan maker != checker.
* &#x20;Pembuat jurnal tidak boleh mem-posting jurnal yang sama.
* &#x20;Pembuat PO tidak boleh menyetujui PO yang sama.
* &#x20;Pembuat payroll tidak boleh menyetujui atau mencairkan payroll.
* &#x20;Pengubah rekening vendor tidak boleh melepas pembayaran vendor tersebut.
* &#x20;Emergency override harus memiliki alasan, approver kedua, audit trail, dan notifikasi.
* &#x20;Setiap perubahan role harus mencabut sesi lama.
* &#x20;Buat conflict matrix yang dapat dikonfigurasi.



Kriteria lulus: Seluruh conflict test ditolak oleh backend walaupun frontend atau middleware dilewati.





Dari point A dan B di atas

1. Riset dan Teliti apakah aplikasi Erpqu saat ini sudah memenuhi item2 di point A dan B di atas? 
2. List yang sudah dan belum memenuhi kriteria.
3. Jika belum Memenuhi, buatkan Implementation Plan-nya  
4. Jangan mengarang, mengada-ada atau berhalusinasi. Riset dan teliti dengan Jujur dan Tepat, laporkan sesuai kondisi yang sebenarnya.
5. Buatkan juga Tasks

