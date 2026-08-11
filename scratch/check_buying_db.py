import subprocess

cmd = "PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'inventory', 'commercial') ORDER BY table_schema, table_name;\""

output = subprocess.check_output(cmd, shell=True, text=True)
lines = [l.strip() for l in output.strip().split('\n') if l.strip()]

db_tables = {}
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) == 2:
        db_tables[parts[1]] = parts[0]

print("=== CHECKING BUYING MODULE TABLES IN DB ===")
print(f"Total tables in DB: {len(db_tables)}")

expected_buying_doctypes = [
    ("Material Request", "material_requests", ["material_request_items"]),
    ("Purchase Order", "purchase_orders", ["purchase_order_items"]),
    ("Purchase Invoice", "purchase_bills", ["purchase_bill_items"]),
    ("Request for Quotation", "requests_for_quotation", ["rfq_items", "rfq_suppliers"]),
    ("Supplier Quotation", "supplier_quotations", ["supplier_quotation_items"]),
    ("Item Price", "item_prices", []),
    ("Price List", "price_lists", []),
    ("Product Bundle", "product_bundles", ["product_bundle_items"]),
    ("Promotional Scheme", "promotional_schemes", []),
    ("Pricing Rule", "pricing_rules", []),
    ("Buying Settings", "buying_settings", []),
    ("Purchase Taxes Template", "purchase_taxes_templates", []),
    ("Terms Template", "terms_and_conditions_templates", []),
    ("Supplier", "vendors", []),
    ("Supplier Group", "supplier_groups", []),
    ("Contact", "supplier_contacts", []),
    ("Address", "supplier_addresses", []),
    ("Supplier Scorecard", "supplier_scorecards", []),
    ("Scorecard Variable", "supplier_scorecard_variables", []),
    ("Scorecard Criteria", "supplier_scorecard_criteria", []),
    ("Scorecard Standing", "supplier_scorecard_standings", []),
    ("Subcontracting Order", "subcontracting_orders", []),
]

missing_count = 0
for doc_label, main_tbl, child_tbls in expected_buying_doctypes:
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

print(f"\nTotal Missing Buying Tables: {missing_count}")
