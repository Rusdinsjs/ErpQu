import subprocess

sql = """
-- Update Asset Groups on Categories
UPDATE categories SET asset_group = 'KENDARAAN' WHERE code = 'CAT-VEH';
UPDATE categories SET asset_group = 'ALAT_BERAT' WHERE code = 'CAT-MACH';
UPDATE categories SET asset_group = 'INFRASTRUKTUR' WHERE code IN ('CAT-IT', 'CAT-OFF', 'CAT-BLD');

-- Update any null asset_group categories to INFRASTRUKTUR so they are always visible
UPDATE categories SET asset_group = 'INFRASTRUKTUR' WHERE asset_group IS NULL;
"""

cmd = f"PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -c \"{sql}\""

try:
    res = subprocess.check_output(cmd, shell=True, text=True)
    print("Update asset_group result:\n", res)
except Exception as e:
    print("Error updating asset_group:", e)
