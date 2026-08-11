import glob
import os
import subprocess

print("=== APPLYING STOCK MIGRATIONS TO DATABASE (management_system:5436) ===")

migration_files = sorted(glob.glob("migrations/*.sql"))
print(f"Found {len(migration_files)} total migration files.")

applied_count = 0
failed_count = 0

for mfile in migration_files:
    # We execute psql for each migration file
    cmd = f"PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -f {mfile}"
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode == 0:
        applied_count += 1
    else:
        # Ignore duplicate table errors, print warning
        if "already exists" in res.stderr:
            applied_count += 1
        else:
            print(f"Migration {mfile} returned warnings/errors: {res.stderr[:200]}")
            failed_count += 1

print(f"\nMigration application complete. Successfully processed: {applied_count}, Warnings/Errors: {failed_count}")
