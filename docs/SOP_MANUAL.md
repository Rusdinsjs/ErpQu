# Standar Operasional Prosedur (SOP) & Panduan Pengguna ERPQu

Dokumen ini berisi panduan operasional langkah-demi-langkah bagi staf operasional, akuntan, manajer logistik, dan pimpinan perusahaan dalam menggunakan sistem ERPQu.

---

## 📘 Modul 1: Akuntansi PSAK & e-Faktur Pajak

### 1.1 Menambahkan Akun Baru pada Bagan Akun (COA)
1. Buka menu **Accounting $\rightarrow$ Chart of Accounts**.
2. Pilih entitas perusahaan yang aktif di bagian header.
3. Klik tombol **"+ New Account"**.
4. Masukkan kode akun standar PSAK (contoh: `1130` untuk Piutang Usaha), nama akun, klasifikasi (*Asset, Liability, Equity, Revenue, Expense*), dan saldo normal (*Debit / Credit*).
5. Klik **Simpan**.

### 1.2 Menerbitkan & Mengekspor e-Faktur Pajak (DJP Online)
1. Buka menu **Finance $\rightarrow$ e-Faktur DJP Online**.
2. Untuk merekam faktur baru:
   - Klik **"Terbitkan Faktur Pajak"**.
   - Masukkan Nomor Seri Faktur Pajak (NSFP) dari DJP Online (format: `010.000-YY.XXXXXXXX`).
   - Masukkan nama lawan transaksi dan NPWP pembeli (15 atau 16 digit).
   - Masukkan Dasar Pengenaan Pajak (DPP). Sistem akan otomatis menghitung PPN 11%.
   - Klik **Simpan & Terbitkan**.
3. Untuk mengunduh file impor DJP:
   - Pilih rentang tanggal transaksi di filter tanggal.
   - Klik tombol hijau **"Export CSV e-Faktur DJP"**.
   - File CSV yang diunduh langsung dapat diimpor ke aplikasi **DJP e-Faktur 3.0 / 4.0** tanpa perlu konversi manual.

---

## 📦 Modul 2: Manajemen Persediaan & Rantai Pasok

### 2.1 Menjalankan Analisis Pareto ABC (80/20)
1. Buka menu **Stock & Logistics $\rightarrow$ ABC Inventory Analysis**.
2. Tinjau 4 kartu metrik utama di bagian atas:
   - **Total Valuasi Persediaan**: Nilai total rupiah seluruh stok di gudang.
   - **Kelas A (70%)**: Suku cadang bernilai tinggi (wajib diaudit fisik setiap minggu).
   - **Kelas B (20%)**: Suku cadang prioritas menengah (audit fisik setiap bulan).
   - **Kelas C (10%)**: Barang massal/baut/consumable (audit fisik per semester).
3. Gunakan tombol filter `Kelas A`, `Kelas B`, atau `Kelas C` untuk menyusun daftar penghitungan fisik stok (*Cycle Count*).

### 2.2 Menindaklanjuti Peringatan Stok Menipis (*Low Stock Alerts*)
1. Buka menu **Stock & Logistics $\rightarrow$ Low Stock Alerts**.
2. Periksa tabel defisit stok:
   - Item dengan badge merah **"HABIS (0)"**: Kritis, operasional terancam berhenti.
   - Item dengan badge kuning **"DI BAWAH MIN"**: Stok berada di bawah batas aman.
3. Klik tombol aksi **"Reorder"** pada baris barang terkait untuk otomatis membuat draft *Material Request* atau *Purchase Order* ke pemasok.

---

## 🏭 Modul 3: Manufaktur & Operasional Pabrik

