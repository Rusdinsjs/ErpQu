import re

file_path = "/home/rus/projects/erp-system/web-admin/src/config/docTypeFormSchemas.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

supplier_schema = """    'Supplier': {
        title: 'Supplier (Vendor)',
        module: 'Buying',
        namingSeriesPrefix: 'SUPP-',
        fields: [
            { name: 'supplier_name', label: 'Supplier Name', type: 'Data', required: true },
            { name: 'supplier_type', label: 'Supplier Type', type: 'Select', required: true, options: ['Company', 'Individual'], defaultValue: 'Company' },
            { name: 'supplier_group', label: 'Supplier Group', type: 'Select', required: true, options: ['All Supplier Groups', 'Distributor', 'Manufacturer', 'Services', 'Raw Material', 'Local', 'Hardware'], defaultValue: 'Distributor', targetLink: 'Supplier Group' },
            
            // Primary Contact Details
            { name: 'first_name', label: 'First Name', type: 'Data' },
            { name: 'email_id', label: 'Email Id', type: 'Data' },
            { name: 'last_name', label: 'Last Name', type: 'Data' },
            { name: 'mobile_number', label: 'Mobile Number', type: 'Data' },

            // Primary Address Details
            { name: 'address_line1', label: 'Address Line 1', type: 'Data' },
            { name: 'city', label: 'City', type: 'Data' },
            { name: 'address_line2', label: 'Address Line 2', type: 'Data' },
            { name: 'state', label: 'State/Province', type: 'Data' },
            { name: 'zip_code', label: 'ZIP Code', type: 'Data' },
            { name: 'country', label: 'Country', type: 'Select', options: ['Indonesia', 'Singapore', 'Japan', 'USA', 'China'], defaultValue: 'Indonesia' }
        ]
    },"""

pos = content.find("    'Supplier': {")
if pos != -1:
    end_pos = content.find("    'Material Request': {", pos)
    new_content = content[:pos] + supplier_schema + "\n\n" + content[end_pos:]
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Supplier Schema updated successfully in docTypeFormSchemas.ts!")
else:
    print("Could not find Supplier schema position in docTypeFormSchemas.ts")
