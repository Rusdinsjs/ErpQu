// Centralized ERPNext DocType Form Field Schema Dictionary for Selling, Buying, and Stock

export type FieldType =
    | 'Data'
    | 'Select'
    | 'Link'
    | 'Date'
    | 'Time'
    | 'Currency'
    | 'Float'
    | 'Int'
    | 'Check'
    | 'Text'
    | 'Table';

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    readOnly?: boolean;
    defaultValue?: any;
    options?: string[]; // For Select
    targetLink?: string; // For Link type (target entity/docType)
    tableColumns?: FormField[]; // For Table type (child table fields)
    description?: string;
}

export interface DocTypeSchema {
    title: string;
    module: 'Selling' | 'Buying' | 'Stock';
    namingSeriesPrefix?: string;
    fields: FormField[];
}

export const DOCTYPE_SCHEMAS: Record<string, DocTypeSchema> = {
    // ─── SELLING DOCTYPES ────────────────────────────────────────────────────────
    'Customer': {
        title: 'Customer',
        module: 'Selling',
        namingSeriesPrefix: 'CUST-',
        fields: [
            { name: 'customer_name', label: 'Nama Customer', type: 'Data', required: true },
            { name: 'customer_group', label: 'Customer Group', type: 'Select', options: ['Commercial', 'Individual', 'Government', 'Non Profit'] },
            { name: 'customer_type', label: 'Customer Type', type: 'Select', options: ['Company', 'Individual'] },
            { name: 'territory', label: 'Territory', type: 'Select', options: ['Indonesia', 'Jakarta', 'Surabaya', 'Bandung', 'Overseas'] },
            { name: 'tax_id', label: 'NPWP / Tax ID', type: 'Data' },
            { name: 'credit_limit', label: 'Credit Limit (Rp)', type: 'Currency', defaultValue: 0 },
            { name: 'payment_terms', label: 'Payment Terms', type: 'Select', options: ['Cash', 'Net 15', 'Net 30', 'Net 60'] },
            { name: 'remarks', label: 'Catatan Khusus', type: 'Text' },
        ]
    },

    'Quotation': {
        title: 'Quotation',
        module: 'Selling',
        namingSeriesPrefix: 'QTN-',
        fields: [
            { name: 'customer_name', label: 'Customer / Lead', type: 'Data', required: true },
            { name: 'transaction_date', label: 'Tanggal Penawaran', type: 'Date', required: true },
            { name: 'valid_till', label: 'Berlaku Hingga', type: 'Date' },
            { name: 'order_type', label: 'Order Type', type: 'Select', options: ['Sales', 'Maintenance', 'Shopping Cart'] },
            { name: 'currency', label: 'Mata Uang', type: 'Select', options: ['IDR', 'USD', 'EUR', 'SGD'] },
            {
                name: 'items', label: 'Daftar Item Penawaran', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang / Jasa', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Harga Satuan (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Total Amount (Rp)', type: 'Currency', readOnly: true },
                ]
            },
            { name: 'terms', label: 'Syarat & Ketentuan', type: 'Text' }
        ]
    },

    'Sales Order': {
        title: 'Sales Order',
        module: 'Selling',
        namingSeriesPrefix: 'SO-',
        fields: [
            { name: 'customer_name', label: 'Customer', type: 'Data', required: true },
            { name: 'po_no', label: 'Customer PO Number', type: 'Data' },
            { name: 'transaction_date', label: 'Tanggal Order', type: 'Date', required: true },
            { name: 'delivery_date', label: 'Tanggal Pengiriman', type: 'Date' },
            { name: 'warehouse', label: 'Gudang Utama', type: 'Select', options: ['Gudang Utama', 'Gudang Transit', 'Gudang Retur'] },
            {
                name: 'items', label: 'Daftar Item Sales Order', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Harga (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Jumlah (Rp)', type: 'Currency', readOnly: true },
                ]
            },
            { name: 'status', label: 'Status SO', type: 'Select', options: ['Draft', 'To Deliver and Bill', 'To Bill', 'Completed', 'Cancelled'] }
        ]
    },

    'Sales Invoice': {
        title: 'Sales Invoice',
        module: 'Selling',
        namingSeriesPrefix: 'ACC-SINV-',
        fields: [
            { name: 'customer_name', label: 'Customer', type: 'Data', required: true },
            { name: 'posting_date', label: 'Tanggal Faktur', type: 'Date', required: true },
            { name: 'due_date', label: 'Jatuh Tempo', type: 'Date', required: true },
            { name: 'is_pos', label: 'Faktur POS / Kasir Langsung', type: 'Check' },
            {
                name: 'items', label: 'Item Rincian Tagihan', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Harga (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Subtotal (Rp)', type: 'Currency', readOnly: true },
                ]
            },
            { name: 'tax_rate', label: 'Tarif Pajak PPN (%)', type: 'Float', defaultValue: 11 }
        ]
    },

    'POS Profile': {
        title: 'POS Profile',
        module: 'Selling',
        namingSeriesPrefix: 'POS-PROF-',
        fields: [
            { name: 'profile_name', label: 'Nama Profil Kasir', type: 'Data', required: true },
            { name: 'warehouse', label: 'Gudang Kasir Default', type: 'Select', options: ['Gudang Utama', 'Store Front POS'] },
            { name: 'price_list', label: 'Price List Default', type: 'Select', options: ['Standard Selling', 'Retail POS Price'] },
            { name: 'allow_discount', label: 'Izinkan Diskon Manual di Kasir', type: 'Check', defaultValue: true },
            { name: 'update_stock', label: 'Otomatis Potong Stok Saat Transaksi', type: 'Check', defaultValue: true }
        ]
    },

    // ─── BUYING DOCTYPES ─────────────────────────────────────────────────────────
    'Supplier': {
        title: 'Supplier (Vendor)',
        module: 'Buying',
        namingSeriesPrefix: 'SUPP-',
        fields: [
            { name: 'supplier_name', label: 'Nama Supplier / Vendor', type: 'Data', required: true },
            { name: 'supplier_group', label: 'Kelompok Supplier', type: 'Select', options: ['Raw Material', 'Services', 'Equipment', 'Distributor'] },
            { name: 'country', label: 'Negara Asal', type: 'Select', options: ['Indonesia', 'Singapore', 'China', 'Japan', 'USA'] },
            { name: 'tax_id', label: 'NPWP Vendor', type: 'Data' },
            { name: 'payment_terms', label: 'Syarat Pembayaran Default', type: 'Select', options: ['Cash', 'Net 30', 'Net 60'] },
            { name: 'email', label: 'Email Resmi Vendor', type: 'Data' },
            { name: 'phone', label: 'Nomor Telepon / HP', type: 'Data' }
        ]
    },

    'Material Request': {
        title: 'Material Request',
        module: 'Buying',
        namingSeriesPrefix: 'MAT-REQ-',
        fields: [
            { name: 'request_type', label: 'Jenis Permintaan', type: 'Select', options: ['Purchase', 'Material Transfer', 'Material Issue', 'Manufacture'] },
            { name: 'schedule_date', label: 'Tgl Dibutuhkan', type: 'Date', required: true },
            { name: 'set_warehouse', label: 'Gudang Tujuan', type: 'Select', options: ['Gudang Utama', 'Gudang Bahan Baku'] },
            {
                name: 'items', label: 'Daftar Barang Diminta', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty Permintaan', type: 'Float', defaultValue: 1 },
                    { name: 'uom', label: 'Satuan', type: 'Select', options: ['Pcs', 'Box', 'Kg', 'Unit'] }
                ]
            }
        ]
    },

    'Request for Quotation (RFQ)': {
        title: 'Request for Quotation (RFQ)',
        module: 'Buying',
        namingSeriesPrefix: 'RFQ-',
        fields: [
            { name: 'transaction_date', label: 'Tanggal RFQ', type: 'Date', required: true },
            { name: 'required_date', label: 'Batas Penawaran', type: 'Date' },
            { name: 'suppliers', label: 'Daftar Vendor Tujuan', type: 'Text', description: 'Masukkan nama-nama vendor' },
            {
                name: 'items', label: 'Daftar Barang Penawaran', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty Diberikan Quote', type: 'Float', defaultValue: 1 }
                ]
            }
        ]
    },

    'Purchase Order': {
        title: 'Purchase Order',
        module: 'Buying',
        namingSeriesPrefix: 'PO-',
        fields: [
            { name: 'supplier_name', label: 'Nama Supplier', type: 'Data', required: true },
            { name: 'transaction_date', label: 'Tanggal PO', type: 'Date', required: true },
            { name: 'schedule_date', label: 'Target Kedatangan', type: 'Date' },
            {
                name: 'items', label: 'Daftar Item Purchase Order', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang / Komponen', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty Order', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Harga Satuan PO (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Total (Rp)', type: 'Currency', readOnly: true }
                ]
            },
            { name: 'status', label: 'Status PO', type: 'Select', options: ['Draft', 'To Receive and Bill', 'To Bill', 'Completed'] }
        ]
    },

    'Supplier Scorecard': {
        title: 'Supplier Scorecard',
        module: 'Buying',
        namingSeriesPrefix: 'SCORECARD-',
        fields: [
            { name: 'supplier_name', label: 'Nama Supplier', type: 'Data', required: true },
            { name: 'evaluation_date', label: 'Tanggal Evaluasi', type: 'Date', required: true },
            { name: 'score', label: 'Skor Performa Akhir (%)', type: 'Float', defaultValue: 100 },
            { name: 'status', label: 'Peringkat Supplier', type: 'Select', options: ['Preferred', 'Approved', 'On Hold', 'Rejected'] },
            { name: 'remarks', label: 'Catatan Evaluasi Quality & Delivery', type: 'Text' }
        ]
    },

    // ─── STOCK DOCTYPES ──────────────────────────────────────────────────────────
    'Stock Entry': {
        title: 'Stock Entry',
        module: 'Stock',
        namingSeriesPrefix: 'MAT-STE-',
        fields: [
            { name: 'purpose', label: 'Tujuan Pergerakan Stok', type: 'Select', options: ['Material Transfer', 'Material Issue', 'Material Receipt', 'Manufacture', 'Repack'] },
            { name: 'posting_date', label: 'Tanggal Posting', type: 'Date', required: true },
            { name: 'from_warehouse', label: 'Gudang Asal', type: 'Select', options: ['Gudang Utama', 'Gudang Transit', 'Gudang Bahan Baku'] },
            { name: 'to_warehouse', label: 'Gudang Tujuan', type: 'Select', options: ['Gudang Utama', 'Gudang Transit', 'Gudang Hasil Produksi'] },
            {
                name: 'items', label: 'Rincian Pergerakan Item', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty Pindah', type: 'Float', defaultValue: 1 },
                    { name: 'batch_no', label: 'Nomor Batch', type: 'Data' },
                    { name: 'serial_no', label: 'Nomor Seri (Serial No)', type: 'Data' }
                ]
            }
        ]
    },

    'Delivery Note': {
        title: 'Delivery Note (Surat Jalan)',
        module: 'Stock',
        namingSeriesPrefix: 'MAT-DN-',
        fields: [
            { name: 'customer_name', label: 'Customer', type: 'Data', required: true },
            { name: 'posting_date', label: 'Tanggal Pengiriman', type: 'Date', required: true },
            { name: 'warehouse', label: 'Gudang Pengirim', type: 'Select', options: ['Gudang Utama', 'Store Front POS'] },
            {
                name: 'items', label: 'Daftar Barang Dikirim', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty Kirim', type: 'Float', defaultValue: 1 },
                    { name: 'batch_no', label: 'Nomor Batch', type: 'Data' },
                    { name: 'serial_no', label: 'Nomor Seri', type: 'Data' }
                ]
            },
            { name: 'driver_name', label: 'Nama Sopir / Kurir', type: 'Data' },
            { name: 'vehicle_no', label: 'Plat Nomor Armada', type: 'Data' }
        ]
    },

    'Serial No': {
        title: 'Serial No',
        module: 'Stock',
        namingSeriesPrefix: 'SERIAL-',
        fields: [
            { name: 'serial_no', label: 'Nomor Seri Unik', type: 'Data', required: true },
            { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
            { name: 'warehouse', label: 'Posisi Gudang Saat Ini', type: 'Select', options: ['Gudang Utama', 'Gudang Transit', 'Pelanggan'] },
            { name: 'status', label: 'Status Nomor Seri', type: 'Select', options: ['Active', 'Expired', 'Delivered', 'Defective'] },
            { name: 'warranty_expiry_date', label: 'Batas Garansi Unit', type: 'Date' }
        ]
    },

    'Batch': {
        title: 'Batch',
        module: 'Stock',
        namingSeriesPrefix: 'BATCH-',
        fields: [
            { name: 'batch_id', label: 'Nomor Batch / Lot', type: 'Data', required: true },
            { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true },
            { name: 'manufacturing_date', label: 'Tanggal Produksi / Import', type: 'Date' },
            { name: 'expiry_date', label: 'Tanggal Kadaluarsa (Expiry)', type: 'Date', required: true },
            { name: 'qty', label: 'Jumlah Saldo Batch', type: 'Float', defaultValue: 0 }
        ]
    },

    'Warehouse': {
        title: 'Warehouse',
        module: 'Stock',
        namingSeriesPrefix: 'WH-',
        fields: [
            { name: 'warehouse_name', label: 'Nama Gudang / Bin', type: 'Data', required: true },
            { name: 'parent_warehouse', label: 'Induk Gudang (Group)', type: 'Select', options: ['All Warehouses', 'Gudang Utama'] },
            { name: 'is_group', label: 'Merupakan Induk Gudang (Folder)', type: 'Check' },
            { name: 'address', label: 'Alamat Lokasi Gudang', type: 'Text' }
        ]
    },

    // ─── ACCOUNTING DOCTYPES ─────────────────────────────────────────────────────
    'Journal Entry': {
        title: 'Journal Entry',
        module: 'Selling',
        namingSeriesPrefix: 'ACC-JV-',
        fields: [
            { name: 'voucher_type', label: 'Jenis Voucher Jurnal', type: 'Select', options: ['Journal Entry', 'Bank Entry', 'Cash Entry', 'Credit Note', 'Debit Note', 'Opening Entry'] },
            { name: 'posting_date', label: 'Tanggal Posting Jurnal', type: 'Date', required: true },
            { name: 'user_remark', label: 'Catatan Jurnal Memo', type: 'Text' },
            {
                name: 'items', label: 'Rincian Akun (Debit & Kredit)', type: 'Table', tableColumns: [
                    { name: 'account_name', label: 'Nama Akun COA', type: 'Data', required: true },
                    { name: 'debit', label: 'Debit (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'credit', label: 'Kredit (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'cost_center', label: 'Cost Center', type: 'Select', options: ['Main Cost Center', 'Operations', 'Sales', 'Admin'] }
                ]
            }
        ]
    },

    'Payment Entry': {
        title: 'Payment Entry',
        module: 'Selling',
        namingSeriesPrefix: 'ACC-PAY-',
        fields: [
            { name: 'payment_type', label: 'Tipe Pembayaran', type: 'Select', options: ['Pay', 'Receive', 'Internal Transfer'] },
            { name: 'party_type', label: 'Pihak Terkait (Party Type)', type: 'Select', options: ['Customer', 'Supplier', 'Employee'] },
            { name: 'party_name', label: 'Nama Pihak (Customer/Supplier)', type: 'Data', required: true },
            { name: 'posting_date', label: 'Tanggal Pembayaran', type: 'Date', required: true },
            { name: 'mode_of_payment', label: 'Metode Pembayaran', type: 'Select', options: ['Bank Transfer', 'Cash', 'Cheque', 'Credit Card'] },
            { name: 'paid_amount', label: 'Jumlah Dibayar / Diterima (Rp)', type: 'Currency', required: true },
            { name: 'reference_no', label: 'Nomor Referensi Transfer / Cek', type: 'Data' },
            { name: 'reference_date', label: 'Tanggal Bukti Transfer', type: 'Date' }
        ]
    },

    'Bank Account': {
        title: 'Bank Account',
        module: 'Selling',
        namingSeriesPrefix: 'BANK-ACC-',
        fields: [
            { name: 'account_name', label: 'Nama Rekening Bank', type: 'Data', required: true },
            { name: 'bank_name', label: 'Nama Bank', type: 'Select', options: ['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Bank Permata'] },
            { name: 'bank_account_no', label: 'Nomor Rekening', type: 'Data', required: true },
            { name: 'swift_code', label: 'SWIFT / BIC Code', type: 'Data' },
            { name: 'is_default', label: 'Rekening Bank Utama (Default)', type: 'Check', defaultValue: true }
        ]
    },

    'Cost Center': {
        title: 'Cost Center',
        module: 'Selling',
        namingSeriesPrefix: 'CC-',
        fields: [
            { name: 'cost_center_name', label: 'Nama Cost Center', type: 'Data', required: true },
            { name: 'cost_center_number', label: 'Kode / Nomor Cost Center', type: 'Data' },
            { name: 'parent_cost_center', label: 'Induk Cost Center', type: 'Select', options: ['All Cost Centers', 'Main Operations'] },
            { name: 'is_group', label: 'Merupakan Induk (Group)', type: 'Check' }
        ]
    },

    'Budget': {
        title: 'Budget',
        module: 'Selling',
        namingSeriesPrefix: 'BUDGET-',
        fields: [
            { name: 'cost_center_name', label: 'Cost Center Target', type: 'Data', required: true },
            { name: 'fiscal_year', label: 'Tahun Fiskal', type: 'Select', options: ['2026', '2025', '2027'] },
            { name: 'action_if_exceeded', label: 'Tindakan Jika Budget Terlampaui', type: 'Select', options: ['Warn', 'Stop', 'Ignore'] },
            {
                name: 'items', label: 'Rincian Budget Akun Beban', type: 'Table', tableColumns: [
                    { name: 'account_name', label: 'Nama Akun Beban', type: 'Data', required: true },
                    { name: 'budget_amount', label: 'Alokasi Budget (Rp)', type: 'Currency', defaultValue: 0 }
                ]
            }
        ]
    }
};

// Fallback Schema Generator for any of the 122 DocTypes not explicitly listed above
export function getDocTypeSchema(title: string, moduleName: 'Selling' | 'Buying' | 'Stock'): DocTypeSchema {
    if (DOCTYPE_SCHEMAS[title]) {
        return DOCTYPE_SCHEMAS[title];
    }

    return {
        title,
        module: moduleName,
        namingSeriesPrefix: `${title.toUpperCase().replace(/\s+/g, '-')}-`,
        fields: [
            { name: 'name', label: `Nama / Judul ${title}`, type: 'Data', required: true },
            { name: 'code', label: `Kode / ID ${title}`, type: 'Data' },
            { name: 'transaction_date', label: 'Tanggal Registrasi', type: 'Date', defaultValue: new Date().toISOString().split('T')[0] },
            { name: 'status', label: 'Status Entri', type: 'Select', options: ['Draft', 'Active', 'Submitted', 'Completed', 'Cancelled'] },
            {
                name: 'items', label: 'Rincian Item & Komponen', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang / Detail', type: 'Data', required: true },
                    { name: 'qty', label: 'Qty', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Harga (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Subtotal (Rp)', type: 'Currency', readOnly: true }
                ]
            },
            { name: 'remarks', label: 'Catatan & Keterangan Khusus', type: 'Text' }
        ]
    };
}
