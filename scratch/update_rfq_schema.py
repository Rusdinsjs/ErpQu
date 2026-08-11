import re

file_path = "/home/rus/projects/erp-system/web-admin/src/config/docTypeFormSchemas.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

rfq_schema = """    'Request for Quotation': {
        title: 'Request for Quotation',
        module: 'Buying',
        namingSeriesPrefix: 'PUR-RFQ-.YYYY.-',
        fields: [
            { name: 'naming_series', label: 'Series', type: 'Select', required: true, options: ['PUR-RFQ-.YYYY.-'], defaultValue: 'PUR-RFQ-.YYYY.-' },
            { name: 'transaction_date', label: 'Date', type: 'Date', required: true },
            { name: 'company', label: 'Company', type: 'Select', required: true, options: ['SJS Group', 'Main Operations'], defaultValue: 'SJS Group', targetLink: 'Company' },
            { name: 'schedule_date', label: 'Required Date', type: 'Date' },
            { name: 'status', label: 'Status', type: 'Select', required: true, options: ['Draft', 'Submitted', 'Cancelled'], defaultValue: 'Draft' },
            {
                name: 'suppliers', label: 'Suppliers', type: 'Table', tableColumns: [
                    { name: 'supplier_name', label: 'Supplier', type: 'Data', required: true, targetLink: 'Supplier' },
                    { name: 'contact', label: 'Contact', type: 'Data' },
                    { name: 'email_id', label: 'Email ID', type: 'Data' },
                    { name: 'send_email', label: 'Send Email', type: 'Check', defaultValue: true }
                ]
            },
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_code', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'schedule_date', label: 'Required Date', type: 'Date', required: true },
                    { name: 'qty', label: 'Quantity', type: 'Float', required: true, defaultValue: 1 },
                    { name: 'uom', label: 'UOM', type: 'Select', required: true, options: ['Liter', 'Pcs', 'Box', 'Kg', 'Unit'], targetLink: 'UOM' },
                    { name: 'warehouse', label: 'Warehouse', type: 'Select', options: ['Gudang Utama - Jakarta', 'Workshop Operasional - Surabaya'], targetLink: 'Warehouse' }
                ]
            },
            { name: 'email_template', label: 'Email Template', type: 'Select', options: ['Standard RFQ Template', 'Urgent Inquiry Template'] },
            { name: 'send_attached_files', label: 'Send Attached Files', type: 'Check', defaultValue: true, description: 'If enabled, all files attached to this document will be attached to each email' },
            { name: 'send_document_print', label: 'Send Document Print', type: 'Check', defaultValue: false, description: 'If enabled, a print of this document will be attached to each email' },
            { name: 'subject', label: 'Subject', type: 'Data', required: true, defaultValue: 'Request for Quotation' },
            { name: 'message_for_supplier', label: 'Message for Supplier', type: 'Text', defaultValue: 'Mohon berikan penawaran harga terbaik untuk rincian barang/jasa terlampir.' },
            { name: 'terms', label: 'Terms and Conditions', type: 'Text' }
        ]
    },

    'Request for Quotation (RFQ)': {
        title: 'Request for Quotation (RFQ)',
        module: 'Buying',
        namingSeriesPrefix: 'PUR-RFQ-.YYYY.-',
        fields: [
            { name: 'naming_series', label: 'Series', type: 'Select', required: true, options: ['PUR-RFQ-.YYYY.-'], defaultValue: 'PUR-RFQ-.YYYY.-' },
            { name: 'transaction_date', label: 'Date', type: 'Date', required: true },
            { name: 'company', label: 'Company', type: 'Select', required: true, options: ['SJS Group', 'Main Operations'], defaultValue: 'SJS Group', targetLink: 'Company' },
            { name: 'schedule_date', label: 'Required Date', type: 'Date' },
            { name: 'status', label: 'Status', type: 'Select', required: true, options: ['Draft', 'Submitted', 'Cancelled'], defaultValue: 'Draft' },
            {
                name: 'suppliers', label: 'Suppliers', type: 'Table', tableColumns: [
                    { name: 'supplier_name', label: 'Supplier', type: 'Data', required: true, targetLink: 'Supplier' },
                    { name: 'contact', label: 'Contact', type: 'Data' },
                    { name: 'email_id', label: 'Email ID', type: 'Data' },
                    { name: 'send_email', label: 'Send Email', type: 'Check', defaultValue: true }
                ]
            },
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_code', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'schedule_date', label: 'Required Date', type: 'Date', required: true },
                    { name: 'qty', label: 'Quantity', type: 'Float', required: true, defaultValue: 1 },
                    { name: 'uom', label: 'UOM', type: 'Select', required: true, options: ['Liter', 'Pcs', 'Box', 'Kg', 'Unit'], targetLink: 'UOM' },
                    { name: 'warehouse', label: 'Warehouse', type: 'Select', options: ['Gudang Utama - Jakarta', 'Workshop Operasional - Surabaya'], targetLink: 'Warehouse' }
                ]
            },
            { name: 'email_template', label: 'Email Template', type: 'Select', options: ['Standard RFQ Template', 'Urgent Inquiry Template'] },
            { name: 'send_attached_files', label: 'Send Attached Files', type: 'Check', defaultValue: true, description: 'If enabled, all files attached to this document will be attached to each email' },
            { name: 'send_document_print', label: 'Send Document Print', type: 'Check', defaultValue: false, description: 'If enabled, a print of this document will be attached to each email' },
            { name: 'subject', label: 'Subject', type: 'Data', required: true, defaultValue: 'Request for Quotation' },
            { name: 'message_for_supplier', label: 'Message for Supplier', type: 'Text', defaultValue: 'Mohon berikan penawaran harga terbaik untuk rincian barang/jasa terlampir.' },
            { name: 'terms', label: 'Terms and Conditions', type: 'Text' }
        ]
    },"""

pos = content.find("    'Request for Quotation (RFQ)': {")
if pos != -1:
    end_pos = content.find("    'Supplier Quotation': {", pos)
    new_content = content[:pos] + rfq_schema + "\n\n" + content[end_pos:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("RFQ Schema updated successfully in docTypeFormSchemas.ts!")
else:
    print("Could not find RFQ schema position in docTypeFormSchemas.ts")
