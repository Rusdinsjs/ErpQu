import re

file_path = "/home/rus/projects/erp-system/web-admin/src/config/docTypeFormSchemas.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

asset_schemas_code = """
    // ─── ASSET DOCTYPES ────────────────────────────────────────────────────────
    'Asset Audit Session': {
        title: 'Asset Audit Session',
        module: 'Assets',
        namingSeriesPrefix: 'AUD-SESS-',
        fields: [
            { name: 'session_name', label: 'Nama Sesi Stock Opname / Audit Aset', type: 'Data', required: true, defaultValue: 'Audit Aset Q3 2026' },
            { name: 'audit_date', label: 'Tanggal Pelaksanaan Audit', type: 'Date', required: true },
            { name: 'location', label: 'Lokasi Audit', type: 'Select', options: ['Gudang Utama - Jakarta', 'Workshop Operasional - Surabaya', 'Head Office - Kuningan'], required: true, targetLink: 'Location' },
            { name: 'auditor_name', label: 'Nama Auditor / Tim Audit', type: 'Data', required: true, defaultValue: 'Budi Santoso (Internal Auditor)' },
            { name: 'status', label: 'Status Audit', type: 'Select', options: ['Planned (Direncanakan)', 'In Progress (Berjalan)', 'Completed (Selesai)'], required: true, defaultValue: 'In Progress (Berjalan)' },
            { name: 'remarks', label: 'Catatan & Temuan Audit', type: 'Text' },
        ]
    },

    'Asset Conversion': {
        title: 'Asset Conversion',
        module: 'Assets',
        namingSeriesPrefix: 'AST-CONV-.YYYY.-',
        fields: [
            { name: 'conversion_no', label: 'No. Dokumen Konversi Aset', type: 'Data', required: true, defaultValue: 'AST-CONV-2026-001' },
            { name: 'asset_name', label: 'Nama Aset', type: 'Data', required: true, targetLink: 'Asset' },
            { name: 'source_category', label: 'Kategori Asal', type: 'Select', options: ['Peralatan & Mesin', 'Kendaraan & Armada', 'Inventaris Kantor'], targetLink: 'Asset Category' },
            { name: 'target_category', label: 'Kategori Tujuan Konversi', type: 'Select', options: ['Alat Berat Operasional', 'Kendaraan Operasional', 'Infrastruktur IT'], targetLink: 'Asset Category' },
            { name: 'conversion_date', label: 'Tanggal Konversi', type: 'Date', required: true },
            { name: 'status', label: 'Status Konversi', type: 'Select', options: ['Draft', 'Approved', 'Rejected'], defaultValue: 'Approved' },
        ]
    },

    'Depreciation Method': {
        title: 'Depreciation Method',
        module: 'Assets',
        namingSeriesPrefix: 'DEPR-MTHD-',
        fields: [
            { name: 'method_name', label: 'Nama Metode Penyusutan', type: 'Data', required: true },
            { name: 'code', label: 'Kode Metode', type: 'Data', required: true },
            { name: 'depreciation_rate', label: 'Tarif Penyusutan Tahunan (%)', type: 'Float', required: true, defaultValue: 25 },
            { name: 'frequency_months', label: 'Frekuensi Penyusutan (Bulan)', type: 'Int', defaultValue: 12 },
            { name: 'description', label: 'Deskripsi Formula Penyusutan', type: 'Text' },
        ]
    },

    'Maintenance Type': {
        title: 'Maintenance Type',
        module: 'Assets',
        namingSeriesPrefix: 'MAINT-TYPE-',
        fields: [
            { name: 'code', label: 'Kode Tipe Perawatan (Code)', type: 'Data', required: true },
            { name: 'name', label: 'Nama Tipe Pemeliharaan / Perawatan', type: 'Data', required: true },
            { name: 'is_preventive', label: 'Tipe Preventif (Pencegahan Rutin)', type: 'Check', defaultValue: true },
            { name: 'description', label: 'Penjelasan Ruang Lingkup Perawatan', type: 'Text' },
        ]
    },
"""

pos = content.rfind("};")
if pos != -1:
    new_content = content[:pos] + asset_schemas_code + content[pos:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Asset schemas successfully appended to docTypeFormSchemas.ts!")
else:
    print("Could not find insertion position in docTypeFormSchemas.ts")
