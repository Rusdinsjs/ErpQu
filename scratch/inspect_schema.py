import os
import psycopg2

db_url = os.environ.get('MIGRATION_DATABASE_URL') or "postgres://postgres:postgres@localhost:5436/management_system"
try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name IN ('warehouses', 'stock_ledger_entries', 'stock_entry_items', 'inventory_items');
    """)
    rows = cur.fetchall()
    print("Tables found:")
    for row in rows:
        print(row)
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
