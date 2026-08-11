import subprocess

cmd = "PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public', 'inventory', 'commercial', 'rental') ORDER BY table_schema, table_name;\""

output = subprocess.check_output(cmd, shell=True, text=True)
lines = [l.strip() for l in output.strip().split('\n') if l.strip()]

db_tables = {}
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) == 2:
        db_tables[parts[1]] = parts[0]

print("=== CHECKING ASSETS & MAINTENANCE MODULE TABLES IN DB ===")
print(f"Total tables in DB: {len(db_tables)}")

expected_asset_doctypes = [
    ("Asset", "assets", []),
    ("Asset Category", "categories", []),
    ("Asset Location", "locations", []),
    ("Asset Depreciation Log", "asset_depreciation_logs", []),
    ("Asset Tax Renewal", "asset_tax_renewals", []),
    ("Asset Expense", "asset_expenses", []),
    ("Fuel Log", "fuel_logs", []),
    ("Maintenance Schedule", "maintenance_schedules", []),
    ("Maintenance Template", "maintenance_templates", []),
    ("Maintenance Team", "maintenance_teams", ["maintenance_team_members"]),
    ("Work Order", "maintenance_work_orders", ["maintenance_work_order_parts"]),
    ("Asset Audit Session", "audit_sessions", ["audit_records"]),
    ("Asset Lifecycle State", "asset_lifecycle_history", []),
]

missing_count = 0
for doc_label, main_tbl, child_tbls in expected_asset_doctypes:
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

print(f"\nTotal Missing Asset/Maintenance Tables: {missing_count}")
