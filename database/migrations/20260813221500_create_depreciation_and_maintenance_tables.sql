-- Migration: Depreciation Methods and Maintenance Types fullstack
-- Description: Creates depreciation_methods table and enhances maintenance_types

-- 1. Depreciation Methods
CREATE TABLE IF NOT EXISTS depreciation_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    method_name VARCHAR(255) NOT NULL,
    annual_rate VARCHAR(50),
    frequency_months VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert defaults for Depreciation Methods
INSERT INTO depreciation_methods (code, method_name, annual_rate, frequency_months, description)
VALUES
    ('SLM', 'Garis Lurus (Straight Line)', '5% - 25%', '12 Bulan (Bulanan)', 'Penyusutan nilai tetap seragam per bulan sesuai estimasi umur ekonomis kategori aset.'),
    ('DBM', 'Saldo Menurun (Declining Balance)', '25% - 40%', '12 Bulan (Bulanan)', 'Penyusutan lebih besar pada tahun-tahun awal pemakaian sesuai tingkat keausan mesin.'),
    ('SYD', 'Jumlah Angka Tahun (Sum of Years Digits)', '33.3%', '12 Bulan (Tahunan)', 'Penyusutan dipercepat berdasarkan rasio sisa umur terhadap total penjumlahan tahun.'),
    ('UPM', 'Unit Produksi (Units of Production)', 'Variabel', 'Per Batch Produksi', 'Penyusutan dihitung berdasarkan persentase jam mesin aktual dibandingkan total estimasi kapasitas.')
ON CONFLICT (code) DO NOTHING;

-- 2. Maintenance Types Enhancements
ALTER TABLE maintenance_types 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing maintenance types with descriptions
UPDATE maintenance_types SET description = 'Servis & perawatan rutin terencana' WHERE code = 'ROUTINE';
UPDATE maintenance_types SET description = 'Perbaikan kompresor & penggantian sparepart akibat kerusakan' WHERE code = 'REPAIR';
UPDATE maintenance_types SET description = 'Bongkar mesin total dan rekondisi utama setiap 3 tahun' WHERE code = 'OVERHAUL';
UPDATE maintenance_types SET description = 'Inspeksi & audit aset berkala' WHERE code = 'INSPECTION';
