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
            { name: 'customer_name', label: 'Customer Name', type: 'Data', required: true },
            { name: 'customer_group', label: 'Customer Group', type: 'Select', options: ['Commercial', 'Individual', 'Government', 'Non Profit'], targetLink: 'Customer Group' },
            { name: 'customer_type', label: 'Customer Type', type: 'Select', options: ['Company', 'Individual'], required: true, defaultValue: 'Company' },
            { name: 'territory', label: 'Territory', type: 'Select', options: ['Indonesia', 'Jakarta', 'Surabaya', 'Bandung', 'Overseas'], targetLink: 'Territory' },
            { name: 'alias', label: 'Alias', type: 'Data' },
            { name: 'billing_currency', label: 'Billing Currency', type: 'Select', options: ['IDR', 'USD', 'EUR', 'SGD'] },
            { name: 'company_bank_account', label: 'Company Bank Account', type: 'Select', options: ['BCA - 1234567890', 'Mandiri - 0987654321', 'BNI - 1122334455'], targetLink: 'Bank Account' },
            { name: 'price_list', label: 'Price List', type: 'Select', options: ['Standard Selling', 'Retail POS Price'], targetLink: 'Price List' },
            { name: 'payment_terms', label: 'Payment Terms Template', type: 'Select', options: ['Cash', 'Net 15', 'Net 30', 'Net 60'], targetLink: 'Payment Terms' },
            { name: 'tax_id', label: 'Tax ID / NPWP', type: 'Data' },
            { name: 'credit_limit', label: 'Credit Limit (Rp)', type: 'Currency', defaultValue: 0 },
            { name: 'sales_partner', label: 'Sales Partner', type: 'Data', targetLink: 'Sales Partner' },
            { name: 'sales_person', label: 'Sales Person', type: 'Data', targetLink: 'Sales Person' },
            { name: 'remarks', label: 'Catatan / Remarks', type: 'Text' },
        ]
    },

    'Quotation': {
        title: 'Quotation',
        module: 'Selling',
        namingSeriesPrefix: 'SAL-QTN-.YYYY.-',
        fields: [
            { name: 'naming_series', label: 'Series', type: 'Select', options: ['SAL-QTN-.YYYY.-'], required: true, defaultValue: 'SAL-QTN-.YYYY.-' },
            { name: 'transaction_date', label: 'Date', type: 'Date', required: true },
            { name: 'order_type', label: 'Order Type', type: 'Select', options: ['Sales', 'Maintenance', 'Shopping Cart'], required: true, defaultValue: 'Sales' },
            { name: 'quotation_to', label: 'Quotation To', type: 'Select', options: ['Customer', 'Lead'], required: true, defaultValue: 'Customer' },
            { name: 'valid_till', label: 'Valid Till', type: 'Date' },
            { name: 'company', label: 'Company', type: 'Select', options: ['SJS Group', 'Main Operations'], required: true, defaultValue: 'SJS Group' },
            { name: 'customer_name', label: 'Customer', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'currency', label: 'Currency', type: 'Select', options: ['IDR', 'USD', 'EUR', 'SGD'], defaultValue: 'IDR' },
            { name: 'price_list', label: 'Price List', type: 'Select', options: ['Standard Selling', 'Retail POS Price'], targetLink: 'Price List' },
            { name: 'tax_category', label: 'Tax Category', type: 'Select', options: ['Standard Tax', 'Zero Tax', 'Export'] },
            { name: 'shipping_rule', label: 'Shipping Rule', type: 'Select', options: ['Standard Delivery', 'Express Shipping'], targetLink: 'Shipping Rule' },
            { name: 'incoterm', label: 'Incoterm', type: 'Select', options: ['EXW - Ex Works', 'FOB - Free on Board', 'CIF - Cost Insurance Freight'] },
            { name: 'taxes_template', label: 'Sales Taxes and Charges Template', type: 'Select', options: ['PPN 11%', 'Non Pajak'], targetLink: 'Sales Taxes Template' },
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Quantity', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Rate (IDR)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Amount (IDR)', type: 'Currency', readOnly: true },
                ]
            },
            { name: 'terms', label: 'Terms and Conditions', type: 'Text' }
        ]
    },

    'Sales Order': {
        title: 'Sales Order',
        module: 'Selling',
        namingSeriesPrefix: 'SAL-ORD-.YYYY.-',
        fields: [
            { name: 'company', label: 'Company', type: 'Select', required: true, options: ['SJS Group', 'PT Utama Jaya'], targetLink: 'Company' },
            { name: 'order_type', label: 'Order Type', type: 'Select', required: true, options: ['Sales', 'Maintenance', 'Shopping Cart'] },
            { name: 'is_subcontracted', label: 'Is Subcontracted', type: 'Check' },
            { name: 'naming_series', label: 'Series', type: 'Select', required: true, options: ['SAL-ORD-.YYYY.-'] },
            { name: 'transaction_date', label: 'Date', type: 'Date', required: true },
            { name: 'customer_name', label: 'Customer', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'delivery_date', label: 'Delivery Date', type: 'Date' },
            { name: 'currency', label: 'Currency', type: 'Select', options: ['IDR', 'USD', 'EUR', 'SGD'], targetLink: 'Currency' },
            { name: 'price_list', label: 'Price List', type: 'Select', options: ['Standard Selling', 'Distributor Selling', 'Retail Selling'], targetLink: 'Price List' },
            { name: 'scan_barcode', label: 'Scan Barcode', type: 'Data' },
            { name: 'set_warehouse', label: 'Set Source Warehouse', type: 'Select', options: ['Gudang Utama - SJS', 'Gudang Transit - SJS', 'Gudang Retur - SJS'], targetLink: 'Warehouse' },
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_code', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'delivery_date', label: 'Delivery Date', type: 'Date' },
                    { name: 'qty', label: 'Quantity', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Rate (IDR)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Amount (IDR)', type: 'Currency', readOnly: true },
                ]
            },
            { name: 'tax_category', label: 'Tax Category', type: 'Select', options: ['In-State', 'Out-Of-State', 'Export'], targetLink: 'Tax Category' },
            { name: 'shipping_rule', label: 'Shipping Rule', type: 'Select', options: ['Free Shipping', 'Flat Rate Shipping'], targetLink: 'Shipping Rule' },
            { name: 'incoterm', label: 'Incoterm', type: 'Select', options: ['EXW', 'FOB', 'CIF', 'DDP'], targetLink: 'Incoterm' },
            { name: 'taxes_template', label: 'Sales Taxes and Charges Template', type: 'Select', options: ['PPN 11%', 'PPN 11% + PPH 23', 'No Tax'], targetLink: 'Sales Taxes and Charges Template' },
            { name: 'terms', label: 'Terms and Conditions', type: 'Text' }
        ]
    },

    'Sales Invoice': {
        title: 'Sales Invoice',
        module: 'Selling',
        namingSeriesPrefix: 'ACC-SINV-.YYYY.-',
        fields: [
            { name: 'company', label: 'Company', type: 'Select', required: true, options: ['SJS Group', 'PT Utama Jaya'], targetLink: 'Company' },
            { name: 'naming_series', label: 'Series', type: 'Select', required: true, options: ['ACC-SINV-.YYYY.-'] },
            { name: 'customer_name', label: 'Customer', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'posting_date', label: 'Posting Date', type: 'Date', required: true },
            { name: 'due_date', label: 'Payment Due Date', type: 'Date', required: true },
            { name: 'is_pos', label: 'Include Payment (POS)', type: 'Check' },
            { name: 'is_return', label: 'Is Return (Credit Note)', type: 'Check' },
            { name: 'is_debit_note', label: 'Is Rate Adjustment Entry (Debit Note)', type: 'Check' },
            { name: 'tax_withholding', label: 'Consider for Tax Withholding', type: 'Check' },
            { name: 'scan_barcode', label: 'Scan Barcode', type: 'Data' },
            { name: 'update_stock', label: 'Update Stock', type: 'Check' },
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_code', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Quantity', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Rate (IDR)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Amount (IDR)', type: 'Currency', readOnly: true },
                    { name: 'warehouse', label: 'Warehouse', type: 'Select', options: ['Gudang Utama - SJS', 'Gudang Transit - SJS'], targetLink: 'Warehouse' },
                ]
            },
            { name: 'tax_category', label: 'Tax Category', type: 'Select', options: ['In-State', 'Out-Of-State', 'Export'], targetLink: 'Tax Category' },
            { name: 'shipping_rule', label: 'Shipping Rule', type: 'Select', options: ['Free Shipping', 'Flat Rate Shipping'], targetLink: 'Shipping Rule' },
            { name: 'incoterm', label: 'Incoterm', type: 'Select', options: ['EXW', 'FOB', 'CIF', 'DDP'], targetLink: 'Incoterm' },
            { name: 'taxes_template', label: 'Sales Taxes and Charges Template', type: 'Select', options: ['PPN 11%', 'PPN 11% + PPH 23', 'No Tax'], targetLink: 'Sales Taxes and Charges Template' },
            { name: 'terms', label: 'Terms and Conditions', type: 'Text' }
        ]
    },

    'Blanket Order': {
        title: 'Blanket Order',
        module: 'Selling',
        namingSeriesPrefix: 'MFG-BLR-.YYYY.-',
        fields: [
            { name: 'naming_series', label: 'Series', type: 'Select', required: true, options: ['MFG-BLR-.YYYY.-'] },
            { name: 'order_no', label: 'Order No', type: 'Data' },
            { name: 'blanket_order_type', label: 'Order Type', type: 'Select', required: true, options: ['Selling', 'Purchasing'] },
            { name: 'from_date', label: 'From Date', type: 'Date', required: true },
            { name: 'to_date', label: 'To Date', type: 'Date', required: true },
            { name: 'company', label: 'Company', type: 'Select', required: true, options: ['SJS Group', 'PT Utama Jaya'], targetLink: 'Company' },
            { name: 'customer_name', label: 'Customer', type: 'Data', targetLink: 'Customer' },
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_code', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Quantity', type: 'Float', defaultValue: 0 },
                    { name: 'rate', label: 'Rate', type: 'Currency', defaultValue: 0 },
                    { name: 'ordered_qty', label: 'Ordered Quantity', type: 'Float', readOnly: true, defaultValue: 0 }
                ]
            },
            { name: 'terms_template', label: 'Terms', type: 'Select', options: ['Standard Terms', 'Payment Terms 30 Days'], targetLink: 'Terms and Conditions' },
            { name: 'terms', label: 'Terms and Conditions Details', type: 'Text' }
        ]
    },

    'Sales Partner': {
        title: 'Sales Partner',
        module: 'Selling',
        namingSeriesPrefix: 'PARTNER-',
        fields: [
            { name: 'partner_name', label: 'Sales Partner Name', type: 'Data', required: true },
            { name: 'commission_rate', label: 'Commission Rate', type: 'Float', required: true, defaultValue: 0 },
            { name: 'partner_type', label: 'Partner Type', type: 'Select', options: ['Reseller', 'Distributor', 'Commission Agent', 'Broker'], targetLink: 'Sales Partner Type' },
            { name: 'territory', label: 'Territory', type: 'Select', required: true, options: ['All Territories', 'Indonesia', 'Export'], targetLink: 'Territory' },
            {
                name: 'targets', label: 'Sales Partner Target', type: 'Table', tableColumns: [
                    { name: 'item_group', label: 'Item Group', type: 'Data', targetLink: 'Item Group' },
                    { name: 'fiscal_year', label: 'Fiscal Year', type: 'Select', required: true, options: ['2024', '2025', '2026'] },
                    { name: 'target_qty', label: 'Target Qty', type: 'Float', defaultValue: 0 },
                    { name: 'target_amount', label: 'Target Amount', type: 'Currency', defaultValue: 0 },
                    { name: 'target_distribution', label: 'Target Distribution', type: 'Select', required: true, options: ['Evenly', 'Quarterly'] }
                ]
            },
            { name: 'show_in_website', label: 'Show In Website', type: 'Check' },
            { name: 'referral_code', label: 'Referral Code', type: 'Data' }
        ]
    },

    'Sales Person': {
        title: 'Sales Person',
        module: 'Selling',
        namingSeriesPrefix: 'SP-',
        fields: [
            { name: 'sales_person_name', label: 'Sales Person Name', type: 'Data', required: true },
            { name: 'employee_link', label: 'Employee', type: 'Data', targetLink: 'Employee' },
            { name: 'enabled', label: 'Enabled', type: 'Check', defaultValue: true },
            { name: 'is_group', label: 'Is Group', type: 'Check', defaultValue: false },
            { name: 'parent_sales_person', label: 'Parent Sales Person', type: 'Data', targetLink: 'Sales Person' },
            { name: 'commission_rate', label: 'Commission Rate', type: 'Float', defaultValue: 0 },
            {
                name: 'targets', label: 'Sales Person Target', type: 'Table', tableColumns: [
                    { name: 'item_group', label: 'Item Group', type: 'Data', targetLink: 'Item Group' },
                    { name: 'fiscal_year', label: 'Fiscal Year', type: 'Select', required: true, options: ['2024', '2025', '2026'] },
                    { name: 'target_qty', label: 'Target Qty', type: 'Float', defaultValue: 0 },
                    { name: 'target_amount', label: 'Target Amount', type: 'Currency', defaultValue: 0 },
                    { name: 'target_distribution', label: 'Target Distribution', type: 'Select', required: true, options: ['Evenly', 'Quarterly'] }
                ]
            }
        ]
    },

    'POS Profile': {
        title: 'POS Profile',
        module: 'Selling',
        namingSeriesPrefix: 'POS-PROF-',
        fields: [
            { name: 'profile_name', label: 'Nama Profil Kasir', type: 'Data', required: true },
            { name: 'warehouse', label: 'Gudang Kasir Default', type: 'Select', options: ['Gudang Utama', 'Store Front POS'], targetLink: 'Warehouse' },
            { name: 'price_list', label: 'Price List Default', type: 'Select', options: ['Standard Selling', 'Retail POS Price'], targetLink: 'Price List' },
            { name: 'customer', label: 'Default Customer Kasir', type: 'Data', targetLink: 'Customer' },
            { name: 'allow_discount', label: 'Izinkan Diskon Manual di Kasir', type: 'Check', defaultValue: true },
            { name: 'update_stock', label: 'Otomatis Potong Stok Saat Transaksi', type: 'Check', defaultValue: true }
        ]
    },

    'POS Settings': {
        title: 'POS Settings',
        module: 'Selling',
        fields: [
            { name: 'default_customer', label: 'Default Customer POS', type: 'Data', targetLink: 'Customer' },
            { name: 'use_pos_in_offline', label: 'Aktifkan Mode Kasir Offline', type: 'Check', defaultValue: true },
            { name: 'allow_rate_change', label: 'Izinkan Kasir Merubah Harga', type: 'Check', defaultValue: false },
            { name: 'print_receipt_on_submit', label: 'Cetak Struk Otomatis Saat Transaksi', type: 'Check', defaultValue: true }
        ]
    },

    'POS Opening Entry': {
        title: 'POS Opening Entry',
        module: 'Selling',
        namingSeriesPrefix: 'POS-OPEN-',
        fields: [
            { name: 'period_start_date', label: 'Waktu Buka Shift Kasir', type: 'Date', required: true },
            { name: 'pos_profile', label: 'Profil Kasir', type: 'Select', options: ['Store Front POS', 'Kasir Utama'], targetLink: 'POS Profile' },
            { name: 'company', label: 'Perusahaan', type: 'Data', required: true },
            { name: 'user', label: 'Kasir / Cashier User', type: 'Data', required: true },
            { name: 'opening_cash', label: 'Modal Awal Kas (Kas Kecil Kasir)', type: 'Currency', defaultValue: 500000 }
        ]
    },

    'POS Closing Entry': {
        title: 'POS Closing Entry',
        module: 'Selling',
        namingSeriesPrefix: 'POS-CLOSE-',
        fields: [
            { name: 'period_end_date', label: 'Waktu Tutup Shift Kasir', type: 'Date', required: true },
            { name: 'pos_profile', label: 'Profil Kasir', type: 'Data', required: true, targetLink: 'POS Profile' },
            { name: 'pos_opening_entry', label: 'Link POS Opening Entry', type: 'Data', required: true, targetLink: 'POS Opening Entry' },
            { name: 'grand_total', label: 'Total Penjualan Shift (Rp)', type: 'Currency', readOnly: true },
            { name: 'total_cash_collected', label: 'Fisik Uang Tunai Dihitung (Rp)', type: 'Currency', required: true },
            { name: 'difference_amount', label: 'Selisih Kas (+/-)', type: 'Currency', readOnly: true }
        ]
    },

    'Loyalty Program': {
        title: 'Loyalty Program',
        module: 'Selling',
        namingSeriesPrefix: 'LOYALTY-',
        fields: [
            { name: 'loyalty_program_name', label: 'Nama Program Loyalitas', type: 'Data', required: true },
            { name: 'auto_opt_in', label: 'Otomatis Daftarkan Pelanggan Baru', type: 'Check', defaultValue: true },
            { name: 'from_date', label: 'Mulai Berlaku', type: 'Date', required: true },
            { name: 'to_date', label: 'Berakhir Berlaku', type: 'Date' },
            { name: 'conversion_factor', label: 'Faktor Nilai (1 Poin = Rp X)', type: 'Currency', defaultValue: 1000 }
        ]
    },

    'Loyalty Point Entry': {
        title: 'Loyalty Point Entry',
        module: 'Selling',
        namingSeriesPrefix: 'LPE-',
        fields: [
            { name: 'customer_name', label: 'Pelanggan', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'points_earned', label: 'Poin Diterima (+)', type: 'Int', defaultValue: 0 },
            { name: 'sales_invoice', label: 'Faktur Penjualan Terkait', type: 'Data', targetLink: 'Sales Invoice' },
            { name: 'expiry_date', label: 'Tanggal Expired Poin', type: 'Date' }
        ]
    },

    'Item Price': {
        title: 'Item Price',
        module: 'Selling',
        namingSeriesPrefix: 'IP-',
        fields: [
            { name: 'item_name', label: 'Barang / Item', type: 'Data', required: true, targetLink: 'Item' },
            { name: 'price_list', label: 'Price List', type: 'Select', options: ['Standard Selling', 'Retail POS Price'], targetLink: 'Price List' },
            { name: 'price_list_rate', label: 'Harga Jual (Rp)', type: 'Currency', required: true },
            { name: 'currency', label: 'Mata Uang', type: 'Select', options: ['IDR', 'USD'] }
        ]
    },

    'Price List': {
        title: 'Price List',
        module: 'Selling',
        fields: [
            { name: 'price_list_name', label: 'Nama Price List', type: 'Data', required: true },
            { name: 'currency', label: 'Mata Uang Default', type: 'Select', options: ['IDR', 'USD'] },
            { name: 'selling', label: 'Berlaku untuk Penjualan (Selling)', type: 'Check', defaultValue: true },
            { name: 'buying', label: 'Berlaku untuk Pembelian (Buying)', type: 'Check', defaultValue: false }
        ]
    },

    'Product Bundle': {
        title: 'Product Bundle',
        module: 'Selling',
        fields: [
            { name: 'new_item_code', label: 'Barang Utama Paket Bundling', type: 'Data', required: true, targetLink: 'Item' },
            {
                name: 'items', label: 'Komponen Isi Paket', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Komponen Item', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Qty Komponen', type: 'Float', defaultValue: 1 },
                    { name: 'uom', label: 'Satuan', type: 'Select', options: ['Pcs', 'Box', 'Set'] }
                ]
            }
        ]
    },

    'Promotional Scheme': {
        title: 'Promotional Scheme',
        module: 'Selling',
        fields: [
            { name: 'name', label: 'Nama Skema Promosi', type: 'Data', required: true },
            { name: 'apply_on', label: 'Terapkan Pada', type: 'Select', options: ['Item Code', 'Item Group', 'Brand', 'Transaction'] },
            { name: 'discount_percentage', label: 'Diskon Persen (%)', type: 'Float', defaultValue: 10 },
            { name: 'valid_from', label: 'Berlaku Mulai', type: 'Date', required: true },
            { name: 'valid_upto', label: 'Berlaku Sampai', type: 'Date' }
        ]
    },

    'Pricing Rule': {
        title: 'Pricing Rule',
        module: 'Selling',
        fields: [
            { name: 'title', label: 'Judul Pricing Rule', type: 'Data', required: true },
            { name: 'apply_on', label: 'Terapkan Pada', type: 'Select', options: ['Item Code', 'Item Group', 'Brand'] },
            { name: 'discount_percentage', label: 'Diskon (%)', type: 'Float', defaultValue: 5 },
            { name: 'margin_type', label: 'Tipe Marjin Tambahan', type: 'Select', options: ['Percentage', 'Amount'] }
        ]
    },

    'Shipping Rule': {
        title: 'Shipping Rule',
        module: 'Selling',
        fields: [
            { name: 'title', label: 'Nama Aturan Ongkir', type: 'Data', required: true },
            { name: 'calculate_based_on', label: 'Hitung Berdasarkan', type: 'Select', options: ['Fixed Amount', 'Net Weight', 'Net Amount'] },
            { name: 'shipping_amount', label: 'Biaya Ongkir (Rp)', type: 'Currency', defaultValue: 25000 }
        ]
    },

    'Coupon Code': {
        title: 'Coupon Code',
        module: 'Selling',
        fields: [
            { name: 'coupon_name', label: 'Kode Kupon Promo', type: 'Data', required: true },
            { name: 'coupon_code', label: 'String Kode Kupon', type: 'Data', required: true },
            { name: 'pricing_rule', label: 'Pricing Rule Terkait', type: 'Data', targetLink: 'Pricing Rule' },
            { name: 'valid_upto', label: 'Berlaku Hingga', type: 'Date' }
        ]
    },

    'Terms & Conditions Template': {
        title: 'Terms & Conditions Template',
        module: 'Selling',
        fields: [
            { name: 'title', label: 'Judul Template Syarat & Ketentuan', type: 'Data', required: true },
            { name: 'terms', label: 'Teks Syarat & Ketentuan Legal', type: 'Text', required: true }
        ]
    },

    'Sales Taxes Template': {
        title: 'Sales Taxes Template',
        module: 'Selling',
        fields: [
            { name: 'title', label: 'Nama Template Pajak Penjualan', type: 'Data', required: true },
            { name: 'tax_rate', label: 'Tarif PPN (%)', type: 'Float', defaultValue: 11 },
            { name: 'account_head', label: 'Akun COA PPN Keluaran', type: 'Data' }
        ]
    },

    'UTM Source': {
        title: 'UTM Source',
        module: 'Selling',
        fields: [
            { name: 'name', label: 'Nama Sumber UTM Marketing', type: 'Data', required: true },
            { name: 'description', label: 'Keterangan Kampanye Ads', type: 'Text' }
        ]
    },

    'Customer Group': {
        title: 'Customer Group',
        module: 'Selling',
        fields: [
            { name: 'customer_group_name', label: 'Nama Kelompok Pelanggan', type: 'Data', required: true },
            { name: 'parent_customer_group', label: 'Induk Kelompok', type: 'Select', options: ['All Customer Groups', 'Commercial', 'Individual'] },
            { name: 'is_group', label: 'Merupakan Induk (Folder Group)', type: 'Check' }
        ]
    },

    'Contact': {
        title: 'Contact',
        module: 'Selling',
        fields: [
            { name: 'first_name', label: 'Nama Depan', type: 'Data', required: true },
            { name: 'last_name', label: 'Nama Belakang', type: 'Data' },
            { name: 'email_id', label: 'Alamat Email', type: 'Data' },
            { name: 'phone', label: 'Nomor Telepon / HP', type: 'Data' },
            { name: 'links', label: 'Terkait Ke Customer / Supplier', type: 'Data', targetLink: 'Customer' }
        ]
    },

    'Address': {
        title: 'Address',
        module: 'Selling',
        fields: [
            { name: 'address_title', label: 'Judul Alamat', type: 'Data', required: true },
            { name: 'address_line1', label: 'Alamat Jalan Line 1', type: 'Data', required: true },
            { name: 'city', label: 'Kota / Kabupaten', type: 'Data', required: true },
            { name: 'country', label: 'Negara', type: 'Select', options: ['Indonesia', 'Singapore', 'Malaysia'] }
        ]
    },

    'Territory': {
        title: 'Territory',
        module: 'Selling',
        fields: [
            { name: 'territory_name', label: 'Nama Wilayah Penjualan', type: 'Data', required: true },
            { name: 'parent_territory', label: 'Induk Wilayah', type: 'Select', options: ['All Territories', 'Indonesia', 'Overseas'] }
        ]
    },

    'Campaign': {
        title: 'Campaign',
        module: 'Selling',
        fields: [
            { name: 'campaign_name', label: 'Nama Kampanye Marketing', type: 'Data', required: true },
            { name: 'target_amount', label: 'Target Pendapatan Kampanye (Rp)', type: 'Currency', defaultValue: 100000000 },
            { name: 'description', label: 'Deskripsi Strategi Kampanye', type: 'Text' }
        ]
    },

    // ─── BUYING DOCTYPES ─────────────────────────────────────────────────────────
    'Supplier': {
        title: 'Supplier (Vendor)',
        module: 'Buying',
        namingSeriesPrefix: 'SUPP-',
        fields: [
            { name: 'supplier_name', label: 'Nama Supplier / Vendor', type: 'Data', required: true },
            { name: 'supplier_group', label: 'Kelompok Supplier', type: 'Select', options: ['Raw Material', 'Services', 'Equipment', 'Distributor'], targetLink: 'Supplier Group' },
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
        namingSeriesPrefix: 'MAT-MR-.YYYY.-',
        fields: [
            { name: 'naming_series', label: 'Series', type: 'Select', required: true, options: ['MAT-MR-.YYYY.-'] },
            { name: 'transaction_date', label: 'Transaction Date', type: 'Date', required: true },
            { name: 'material_request_type', label: 'Purpose', type: 'Select', required: true, options: ['Purchase', 'Material Transfer', 'Material Issue', 'Manufacture', 'Customer Provided'] },
            { name: 'schedule_date', label: 'Required By', type: 'Date' },
            { name: 'company', label: 'Company', type: 'Select', required: true, options: ['SJS Group', 'PT Utama Jaya'], targetLink: 'Company' },
            { name: 'buying_price_list', label: 'Price List', type: 'Select', options: ['Standard Buying'], targetLink: 'Price List' },
            { name: 'scan_barcode', label: 'Scan Barcode', type: 'Data' },
            { name: 'set_warehouse', label: 'Set Warehouse', type: 'Select', options: ['Gudang Utama - SJS', 'Gudang Transit - SJS'], targetLink: 'Warehouse' },
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_code', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'schedule_date', label: 'Required By', type: 'Date', required: true },
                    { name: 'qty', label: 'Quantity', type: 'Float', defaultValue: 0 },
                    { name: 'warehouse', label: 'Warehouse', type: 'Select', options: ['Gudang Utama - SJS', 'Gudang Transit - SJS'], targetLink: 'Warehouse' },
                    { name: 'uom', label: 'UOM', type: 'Select', required: true, options: ['Pcs', 'Box', 'Kg', 'Unit'], targetLink: 'UOM' }
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
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Qty Diberikan Quote', type: 'Float', defaultValue: 1 }
                ]
            }
        ]
    },

    'Supplier Quotation': {
        title: 'Supplier Quotation',
        module: 'Buying',
        namingSeriesPrefix: 'SQ-',
        fields: [
            { name: 'supplier_name', label: 'Nama Supplier', type: 'Data', required: true, targetLink: 'Supplier' },
            { name: 'transaction_date', label: 'Tanggal Penawaran Supplier', type: 'Date', required: true },
            { name: 'valid_till', label: 'Berlaku Hingga', type: 'Date' },
            {
                name: 'items', label: 'Rincian Penawaran Harga', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Qty Ditawarkan', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Harga Satuan (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Jumlah (Rp)', type: 'Currency', readOnly: true }
                ]
            }
        ]
    },

    'Purchase Order': {
        title: 'Purchase Order',
        module: 'Buying',
        namingSeriesPrefix: 'PO-',
        fields: [
            { name: 'supplier_name', label: 'Nama Supplier', type: 'Data', required: true, targetLink: 'Supplier' },
            { name: 'transaction_date', label: 'Tanggal PO', type: 'Date', required: true },
            { name: 'schedule_date', label: 'Target Kedatangan', type: 'Date' },
            {
                name: 'items', label: 'Daftar Item Purchase Order', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang / Komponen', type: 'Data', required: true, targetLink: 'Item' },
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
            { name: 'supplier_name', label: 'Nama Supplier', type: 'Data', required: true, targetLink: 'Supplier' },
            { name: 'evaluation_date', label: 'Tanggal Evaluasi', type: 'Date', required: true },
            { name: 'score', label: 'Skor Performa Akhir (%)', type: 'Float', defaultValue: 100 },
            { name: 'status', label: 'Peringkat Supplier', type: 'Select', options: ['Preferred', 'Approved', 'On Hold', 'Rejected'] },
            { name: 'remarks', label: 'Catatan Evaluasi Quality & Delivery', type: 'Text' }
        ]
    },

    'Scorecard Variable': {
        title: 'Scorecard Variable',
        module: 'Buying',
        fields: [
            { name: 'variable_name', label: 'Nama Variabel Evaluasi', type: 'Data', required: true },
            { name: 'param_name', label: 'Parameter Kode', type: 'Data', required: true },
            { name: 'path', label: 'Formula Evaluasi', type: 'Data' }
        ]
    },

    'Scorecard Criteria': {
        title: 'Scorecard Criteria',
        module: 'Buying',
        fields: [
            { name: 'criteria_name', label: 'Nama Kriteria Evaluasi', type: 'Data', required: true },
            { name: 'weight', label: 'Bobot Persentase (%)', type: 'Float', defaultValue: 25 },
            { name: 'max_score', label: 'Skor Maksimal', type: 'Float', defaultValue: 100 }
        ]
    },

    'Scorecard Standing': {
        title: 'Scorecard Standing',
        module: 'Buying',
        fields: [
            { name: 'standing_name', label: 'Nama Peringkat Vendor', type: 'Data', required: true },
            { name: 'min_grade', label: 'Skor Minimal (%)', type: 'Float', defaultValue: 80 },
            { name: 'max_grade', label: 'Skor Maksimal (%)', type: 'Float', defaultValue: 100 }
        ]
    },

    'Buying Settings': {
        title: 'Buying Settings',
        module: 'Buying',
        fields: [
            { name: 'supp_master_name', label: 'Penamaan Supplier Master', type: 'Select', options: ['Supplier Name', 'Naming Series'] },
            { name: 'po_required', label: 'Wajib Ada PO Sebelum Buat Tagihan', type: 'Check', defaultValue: true },
            { name: 'pr_required', label: 'Wajib Penerimaan Barang (GRN) Sebelum Invoice', type: 'Check', defaultValue: true }
        ]
    },

    'Purchase Taxes Template': {
        title: 'Purchase Taxes Template',
        module: 'Buying',
        fields: [
            { name: 'title', label: 'Nama Template Pajak Pembelian', type: 'Data', required: true },
            { name: 'tax_rate', label: 'Tarif PPH / PPN (%)', type: 'Float', defaultValue: 2 },
            { name: 'account_head', label: 'Akun COA Pajak Masukan', type: 'Data' }
        ]
    },

    'Supplier Group': {
        title: 'Supplier Group',
        module: 'Buying',
        fields: [
            { name: 'supplier_group_name', label: 'Nama Kategori Supplier', type: 'Data', required: true },
            { name: 'parent_supplier_group', label: 'Induk Kategori', type: 'Select', options: ['All Supplier Groups', 'Raw Material', 'Services'] }
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
            { name: 'from_warehouse', label: 'Gudang Asal', type: 'Select', options: ['Gudang Utama', 'Gudang Transit', 'Gudang Bahan Baku'], targetLink: 'Warehouse' },
            { name: 'to_warehouse', label: 'Gudang Tujuan', type: 'Select', options: ['Gudang Utama', 'Gudang Transit', 'Gudang Hasil Produksi'], targetLink: 'Warehouse' },
            {
                name: 'items', label: 'Rincian Pergerakan Item', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Qty Pindah', type: 'Float', defaultValue: 1 },
                    { name: 'batch_no', label: 'Nomor Batch', type: 'Data', targetLink: 'Batch' },
                    { name: 'serial_no', label: 'Nomor Seri (Serial No)', type: 'Data', targetLink: 'Serial No' }
                ]
            }
        ]
    },

    'Delivery Note': {
        title: 'Delivery Note (Surat Jalan)',
        module: 'Stock',
        namingSeriesPrefix: 'MAT-DN-',
        fields: [
            { name: 'customer_name', label: 'Customer', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'posting_date', label: 'Tanggal Pengiriman', type: 'Date', required: true },
            { name: 'warehouse', label: 'Gudang Pengirim', type: 'Select', options: ['Gudang Utama', 'Store Front POS'], targetLink: 'Warehouse' },
            {
                name: 'items', label: 'Daftar Barang Dikirim', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Qty Kirim', type: 'Float', defaultValue: 1 },
                    { name: 'batch_no', label: 'Nomor Batch', type: 'Data', targetLink: 'Batch' },
                    { name: 'serial_no', label: 'Nomor Seri', type: 'Data', targetLink: 'Serial No' }
                ]
            },
            { name: 'driver_name', label: 'Nama Sopir / Kurir', type: 'Data' },
            { name: 'vehicle_no', label: 'Plat Nomor Armada', type: 'Data' }
        ]
    },

    'Pick List': {
        title: 'Pick List',
        module: 'Stock',
        namingSeriesPrefix: 'PICK-',
        fields: [
            { name: 'purpose', label: 'Tujuan Pengambilan', type: 'Select', options: ['Delivery', 'Material Transfer'] },
            { name: 'warehouse', label: 'Gudang Pengambilan', type: 'Select', options: ['Gudang Utama', 'Gudang Transit'], targetLink: 'Warehouse' },
            {
                name: 'locations', label: 'Lokasi Rak & Qty Ambil', type: 'Table', tableColumns: [
                    { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'picked_qty', label: 'Qty Diambil', type: 'Float', defaultValue: 1 },
                    { name: 'stock_reserved_qty', label: 'Qty Reservasi', type: 'Float', readOnly: true }
                ]
            }
        ]
    },

    'Landed Cost Voucher': {
        title: 'Landed Cost Voucher',
        module: 'Stock',
        namingSeriesPrefix: 'LCV-',
        fields: [
            { name: 'posting_date', label: 'Tanggal Alokasi Biaya', type: 'Date', required: true },
            { name: 'distribute_charges_based_on', label: 'Distribusi Biaya Berdasarkan', type: 'Select', options: ['Qty', 'Amount', 'Distribute Manually'] },
            {
                name: 'taxes', label: 'Rincian Biaya Pengiriman & Impor', type: 'Table', tableColumns: [
                    { name: 'expense_account', label: 'Akun Beban Pengiriman', type: 'Data', required: true },
                    { name: 'amount', label: 'Nilai Biaya (Rp)', type: 'Currency', defaultValue: 0 }
                ]
            }
        ]
    },

    'Serial No': {
        title: 'Serial No',
        module: 'Stock',
        namingSeriesPrefix: 'SERIAL-',
        fields: [
            { name: 'serial_no', label: 'Nomor Seri Unik', type: 'Data', required: true },
            { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true, targetLink: 'Item' },
            { name: 'warehouse', label: 'Posisi Gudang Saat Ini', type: 'Select', options: ['Gudang Utama', 'Gudang Transit', 'Pelanggan'], targetLink: 'Warehouse' },
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
            { name: 'item_name', label: 'Nama Barang', type: 'Data', required: true, targetLink: 'Item' },
            { name: 'manufacturing_date', label: 'Tanggal Produksi / Import', type: 'Date' },
            { name: 'expiry_date', label: 'Tanggal Kadaluarsa (Expiry)', type: 'Date', required: true },
            { name: 'qty', label: 'Jumlah Saldo Batch', type: 'Float', defaultValue: 0 }
        ]
    },

    'Installation Note': {
        title: 'Installation Note',
        module: 'Stock',
        namingSeriesPrefix: 'INST-',
        fields: [
            { name: 'customer_name', label: 'Nama Pelanggan', type: 'Data', required: true, targetLink: 'Customer' },
            { name: 'inst_date', label: 'Tanggal Pemasangan', type: 'Date', required: true },
            { name: 'technician', label: 'Teknisi Penanggung Jawab', type: 'Data' },
            { name: 'remarks', label: 'Hasil Uji Instalasi & Catatan', type: 'Text' }
        ]
    },

    'Item Alternative': {
        title: 'Item Alternative',
        module: 'Stock',
        fields: [
            { name: 'item_code', label: 'Barang Utama', type: 'Data', required: true, targetLink: 'Item' },
            { name: 'alternative_item_code', label: 'Barang Substitusi (Alternatif)', type: 'Data', required: true, targetLink: 'Item' },
            { name: 'two_way', label: 'Berlaku 2 Arah (Mutual Substitution)', type: 'Check', defaultValue: true }
        ]
    },

    'Item Manufacturer': {
        title: 'Item Manufacturer',
        module: 'Stock',
        fields: [
            { name: 'item_code', label: 'Barang Internal', type: 'Data', required: true, targetLink: 'Item' },
            { name: 'manufacturer', label: 'Pabrikan / Prinsipal', type: 'Data', required: true, targetLink: 'Manufacturer' },
            { name: 'manufacturer_part_no', label: 'Part Number Pabrikan (OEM)', type: 'Data', required: true }
        ]
    },

    'Manufacturer': {
        title: 'Manufacturer',
        module: 'Stock',
        fields: [
            { name: 'short_name', label: 'Nama Pabrikan / OEM', type: 'Data', required: true },
            { name: 'country', label: 'Negara Produsen', type: 'Select', options: ['Japan', 'Germany', 'USA', 'China', 'Indonesia'] }
        ]
    },

    'Brand': {
        title: 'Brand',
        module: 'Stock',
        fields: [
            { name: 'brand_name', label: 'Nama Merek / Brand', type: 'Data', required: true },
            { name: 'description', label: 'Keterangan Merek', type: 'Text' }
        ]
    },

    'Item Attribute': {
        title: 'Item Attribute',
        module: 'Stock',
        fields: [
            { name: 'attribute_name', label: 'Nama Atribut Varian', type: 'Data', required: true },
            { name: 'attribute_values', label: 'Nilai-Nilai Varian (Pisahkan koma)', type: 'Text', description: 'Contoh: Merah, Biru, Hijau, XL, L, M' }
        ]
    },

    'Unit of Measure (UOM)': {
        title: 'Unit of Measure (UOM)',
        module: 'Stock',
        fields: [
            { name: 'uom_name', label: 'Nama Satuan Ukur', type: 'Data', required: true },
            { name: 'must_be_whole_number', label: 'Wajib Angka Bulat (Tidak Boleh Desimal)', type: 'Check', defaultValue: true }
        ]
    },

    'UOM Conversion Factor': {
        title: 'UOM Conversion Factor',
        module: 'Stock',
        fields: [
            { name: 'from_uom', label: 'Dari Satuan (Asal)', type: 'Data', required: true, targetLink: 'Unit of Measure (UOM)' },
            { name: 'to_uom', label: 'Ke Satuan (Tujuan)', type: 'Data', required: true, targetLink: 'Unit of Measure (UOM)' },
            { name: 'value', label: 'Faktor Pengali Konversi', type: 'Float', defaultValue: 1 }
        ]
    },

    'Item Tax Template': {
        title: 'Item Tax Template',
        module: 'Stock',
        fields: [
            { name: 'title', label: 'Nama Template Pajak Barang', type: 'Data', required: true },
            { name: 'tax_rate', label: 'Tarif Pajak (%)', type: 'Float', defaultValue: 11 }
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

    'Stock Settings': {
        title: 'Stock Settings',
        module: 'Stock',
        fields: [
            { name: 'valuation_method', label: 'Metode Valuasi Persediaan Standard', type: 'Select', options: ['FIFO', 'Moving Average'] },
            { name: 'auto_insert_price_list_rate_if_missing', label: 'Otomatis Update Master Harga Jual', type: 'Check', defaultValue: true },
            { name: 'allow_negative_stock', label: 'Izinkan Stok Minus Saat Transaksi', type: 'Check', defaultValue: false },
            { name: 'clean_description_html', label: 'Bersihkan Format HTML Pada Deskripsi Barang', type: 'Check', defaultValue: true }
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
                    { name: 'item_name', label: 'Nama Barang / Detail', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Qty', type: 'Float', defaultValue: 1 },
                    { name: 'rate', label: 'Harga (Rp)', type: 'Currency', defaultValue: 0 },
                    { name: 'amount', label: 'Subtotal (Rp)', type: 'Currency', readOnly: true }
                ]
            },
            { name: 'remarks', label: 'Catatan & Keterangan Khusus', type: 'Text' }
        ]
    }
}
