import subprocess

finance_tables = [
    "chart_of_accounts",
    "journal_entries",
    "journal_entry_accounts",
    "payment_entries",
    "bank_accounts",
    "bank_transactions",
    "bank_clearances",
    "cost_centers",
    "accounting_dimensions",
    "budgets",
    "sales_tax_templates",
    "purchase_tax_templates",
    "tax_categories",
    "tax_rules",
    "credit_notes",
    "debit_notes",
    "dunnings",
    "general_ledger_entries",
    "cashier_closings"
]

sql = "SELECT table_name FROM information_schema.tables WHERE table_schema IN ('public', 'finance');"
cmd = f"PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"{sql}\""

try:
    out = subprocess.check_output(cmd, shell=True, text=True)
    existing = [t.strip() for t in out.splitlines() if t.strip()]
    print("=== FINANCE & ACCOUNTING DB TABLES CHECK ===")
    missing = []
    for tbl in finance_tables:
        found = tbl in existing or any(tbl in t for t in existing)
        status = "EXISTS" if found else "MISSING"
        if not found:
            missing.append(tbl)
        print(f"[{status}] {tbl}")
    print(f"\nTotal Missing: {len(missing)}")
except Exception as e:
    print("Error checking DB:", e)
