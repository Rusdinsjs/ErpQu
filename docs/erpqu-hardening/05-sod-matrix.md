# Matriks Segregation of Duties (SoD) & Maker-Checker (Fase 5 Design Gate)

Dokumen ini mendefinisikan aturan pemisahan tugas (Segregation of Duties) yang wajib ditegakkan pada tingkat kernel bisnis backend untuk mencegah kecurangan (*fraud*), konflik kepentingan, dan kesalahan material pada pembukuan keuangan.

---

## 1. Prinsip Utama Segregation of Duties
1. **Aturan Dasar Maker != Checker**: Pengguna yang membuat atau menyusun transaksi (`created_by`) dilarang keras menyetujui (`approved_by`), mem-posting (`posted_by`), atau mencairkan (`disbursed_by`) dokumen yang sama.
2. **Ketiadaan Bypass Super-Admin pada Transaksi Keuangan**: Super-Admin sekalipun tidak boleh melewati aturan SoD transaksi tanpa delegasi formal dan jejak audit khusus.
3. **Fail-Closed Verification**: Setiap endpoint yang mengubah status transaksi menjadi `APPROVED`, `POSTED`, `SUBMITTED`, atau `DISBURSED` wajib memverifikasi identitas penandatangan terhadap pembuat dokumen.

---

## 2. Matriks Konflik Tugas (Conflict Matrix)

| Kode Konflik | Fungsi A (Maker / Inisiator) | Fungsi B (Checker / Approver / Releaser) | Risiko Material | Aturan Pencegahan Backend (Kernel Rule) |
| :--- | :--- | :--- | :--- | :--- |
| **SOD-001** | **Pembuatan / Perubahan Master Vendor** (`crm.vendor.create/edit`) | **Persetujuan Pembayaran Faktur Vendor** (`finance.payment.approve`) | Pembuatan vendor fiktif untuk menyalurkan dana perusahaan. | Pengguna yang mengedit detail rekening vendor dalam 30 hari terakhir dilarang menyetujui pembayaran ke vendor tersebut. |
| **SOD-002** | **Pengaturan Limit Kredit Pelanggan** (`crm.client.credit_limit`) | **Persetujuan Pesanan Penjualan (SO)** (`sales.order.approve`) | Pemberian kredit tanpa agunan/analisis risiko untuk transaksi berisiko tinggi. | Persetujuan SO di atas batas limit kredit wajib dilakukan oleh Finance Manager independen, bukan tim Sales. |
| **SOD-003** | **Penyusunan Voucher Jurnal** (`finance.journal.create`) | **Posting Jurnal ke General Ledger** (`finance.journal.post`) | Rekayasa saldo buku besar dan manipulasi laporan laba rugi. | `journal.created_by != current_user.id`. Status `POSTED` hanya dapat disematkan oleh verifikator berbeda. |
| **SOD-004** | **Pembuatan Purchase Order (PO)** (`procurement.po.create`) | **Persetujuan Purchase Order (PO)** (`procurement.po.approve`) | Pembelian barang tanpa otorisasi anggaran atau *kickback*. | `po.created_by != current_user.id`. Approval berjenjang berdasarkan threshold nilai transaksi. |
| **SOD-005** | **Penerimaan Barang (Goods Receipt / PR)** (`inventory.receipt.create`) | **Persetujuan Faktur Pembelian (Vendor Bill)** (`procurement.bill.approve`) | Penerimaan barang fiktif yang kemudian ditagihkan ke kas perusahaan. | Petugas penerima fisik gudang tidak boleh menjadi approver faktur tagihan AP (*Three-Way Matching Rule*). |
| **SOD-006** | **Pemeliharaan Data Karyawan & Gaji Master** (`hr.employee.edit`) | **Persetujuan & Rilis Payroll** (`hr.payroll.approve/disburse`) | Pembuatan karyawan siluman (*ghost employees*) atau manipulasi rekening gaji. | `payroll.approved_by != hr_master_editor_id` AND `payroll.created_by != current_user.id`. |
| **SOD-007** | **Perubahan Nomor Rekening Bank Perusahaan** (`finance.bank_account.edit`) | **Rilis Pembayaran / Transfer Bank** (`finance.payment.release`) | Pengalihan rute pembayaran ke rekening pribadi penipu. | Penambahan/perubahan rekening penampung wajib melalui dual-approval (4-Eyes Principle). |
| **SOD-008** | **Administrasi Role & Izin User** (`rbac.user_role.assign`) | **Review & Audit Log Keamanan** (`audit.log.read`) | Administrator menghapus rekam jejak penyalahgunaan hak akses. | Role `security_auditor` terpisah dari `system_admin`. Tabel `audit_logs` append-only tanpa izin modifikasi. |
| **SOD-009** | **Pencatatan Penyesuaian Stok (Stock Opname)** (`inventory.adjustment.create`) | **Submit / Penyesuaian Nilai Stok GL** (`inventory.adjustment.submit`) | Penutupan selisih kehilangan barang gudang secara sepihak. | `stock_entry.created_by != current_user.id`. Wajib disetujui oleh Kepala Logistik / Finance. |
| **SOD-010** | **Pembuatan Kontrak Rental Unit** (`rental.contract.create`) | **Persetujuan Tarif Khusus / Diskon Kontrak** (`rental.contract.approve`) | Pemberian diskon ilegal atau manipulasi jam kerja unit alat berat. | `contract.created_by != current_user.id` jika terdapat deviasi tarif dasar atau klausul khusus. |

---

## 3. Penanganan Emergency Approval & Audit Trail
- Dalam kondisi darurat operasional di lapangan (misal: pengadaan sparepart kritis alat berat saat site tambang terhenti), jika approval darurat dilakukan oleh personil berwenang tanpa checker terpisah, sistem:
  1. Menandai status dokumen sebagai `EMERGENCY_OVERRIDE`.
  2. Menerbitkan event notifikasi instan ke Holding Internal Audit.
  3. Mencatat alasan tertulis (*mandatory justification statement*) ke dalam `audit_logs`.
  4. Mewajibkan *Post-Approval Review* dalam waktu maksimal 3x24 jam.
