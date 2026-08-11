import subprocess

cmd = "PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;\""
out = subprocess.check_output(cmd, shell=True, text=True)
tables = [t.strip() for t in out.splitlines() if t.strip()]
print(f"Total tables: {len(tables)}")
print("Tables:\n", ", ".join(tables))
