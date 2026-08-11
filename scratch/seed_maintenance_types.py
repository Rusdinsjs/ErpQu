import subprocess

sql = """
INSERT INTO maintenance_types (code, name, is_preventive) VALUES
  ('PREV', 'Preventive Maintenance Berkala', true),
  ('CORR', 'Corrective Maintenance (Perbaikan)', false),
  ('OVERHAUL', 'Major Overhaul Servis Besar', false),
  ('INSP', 'Inspeksi Kelaikan & Keselamatan', true),
  ('CALIB', 'Kalibrasi Sensor & Instrumentasi', true)
ON CONFLICT (code) DO NOTHING;
"""

cmd = f"PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -c \"{sql}\""

try:
    res = subprocess.check_output(cmd, shell=True, text=True)
    print("Seed maintenance_types result:\n", res)
except Exception as e:
    print("Error seeding maintenance_types:", e)
