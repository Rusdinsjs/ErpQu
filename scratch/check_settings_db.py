import subprocess

sql = "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%deprec%' OR table_name LIKE '%maint%' OR table_name LIKE '%asset%');"
cmd = f"PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"{sql}\""

out = subprocess.check_output(cmd, shell=True, text=True)
print(out)
