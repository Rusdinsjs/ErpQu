import subprocess

seed_sql = """
-- Seed Asset Categories
INSERT INTO categories (id, code, name, main_category, depreciation_method, depreciation_period_months)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'CAT-VEH', 'Kendaraan & Armada', 'Vehicles', 'straight_line', 60),
  ('c2222222-2222-2222-2222-222222222222', 'CAT-MACH', 'Mesin & Peralatan Pabrik', 'Machinery', 'straight_line', 120),
  ('c3333333-3333-3333-3333-333333333333', 'CAT-IT', 'Perangkat IT & Komputer', 'IT Equipment', 'straight_line', 36),
  ('c4444444-4444-4444-4444-444444444444', 'CAT-OFF', 'Furnitur & Peralatan Kantor', 'Furniture', 'straight_line', 48),
  ('c5555555-5555-5555-5555-555555555555', 'CAT-BLD', 'Gedung & Bangunan', 'Buildings', 'straight_line', 240)
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Assets
INSERT INTO assets (id, asset_code, name, category_id, status, purchase_price, purchase_date, brand, model, serial_number, description)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'AST-2026-001', 'Toyota Avanza Veloz 1.5 CVT', 'c1111111-1111-1111-1111-111111111111', 'in_use', 285000000.00, '2025-01-15', 'Toyota', 'Avanza Veloz', 'B-1234-SJS', 'Mobil operasional manajemen kantor pusat'),
  ('a2222222-2222-2222-2222-222222222222', 'AST-2026-002', 'Mitsubishi Fuso Canter HD 136PS', 'c1111111-1111-1111-1111-111111111111', 'in_use', 520000000.00, '2024-06-10', 'Mitsubishi', 'Canter HD 136PS', 'B-9876-SJS', 'Truk bak besi pengiriman logistik cabang'),
  ('a3333333-3333-3333-3333-333333333333', 'AST-2026-003', 'Caterpillar Excavator 320 GC', 'c2222222-2222-2222-2222-222222222222', 'under_maintenance', 1650000000.00, '2023-11-20', 'Caterpillar', '320 GC', 'CAT-320GC-99', 'Alat berat penggalian tambang & konstruksi'),
  ('a4444444-4444-4444-4444-444444444444', 'AST-2026-004', 'Server Dell PowerEdge R750', 'c3333333-3333-3333-3333-333333333333', 'in_use', 120000000.00, '2025-03-01', 'Dell', 'PowerEdge R750', 'SJS-SRV-01', 'Primary database server pusat data ERPQu'),
  ('a5555555-5555-5555-5555-555555555555', 'AST-2026-005', 'MacBook Pro M3 Max 16 inch', 'c3333333-3333-3333-3333-333333333333', 'in_use', 55000000.00, '2025-02-10', 'Apple', 'MacBook Pro 16 M3', 'C02G1234MD61', 'Laptop utama CTO & Lead Architect ERPQu'),
  ('a6666666-6666-6666-6666-666666666666', 'AST-2026-006', 'Mesin CNC Milling 5-Axis', 'c2222222-2222-2222-2222-222222222222', 'in_use', 850000000.00, '2024-02-18', 'Haas', 'UMC-750', 'HAAS-CNC-5A', 'Mesin fabrikasi manufaktur komponen presisi'),
  ('a7777777-7777-7777-7777-777777777777', 'AST-2026-007', 'Forklift Komatsu 3 Ton Diesel', 'c2222222-2222-2222-2222-222222222222', 'in_use', 240000000.00, '2024-09-05', 'Komatsu', 'FD30T-17', 'KMT-FL-30T', 'Forklift penataan palet gudang utama'),
  ('a8888888-8888-8888-8888-888888888888', 'AST-2026-008', 'Gedung Kantor Pusat & Hangar SJS', 'c5555555-5555-5555-5555-555555555555', 'in_use', 4500000000.00, '2020-01-01', 'SJS Building', 'Hangar 4 Storey', 'BLD-SJS-HQ', 'Properti kantor pusat 4 lantai & workshop')
ON CONFLICT (asset_code) DO NOTHING;
"""

cmd = f"PGPASSWORD=postgres psql -h localhost -p 5436 -U postgres -d management_system -c \"{seed_sql}\""

try:
    res = subprocess.check_output(cmd, shell=True, text=True)
    print("Seed result:\n", res)
except Exception as e:
    print("Error seeding assets:", e)
