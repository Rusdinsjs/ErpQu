import re

file_path = "/home/rus/projects/erp-system/web-admin/src/config/docTypeFormSchemas.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update DocTypeSchema module type definition
content = content.replace("module: 'Selling' | 'Buying' | 'Stock';", "module: 'Selling' | 'Buying' | 'Stock' | 'Finance' | 'Assets';")
content = content.replace("moduleName: 'Selling' | 'Buying' | 'Stock'", "moduleName: 'Selling' | 'Buying' | 'Stock' | 'Finance' | 'Assets'")

finance_schemas_code = """
    // ─── FINANCE & ACCOUNTING DOCTYPES ─────────────────────────────────────────
    'Payment Entry': {
        title: 'Payment Entry',
        module: 'Finance',
        namingSeriesPrefix: 'ACC-PAY-.YYYY.-',
        fields: [
            { name: 'voucher_no', label: 'No. Voucher / Seri', type: 'Data', required: true, defaultValue: 'ACC-PAY-2026-0001' },
            { name: 'posting_date', label: 'Tanggal Posting', type: 'Date', required: true },
            { name: 'payment_type', label: 'Tipe Pembayaran', type: 'Select', options: ['Receive (Penerimaan)', 'Pay (Pembayaran)', 'Internal Transfer'], required: true, defaultValue: 'Receive (Penerimaan)' },
            { name: 'party_type', label: 'Tipe Pihak (Party)', type: 'Select', options: ['Customer', 'Supplier', 'Employee', 'Shareholder'], required: true, defaultValue: 'Customer' },
            { name: 'party_name', label: 'Nama Pihak (Pelanggan / Supplier)', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'paid_amount', label: 'Jumlah Dibayar (Rp)', type: 'Currency', required: true, defaultValue: 0 },
            { name: 'mode_of_payment', label: 'Metode Pembayaran', type: 'Select', options: ['Kas Tunai', 'Transfer Bank BCA', 'Transfer Bank Mandiri', 'Cek / Giro'], required: true, defaultValue: 'Transfer Bank BCA' },
            { name: 'paid_from_account', label: 'Akun Asal (Paid From)', type: 'Select', options: ['1110.001 - Kas Utam', '1120.001 - Bank BCA Utama', '1120.002 - Bank Mandiri'], targetLink: 'Chart of Accounts' },
            { name: 'paid_to_account', label: 'Akun Tujuan (Paid To)', type: 'Select', options: ['1120.001 - Bank BCA Utama', '1130.001 - Piutang Usaha', '2110.001 - Hutang Usaha'], targetLink: 'Chart of Accounts' },
            { name: 'reference_no', label: 'No. Referensi / Cheque No', type: 'Data' },
            { name: 'remarks', label: 'Catatan / Keterangan', type: 'Text' },
        ]
    },

    'Payment Reconciliation': {
        title: 'Payment Reconciliation',
        module: 'Finance',
        namingSeriesPrefix: 'ACC-REC-.YYYY.-',
        fields: [
            { name: 'company', label: 'Perusahaan', type: 'Select', options: ['SJS Group', 'Main Operations'], required: true, defaultValue: 'SJS Group' },
            { name: 'party_type', label: 'Tipe Pihak', type: 'Select', options: ['Customer', 'Supplier'], required: true, defaultValue: 'Customer' },
            { name: 'party', label: 'Pihak (Customer / Supplier)', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'receivable_payable_account', label: 'Akun Piutang / Hutang', type: 'Select', options: ['1130.001 - Piutang Usaha', '2110.001 - Hutang Usaha'], targetLink: 'Chart of Accounts' },
            { name: 'bank_cash_account', label: 'Akun Bank / Kas', type: 'Select', options: ['1120.001 - Bank BCA Utama', '1110.001 - Kas Utama'], targetLink: 'Chart of Accounts' },
            { name: 'unreconciled_amount', label: 'Jumlah Belum Direkonsiliasi (Rp)', type: 'Currency', defaultValue: 0 },
            { name: 'remarks', label: 'Catatan Rekonsiliasi', type: 'Text' },
        ]
    },

    'Bank Account': {
        title: 'Bank Account',
        module: 'Finance',
        namingSeriesPrefix: 'BANK-ACC-',
        fields: [
            { name: 'account_name', label: 'Nama Rekening / Akun', type: 'Data', required: true },
            { name: 'account_number', label: 'Nomor Rekening', type: 'Data', required: true },
            { name: 'bank_name', label: 'Nama Bank', type: 'Select', options: ['Bank Central Asia (BCA)', 'Bank Mandiri', 'Bank Negara Indonesia (BNI)', 'Bank Rakyat Indonesia (BRI)', 'Bank Syariah Indonesia (BSI)'], required: true },
            { name: 'branch_name', label: 'Cabang Bank', type: 'Data' },
            { name: 'swift_code', label: 'SWIFT / BIC Code', type: 'Data' },
            { name: 'company', label: 'Perusahaan Owner', type: 'Select', options: ['SJS Group', 'Main Operations'], defaultValue: 'SJS Group' },
            { name: 'gl_account', label: 'Akun Buku Besar (GL Account)', type: 'Select', options: ['1120.001 - Bank BCA Utama', '1120.002 - Bank Mandiri Operasional', '1120.003 - Bank BNI Payroll'], targetLink: 'Chart of Accounts' },
            { name: 'is_active', label: 'Status Rekening Aktif', type: 'Check', defaultValue: true },
        ]
    },

    'Bank Transaction': {
        title: 'Bank Transaction',
        module: 'Finance',
        namingSeriesPrefix: 'BT-2026-',
        fields: [
            { name: 'bank_account', label: 'Rekening Bank', type: 'Select', options: ['BCA Operasional (1234567890)', 'Mandiri Utama (0987654321)'], required: true, targetLink: 'Bank Account' },
            { name: 'date', label: 'Tanggal Transaksi Mutasi', type: 'Date', required: true },
            { name: 'deposit', label: 'Kredit / Masuk (Rp)', type: 'Currency', defaultValue: 0 },
            { name: 'withdrawal', label: 'Debit / Keluar (Rp)', type: 'Currency', defaultValue: 0 },
            { name: 'reference_number', label: 'Nomor Referensi Mutasi', type: 'Data' },
            { name: 'description', label: 'Deskripsi / Berita Mutasi', type: 'Text' },
        ]
    },

    'Cost Center': {
        title: 'Cost Center',
        module: 'Finance',
        namingSeriesPrefix: 'CC-',
        fields: [
            { name: 'code', label: 'Kode Pusat Biaya (Cost Center Code)', type: 'Data', required: true },
            { name: 'name', label: 'Nama Pusat Biaya', type: 'Data', required: true },
            { name: 'parent_cost_center', label: 'Induk Pusat Biaya (Parent)', type: 'Select', options: ['Main Operations', 'Divisi Produksi', 'Divisi Marketing', 'Divisi IT & Infrastruktur'], targetLink: 'Cost Center' },
            { name: 'company', label: 'Perusahaan', type: 'Select', options: ['SJS Group', 'Main Operations'], defaultValue: 'SJS Group' },
            { name: 'is_group', label: 'Grup Pusat Biaya (Header)', type: 'Check', defaultValue: false },
        ]
    },

    'Sales Tax Template': {
        title: 'Sales Tax Template',
        module: 'Finance',
        namingSeriesPrefix: 'STAX-',
        fields: [
            { name: 'title', label: 'Judul Template Pajak Penjualan', type: 'Data', required: true },
            { name: 'company', label: 'Perusahaan', type: 'Select', options: ['SJS Group', 'Main Operations'], defaultValue: 'SJS Group' },
            { name: 'tax_category', label: 'Kategori Pajak', type: 'Select', options: ['PPN 11%', 'Pajak Daerah 10%', 'Non Pajak / Bebas PPN'], targetLink: 'Tax Category' },
            { name: 'total_tax_rate', label: 'Total Tarif Pajak (%)', type: 'Float', required: true, defaultValue: 11 },
            { name: 'is_default', label: 'Jadikan Template Default', type: 'Check', defaultValue: false },
        ]
    },

    'Purchase Tax Template': {
        title: 'Purchase Tax Template',
        module: 'Finance',
        namingSeriesPrefix: 'PTAX-',
        fields: [
            { name: 'title', label: 'Judul Template Pajak Pembelian', type: 'Data', required: true },
            { name: 'company', label: 'Perusahaan', type: 'Select', options: ['SJS Group', 'Main Operations'], defaultValue: 'SJS Group' },
            { name: 'tax_category', label: 'Kategori Pajak', type: 'Select', options: ['PPN Masukan 11%', 'PPh Pasal 23 (2%)', 'PPh Pasal 4 ayat 2 (10%)'], targetLink: 'Tax Category' },
            { name: 'total_tax_rate', label: 'Total Tarif Pajak (%)', type: 'Float', required: true, defaultValue: 11 },
            { name: 'is_default', label: 'Jadikan Template Default', type: 'Check', defaultValue: false },
        ]
    },

    'Credit Note': {
        title: 'Credit Note',
        module: 'Finance',
        namingSeriesPrefix: 'ACC-CN-.YYYY.-',
        fields: [
            { name: 'voucher_no', label: 'No. Nota Kredit', type: 'Data', required: true, defaultValue: 'ACC-CN-2026-0001' },
            { name: 'posting_date', label: 'Tanggal Posting', type: 'Date', required: true },
            { name: 'customer_name', label: 'Nama Pelanggan / Customer', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'total_amount', label: 'Total Nilai Retur (Rp)', type: 'Currency', required: true, defaultValue: 0 },
            { name: 'reason', label: 'Alasan Retur / Credit Note', type: 'Select', options: ['Kerusakan Barang Saat Pengiriman', 'Cacat Produksi / Defect', 'Kelebihan Tagihan / Overcharge', 'Pembatalan Sebagian Pesanan'], required: true },
            { name: 'remarks', label: 'Catatan / Remarks', type: 'Text' },
        ]
    },

    'Debit Note': {
        title: 'Debit Note',
        module: 'Finance',
        namingSeriesPrefix: 'ACC-DN-.YYYY.-',
        fields: [
            { name: 'voucher_no', label: 'No. Nota Debit', type: 'Data', required: true, defaultValue: 'ACC-DN-2026-0001' },
            { name: 'posting_date', label: 'Tanggal Posting', type: 'Date', required: true },
            { name: 'supplier_name', label: 'Nama Pemasok / Supplier', type: 'Data', required: true, targetLink: 'Supplier' },
            { name: 'total_amount', label: 'Total Nilai Retur (Rp)', type: 'Currency', required: true, defaultValue: 0 },
            { name: 'reason', label: 'Alasan Retur / Debit Note', type: 'Select', options: ['Pengembalian Material Cacat Ke Vendor', 'Penyesuaian Diskon Pembelian', 'Kekurangan Kuantitas Kirim Vendor'], required: true },
            { name: 'remarks', label: 'Catatan / Remarks', type: 'Text' },
        ]
    },

    'Dunning': {
        title: 'Dunning',
        module: 'Finance',
        namingSeriesPrefix: 'DUNN-.YYYY.-',
        fields: [
            { name: 'voucher_no', label: 'No. Surat Tagihan (Dunning ID)', type: 'Data', required: true, defaultValue: 'DUNN-2026-0001' },
            { name: 'posting_date', label: 'Tanggal Surat', type: 'Date', required: true },
            { name: 'customer_name', label: 'Nama Pelanggan (Debitur)', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'dunning_type', label: 'Tingkat Peringatan Tagihan', type: 'Select', options: ['Pengingat Pertama (Peringatan Muka)', 'Pengingat Kedua (Surat Peringatan I)', 'Pengingat Ketiga (Surat Peringatan II)', 'Tindakan Hukum / Somasi'], required: true },
            { name: 'dunning_fee', label: 'Biaya Keterlambatan / Dunning Fee (Rp)', type: 'Currency', defaultValue: 50000 },
            { name: 'grand_total', label: 'Total Tagihan + Biaya (Rp)', type: 'Currency', required: true, defaultValue: 0 },
            { name: 'remarks', label: 'Catatan Penagihan', type: 'Text' },
        ]
    },
"""

# Insert finance schemas right before DOCTYPE_SCHEMAS ends
pos = content.rfind("};")
if pos != -1:
    new_content = content[:pos] + finance_schemas_code + content[pos:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Finance schemas successfully appended to docTypeFormSchemas.ts!")
else:
    print("Could not find insertion position in docTypeFormSchemas.ts")
