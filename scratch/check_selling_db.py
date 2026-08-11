import subprocess

cmd = "PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'commercial', 'inventory') ORDER BY table_schema, table_name;\""

output = subprocess.check_output(cmd, shell=True, text=True)
lines = [l.strip() for l in output.strip().split('\n') if l.strip()]

db_tables = {}
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) == 2:
        db_tables[parts[1]] = parts[0]

print("=== CHECKING SELLING MODULE TABLES IN DB ===")
print(f"Total tables in DB: {len(db_tables)}")

expected_selling_doctypes = [
    ("Customer", "clients", []),
    ("Quotation", "sales_quotes", ["sales_quote_items"]),
    ("Sales Order", "sales_orders", ["sales_order_items"]),
    ("Sales Invoice", "sales_invoices", ["sales_invoice_items"]),
    ("Blanket Order", "blanket_orders", []),
    ("Sales Partner", "sales_partners", []),
    ("Sales Person", "sales_persons", []),
    ("POS Profile", "pos_profiles", []),
    ("POS Settings", "pos_settings", []),
    ("POS Opening Entry", "pos_opening_entries", []),
    ("POS Closing Entry", "pos_closing_entries", []),
    ("Loyalty Program", "loyalty_programs", []),
    ("Loyalty Point Entry", "loyalty_point_entries", []),
    ("Item Price", "item_prices", []),
    ("Price List", "price_lists", []),
    ("Product Bundle", "product_bundles", ["product_bundle_items"]),
    ("Promotional Scheme", "promotional_schemes", []),
    ("Pricing Rule", "pricing_rules", []),
    ("Shipping Rule", "shipping_rules", []),
    ("Coupon Code", "coupon_codes", []),
    ("Terms & Conditions", "terms_and_conditions_templates", []),
    ("Sales Tax Template", "sales_taxes_templates", []),
    ("UTM Source", "utm_sources", []),
    ("Customer Group", "customer_groups", []),
    ("Contact", "supplier_contacts", []),
    ("Address", "supplier_addresses", []),
    ("Territory", "territories", []),
    ("Campaign", "marketing_campaigns", []),
    ("Selling Settings", "selling_settings", []),
]

missing_count = 0
for doc_label, main_tbl, child_tbls in expected_selling_doctypes:
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

print(f"\nTotal Missing Selling Tables: {missing_count}")
