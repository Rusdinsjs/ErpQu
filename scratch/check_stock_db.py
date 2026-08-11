import subprocess

cmd = "PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'inventory', 'stock') ORDER BY table_schema, table_name;\""

output = subprocess.check_output(cmd, shell=True, text=True)
lines = [l.strip() for l in output.strip().split('\n') if l.strip()]

db_tables = {}
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) == 2:
        db_tables[parts[1]] = parts[0]

print("=== CHECKING STOCK MODULE TABLES IN DB ===")
print(f"Total tables in DB (public/inventory/stock): {len(db_tables)}")

expected_doctypes = [
    # Stock Transactions
    ("Stock Entry", "stock_entries", ["stock_entry_items"]),
    ("Delivery Note", "delivery_notes", ["delivery_note_items"]),
    ("Purchase Receipt", "purchase_receipts", ["purchase_receipt_items"]),
    ("Material Request", "material_requests", ["material_request_items"]),
    ("Pick List", "pick_lists", ["pick_list_items"]),
    ("Delivery Trip", "delivery_trips", ["delivery_trip_stops"]),
    ("Stock Reconciliation", "stock_reconciliations", ["stock_reconciliation_items"]),
    ("Landed Cost Voucher", "landed_cost_vouchers", ["landed_cost_items"]),
    
    # Items & Pricing
    ("Item", "inventory_items", []),
    ("Item Group", "inventory_categories", []),
    ("Product Bundle", "product_bundles", ["product_bundle_items"]),
    ("Item Alternative", "item_alternatives", []),
    ("Item Manufacturer", "item_manufacturers", []),
    ("Manufacturer", "manufacturers", []),
    
    # Serial No and Batch
    ("Serial No", "serial_numbers", []),
    ("Batch", "batches", []),
    ("Installation Note", "installation_notes", []),
    
    # Settings & Setup
    ("Stock Settings", "stock_settings", []),
    ("Warehouse", "warehouses", []),
    ("Brand", "brands", []),
    ("Item Attribute", "item_attributes", []),
    ("UOM", "uoms", []),
    ("UOM Conversion Factor", "uom_conversion_factors", []),
    ("Item Tax Template", "item_tax_templates", []),

    # Reports / Ledger
    ("Stock Ledger", "stock_ledger_entries", []),
    ("Stock Balance / Warehouse Bins", "warehouse_bins", []),
]

print("\n--- DOCTYPE TABLE MAPPING STATUS ---")
missing_count = 0
for doc_label, main_tbl, child_tbls in expected_doctypes:
    exists = main_tbl in db_tables
    if not exists:
        missing_count += 1
    status = f"EXISTS in schema '{db_tables[main_tbl]}'" if exists else "MISSING"
    print(f"[{'OK' if exists else 'MISSING'}] {doc_label} -> table: {main_tbl} ({status})")
    for child_tbl in child_tbls:
        c_exists = child_tbl in db_tables
        if not c_exists:
            missing_count += 1
        c_status = f"EXISTS in schema '{db_tables[child_tbl]}'" if c_exists else "MISSING"
        print(f"     ↳ child table: {child_tbl} ({c_status})")

print(f"\nTotal Missing Tables: {missing_count}")
