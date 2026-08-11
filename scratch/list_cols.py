import subprocess

cmd = "PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -t -c \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assets';\""
out = subprocess.check_output(cmd, shell=True, text=True)
print(out)
