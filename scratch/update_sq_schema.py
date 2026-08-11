import re

file_path = "/home/rus/projects/erp-system/web-admin/src/config/docTypeFormSchemas.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

sq_schema = """    'Supplier Quotation': {
        title: 'Supplier Quotation',
        module: 'Buying',
        namingSeriesPrefix: 'PUR-SQUOT-.YYYY.-',
        fields: [
            { name: 'naming_series', label: 'Series', type: 'Select', required: true, options: ['PUR-SQUOT-.YYYY.-'], defaultValue: 'PUR-SQUOT-.YYYY.-' },
            { name: 'supplier', label: 'Supplier', type: 'Select', required: true, options: ['CV Teknik Jaya Abadi', 'PT Pertamina Lubricants', 'PT Utama Jaya'], targetLink: 'Supplier' },
            { name: 'company', label: 'Company', type: 'Select', required: true, options: ['SJS Group', 'Main Operations'], defaultValue: 'SJS Group', targetLink: 'Company' },
            { name: 'status', label: 'Status', type: 'Select', required: true, options: ['Draft', 'Submitted', 'Cancelled'], defaultValue: 'Draft' },
            { name: 'transaction_date', label: 'Date', type: 'Date', required: true },
            { name: 'valid_till', label: 'Valid Till', type: 'Date' },
            { name: 'quotation_number', label: 'Quotation Number', type: 'Data' },

            // Currency & Price List
            { name: 'currency', label: 'Currency', type: 'Select', options: ['IDR', 'USD', 'EUR', 'SGD'], defaultValue: 'IDR' },
            { name: 'buying_price_list', label: 'Price List', type: 'Select', options: ['Standard Buying', 'Bulk Wholesale Buying'], defaultValue: 'Standard Buying' },

            // Items Child Table
            {
                name: 'items', label: 'Items', type: 'Table', tableColumns: [
                    { name: 'item_code', label: 'Item Code', type: 'Data', required: true, targetLink: 'Item' },
                    { name: 'qty', label: 'Quantity', type: 'Float', required: true, defaultValue: 1 },
                    { name: 'uom', label: 'UOM', type: 'Select', required: true, options: ['Liter', 'Pcs', 'Box', 'Kg', 'Unit'], targetLink: 'UOM' },
                    { name: 'rate', label: 'Rate (IDR)', type: 'Currency', required: true, defaultValue: 0 },
                    { name: 'amount', label: 'Amount (IDR)', type: 'Currency', readOnly: true },
                    { name: 'warehouse', label: 'Warehouse', type: 'Select', options: ['Gudang Utama - Jakarta', 'Workshop Operasional - Surabaya'], targetLink: 'Warehouse' }
                ]
            },

            // Taxes and Charges
            { name: 'tax_category', label: 'Tax Category', type: 'Select', options: ['Standard Tax', 'Zero Tax'] },
            { name: 'shipping_rule', label: 'Shipping Rule', type: 'Select', options: ['Standard Delivery', 'Express Franco'] },
            { name: 'incoterm', label: 'Incoterm', type: 'Select', options: ['EXW - Ex Works', 'FOB - Free on Board', 'CIF - Cost Insurance Freight'], defaultValue: 'EXW - Ex Works' },
            { name: 'taxes_and_charges_template', label: 'Purchase Taxes and Charges Template', type: 'Select', options: ['PPN Masukan 11%', 'PPh 23 2%', 'Non Pajak'], defaultValue: 'PPN Masukan 11%' },

            // Additional Discount
            { name: 'apply_discount_on', label: 'Apply Additional Discount On', type: 'Select', options: ['Grand Total', 'Net Total'], defaultValue: 'Grand Total' },
            { name: 'additional_discount_percentage', label: 'Additional Discount Percentage', type: 'Float', defaultValue: 0 },
            { name: 'discount_amount', label: 'Discount Amount (IDR)', type: 'Currency', defaultValue: 0 },

            // Totals & Terms
            { name: 'disable_rounded_total', label: 'Disable Rounded Total', type: 'Check', defaultValue: false },
            { name: 'terms', label: 'Terms and Conditions', type: 'Text' },
            { name: 'remarks', label: 'Catatan / Remarks', type: 'Text' }
        ]
    },"""

pos = content.find("    'Supplier Quotation': {")
if pos != -1:
    end_pos = content.find("    'Purchase Order': {", pos)
    new_content = content[:pos] + sq_schema + "\n\n" + content[end_pos:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Supplier Quotation Schema updated successfully in docTypeFormSchemas.ts!")
else:
    print("Could not find Supplier Quotation schema position in docTypeFormSchemas.ts")