### 3.1 Menghitung Kebutuhan Bahan Baku (MRP Exploding Simulator)
1. Buka menu **Manufacturing $\rightarrow$ Bill of Materials (BOM)**.
2. Cari formula perakitan yang ingin diproduksi (contoh: `BOM-BUCKET-EXC20`).
3. Klik tombol biru **"Hitung Kebutuhan Bahan (MRP)"**.
4. Masukkan target jumlah unit yang ingin diproduksi (contoh: `5 unit`).
5. Sistem akan menampilkan rincian:
   - Kebutuhan bersih komponen.
   - Tambahan toleransi susut / scrap (contoh: 3.5%).
   - Total kebutuhan kotor bahan baku yang wajib disiapkan dari gudang.

### 3.2 Menjalankan Siklus Surat Perintah Kerja (SPK) Produksi
1. Buka menu **Manufacturing $\rightarrow$ Production Orders**.
2. Klik **"+ Tambah SPK"** untuk membuat perintah kerja baru.
3. Alur status SPK:
   - `DRAFT`: Draft rencana produksi.
   - `SUBMITTED`: SPK disetujui untuk penjadwalan pabrik.
   - `IN_PROGRESS`: Proses pemotongan, pengelasan, atau perakitan sedang berlangsung di lantai kerja.
   - `COMPLETED`: Produksi tuntas 100%. Sistem otomatis memicu pencatatan barang jadi dan pengiriman notifikasi WhatsApp ke Kepala Pabrik & Tim QC.

---

## 💼 Modul 4: CRM Penjualan & Pipeline Prospek

### 4.1 Mengelola Pipeline Penjualan Kanban
1. Buka menu **Selling & CRM $\rightarrow$ Sales Pipeline**.
2. Peluang transaksi disusun dalam 5 kolom tahapan:
   - **Prospecting**: Pendekatan awal dan identifikasi kebutuhan klien.
   - **Qualification**: Verifikasi anggaran dan kelayakan proyek.
   - **Proposal**: Penyerahan surat penawaran harga resmi (*Quotation*).
   - **Won**: Transaksi disepakati / kontrak ditandatangani.
   - **Lost**: Transaksi batal atau kalah bersaing.
3. Untuk memindahkan tahap transaksi, klik tombol navigasi panah pada kartu peluang atau ubah status transaksi.

### 4.2 Membaca Analisis Win/Loss Funnel
1. Buka menu **Selling & CRM $\rightarrow$ CRM Sales Funnel & Win/Loss**.
2. Evaluasi kartu performa:
   - **Win Ratio**: Persentase peluang yang berhasil dimenangkan.
   - **Rata-rata Nilai Transaksi Menang**: Ukuran rata-rata deal bernilai tinggi.
   - **Rekomendasi Strategis**: Tips otomatis dari sistem untuk meningkatkan konversi proposal.

---

## 📱 Modul 5: Pengaturan Notifikasi WhatsApp Gateway

### 5.1 Menghubungkan Akun Gateway WhatsApp
1. Buka menu **Settings $\rightarrow$ WhatsApp Gateway**.
2. Pilih provider Anda (**Fonnte**, **Wablas**, atau **UltraMsg**).
3. Masukkan **API Token** yang diperoleh dari dashboard provider Anda.
4. Masukkan nomor WhatsApp pengirim resmi perusahaan.
5. Centang kotak **"Aktifkan Pengiriman Langsung ke WhatsApp Gateway"**.
6. Klik **"Simpan Konfigurasi Gateway"**.

### 5.2 Menguji Pengiriman Pesan
1. Pada kartu **Simulasi Uji Kirim Pesan**:
   - Masukkan nomor HP penerima (contoh: `081234567890`).
   - Pilih template otomatis:
     - 🚨 *Peringatan Stok Menipis*
     - 🏭 *SPK Produksi Tuntas*
     - 📄 *Pengingat Tagihan Invoice*
   - Periksa pratinjau teks pesan.
   - Klik **"Kirim Uji Pesan WhatsApp"**.
2. Periksa status pengiriman pada tabel **Riwayat Log Pengiriman Pesan** di bagian bawah.
