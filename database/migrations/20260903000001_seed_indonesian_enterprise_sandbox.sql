-- ==============================================================================
-- Migration: 20260903000001_seed_indonesian_enterprise_sandbox.sql
-- Description: Realistic Indonesian Enterprise Seed Data & UAT Demo Sandbox
-- Standard: Indonesian PSAK Accounting, PPh 21 TER, BPJS, ABC Pareto Inventory,
--           Manufacturing BOM & Production Orders, CRM Pipeline & Forex
-- ==============================================================================

-- 1. COMPANIES (Holding & Subsidiary)
INSERT INTO companies (
    id, tenant_id, code, name, legal_name, tax_id, base_currency, country, address, phone, email, status, domain_slug
) VALUES 
    (
        'c0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'NPM',
        'PT Nusantara Perkasa Mandiri',
        'PT Nusantara Perkasa Mandiri Tbk',
        '01.234.567.8-012.000',
        'IDR',
        'Indonesia',
        'Gedung Menara Perkasa Lt. 28, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
        '+62-21-52998800',
        'corsec@nusantaraperkasa.co.id',
        'ACTIVE',
        'npm'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'PLA',
        'PT Perkasa Logistik Andalas',
        'PT Perkasa Logistik Andalas',
        '02.345.678.9-023.000',
        'IDR',
        'Indonesia',
        'Kawasan Industri Medan (KIM) II, Jl. Pulau Nias No. 12, Medan',
        '+62-61-6851234',
        'operasional@perkasaandalas.co.id',
        'ACTIVE',
        'pla'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    legal_name = EXCLUDED.legal_name,
    domain_slug = EXCLUDED.domain_slug;

-- 2. WAREHOUSES
INSERT INTO warehouses (
    id, company_id, code, name, is_group, warehouse_type
) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'WH-JKT-CENTRAL', 'Gudang Pusat Cikarang - Jakarta', FALSE, 'DEFAULT'),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'WH-MDN-TRANSIT', 'Gudang Hub Belawan - Medan', FALSE, 'TRANSIT')
ON CONFLICT (company_id, code) DO NOTHING;

-- 3. CHART OF ACCOUNTS (PSAK STANDAR INDONESIA UNTUK NPM)
INSERT INTO chart_of_accounts (id, code, name, account_type, normal_balance, is_active, company_id) VALUES
    ('a0000000-0000-0000-0000-000000001110', '1110', 'Kas Kecil & Operasional', 'asset', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000001120', '1120', 'Bank Mandiri Rekening Utama (IDR)', 'asset', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000001130', '1130', 'Piutang Usaha Usaha Pihak Ketiga', 'asset', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000001150', '1150', 'Persediaan Suku Cadang & Bahan Baku', 'asset', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000001510', '1510', 'Aset Tetap - Alat Berat & Armada', 'asset', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000001590', '1590', 'Akumulasi Penyusutan Aset Tetap', 'asset', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000002110', '2110', 'Utang Usaha Pemasok', 'liability', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000002131', '2131', 'Utang Pajak PPh 21 Karyawan', 'liability', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000002133', '2133', 'Utang PPN Keluaran (11%)', 'liability', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000003100', '3100', 'Modal Saham Ditempatkan & Disetor Penuh', 'equity', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000003200', '3200', 'Saldo Laba Ditahan (Retained Earnings)', 'equity', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000004110', '4110', 'Pendapatan Sewa Alat Berat & Logistik', 'revenue', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000004120', '4120', 'Pendapatan Fabrikasi Manufaktur', 'revenue', 'credit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000005110', '5110', 'Beban Pokok Penjualan & Fabrikasi (HPP)', 'expense', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000005120', '5120', 'Beban Bahan Bakar Solar Industri B35', 'expense', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000006110', '6110', 'Beban Gaji & Tunjangan Karyawan', 'expense', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000006120', '6120', 'Beban Iuran BPJS Ketenagakerjaan & Kesehatan', 'expense', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000006130', '6130', 'Beban Penyusutan Aset Tetap Alat Berat', 'expense', 'debit', TRUE, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    account_type = EXCLUDED.account_type;

-- 4. DYNAMIC ACCOUNT MAPPING (QSEC-ACMAP-001)
INSERT INTO account_mappings (company_id, mapping_key, account_id, description) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'ACCOUNTS_RECEIVABLE', 'a0000000-0000-0000-0000-000000001130', 'Piutang Usaha Pihak Ketiga'),
    ('c0000000-0000-0000-0000-000000000001', 'SALES_REVENUE', 'a0000000-0000-0000-0000-000000004110', 'Pendapatan Sewa Alat Berat'),
    ('c0000000-0000-0000-0000-000000000001', 'ACCOUNTS_PAYABLE', 'a0000000-0000-0000-0000-000000002110', 'Utang Usaha Pemasok'),
    ('c0000000-0000-0000-0000-000000000001', 'OPERATING_EXPENSE', 'a0000000-0000-0000-0000-000000006110', 'Beban Operasional Gaji'),
    ('c0000000-0000-0000-0000-000000000001', 'VAT_OUTPUT', 'a0000000-0000-0000-0000-000000002133', 'PPN Keluaran 11%'),
    ('c0000000-0000-0000-0000-000000000001', 'RETAINED_EARNINGS', 'a0000000-0000-0000-0000-000000003200', 'Saldo Laba Ditahan'),
    ('c0000000-0000-0000-0000-000000000001', 'INVENTORY', 'a0000000-0000-0000-0000-000000001150', 'Persediaan Bahan Baku'),
    ('c0000000-0000-0000-0000-000000000001', 'COGS', 'a0000000-0000-0000-0000-000000005110', 'Beban Pokok Penjualan Fabrikasi')
ON CONFLICT (company_id, mapping_key) DO UPDATE SET account_id = EXCLUDED.account_id;

-- 5. INVENTORY CATEGORIES
INSERT INTO inventory.inventory_categories (id, code, name, description, inventory_account_id, expense_account_id) VALUES
    (
        'ca700000-0000-0000-0000-000000000001',
        'CAT-HEAVY-COMP',
        'Komponen Utama Alat Berat',
        'Engine, pompa hidrolik, dan transmisi alat berat pertambangan',
        'a0000000-0000-0000-0000-000000001150',
        'a0000000-0000-0000-0000-000000005110'
    ),
    (
        'ca700000-0000-0000-0000-000000000002',
        'CAT-STEEL-RAW',
        'Bahan Baku Baja & Plat Fabrikasi',
        'Plat Hardox, H-Beam, pipa seamless struktural',
        'a0000000-0000-0000-0000-000000001150',
        'a0000000-0000-0000-0000-000000005110'
    ),
    (
        'ca700000-0000-0000-0000-000000000003',
        'CAT-FAST-MOVING',
        'Suku Cadang Habis Pakai & Pelumas',
        'Filter oli, baut high-tensile, seal kit',
        'a0000000-0000-0000-0000-000000001150',
        'a0000000-0000-0000-0000-000000005110'
    )
ON CONFLICT (code) DO NOTHING;

-- 6. INVENTORY ITEMS (PORTFOLIO ABC PARETO + LOW STOCK ALERT DEFICIT)
INSERT INTO inventory.inventory_items (
    id, company_id, category_id, unit_id, sku, name, description, min_stock, max_stock, current_quantity, average_cost, last_purchase_price, is_active
) VALUES
    -- KELAS A: HIGH VALUE (~70% TOTAL VALUASI)
    (
        '17e30000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'ca700000-0000-0000-0000-000000000001',
        1, -- UNIT
        'ITEM-ENG-CAT336',
        'Mesin Diesel Caterpillar C9.3B Acert Engine',
        'Engine assembly 336D/336E Tier 4 Industrial Mining Spec',
        2.00,
        15.00,
        10.00,
        45000000.00, -- Total Valuasi Rp 450.000.000
        45000000.00,
        TRUE
    ),
    (
        '17e30000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'ca700000-0000-0000-0000-000000000001',
        1, -- UNIT
        'ITEM-HYD-KOMPC200',
        'Pompa Hidrolik Utama Komatsu PC200-8 Main Pump',
        'Kawasaki Hydraulic Pump K3V112DT Complete Assembly',
        3.00,
        25.00,
        20.00,
        9000000.00, -- Total Valuasi Rp 180.000.000
        9000000.00,
        TRUE
    ),

    -- KELAS B: MODERATE VALUE (~20% TOTAL VALUASI)
    (
        '17e30000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'ca700000-0000-0000-0000-000000000002',
        1, -- UNIT
        'ITEM-TRK-BRG',
        'Bearing Roller Spherical SKF 22320 CC/W33',
        'Heavy vibratory screen & swing drive roller bearing',
        10.00,
        50.00,
        30.00,
        1500000.00, -- Total Valuasi Rp 45.000.000
        1500000.00,
        TRUE
    ),
    (
        '17e30000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'ca700000-0000-0000-0000-000000000002',
        8, -- MTR
        'ITEM-STEEL-HBEAM',
        'Baja Profil H-Beam SS400 200x200x8x12',
        'Struktur rangka chassis trailer alat berat',
        15.00,
        100.00,
        50.00,
        700000.00, -- Total Valuasi Rp 35.000.000
        700000.00,
        TRUE
    ),

    -- KELAS C: LOW VALUE / MASSAL (~10% TOTAL VALUASI)
    (
        '17e30000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        'ca700000-0000-0000-0000-000000000003',
        2, -- SET
        'ITEM-BLT-M24',
        'Baut & Mur Baja Grade 8.8 M24x100mm Hex Head',
        'Baut pengikat shoe track excavator & counterweight',
        100.00,
        1000.00,
        500.00,
        10000.00, -- Total Valuasi Rp 5.000.000
        10000.00,
        TRUE
    ),
    (
        '17e30000-0000-0000-0000-000000000006',
        'c0000000-0000-0000-0000-000000000001',
        'ca700000-0000-0000-0000-000000000003',
        2, -- SET
        'ITEM-SEAL-O',
        'O-Ring Kit NBR 90 Shore A (Industrial Heavy)',
        'Seal kit tahan oli hidrolik temperatur tinggi',
        20.00,
        200.00,
        100.00,
        25000.00, -- Total Valuasi Rp 2.500.000
        25000.00,
        TRUE
    ),

    -- ITEM PEMICU LOW STOCK ALERT (DEFISIT / STATUS KRITIS)
    (
        '17e30000-0000-0000-0000-000000000007',
        'c0000000-0000-0000-0000-000000000001',
        'ca700000-0000-0000-0000-000000000003',
        3, -- PCS
        'ITEM-FLTR-OIL',
        'Filter Oli Mesin Donaldson P550388 Lube Spin-On',
        'Filter oli utama unit Caterpillar 320D/336D',
        20.00, -- Min stock = 20 unit
        80.00,
        2.00,  -- Current = 2 unit (Kritis defisit 18 unit)
        350000.00,
        350000.00,
        TRUE
    )
ON CONFLICT (sku) DO UPDATE SET
    current_quantity = EXCLUDED.current_quantity,
    average_cost = EXCLUDED.average_cost,
    min_stock = EXCLUDED.min_stock;

-- 7. BILL OF MATERIALS (BOM) & PRODUCTION ORDERS
INSERT INTO boms (
    id, company_id, item_id, bom_number, version, quantity, is_active
) VALUES
    (
        'b0300000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        '17e30000-0000-0000-0000-000000000001',
        'BOM-BUCKET-EXC20',
        1,
        1.0000,
        TRUE
    ),
    (
        'b0300000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        '17e30000-0000-0000-0000-000000000003',
        'BOM-CANOPY-ROPS',
        1,
        1.0000,
        TRUE
    )
ON CONFLICT (company_id, bom_number) DO NOTHING;

INSERT INTO bom_items (bom_id, item_id, qty_required, scrap_percentage) VALUES
    ('b0300000-0000-0000-0000-000000000001', '17e30000-0000-0000-0000-000000000004', 2.5000, 3.50),
    ('b0300000-0000-0000-0000-000000000001', '17e30000-0000-0000-0000-000000000005', 24.0000, 2.00),
    ('b0300000-0000-0000-0000-000000000002', '17e30000-0000-0000-0000-000000000004', 1.8000, 2.00),
    ('b0300000-0000-0000-0000-000000000002', '17e30000-0000-0000-0000-000000000005', 16.0000, 1.00)
ON CONFLICT DO NOTHING;

INSERT INTO production_orders (
    id, company_id, production_order_number, bom_id, item_id, target_qty, produced_qty, warehouse_id, status
) VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'SPK-2026-001',
        'b0300000-0000-0000-0000-000000000001',
        '17e30000-0000-0000-0000-000000000001',
        5.0000,
        3.0000,
        'e0000000-0000-0000-0000-000000000001',
        'IN_PROGRESS'
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'SPK-2026-002',
        'b0300000-0000-0000-0000-000000000002',
        '17e30000-0000-0000-0000-000000000003',
        10.0000,
        10.0000,
        'e0000000-0000-0000-0000-000000000001',
        'COMPLETED'
    )
ON CONFLICT (company_id, production_order_number) DO NOTHING;

-- 8. CRM LEADS & OPPORTUNITIES (SALES FUNNEL REALISTIS)
INSERT INTO leads (
    id, company_id, lead_name, organization_name, email, phone, status
) VALUES
    ('1ea00000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Ir. Hendra Gunawan', 'PT Adhi Karya (Persero) Tbk', 'hendra.gunawan@adhikarya.co.id', '+62811987654', 'QUALIFIED'),
    ('1ea00000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Budi Santoso, ST', 'PT Bukit Asam Tbk', 'budi.santoso@bukitasam.co.id', '+62812345678', 'QUALIFIED'),
    ('1ea00000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Rahmat Hidayat', 'PT Berau Coal Energy', 'rahmat.h@beraucoal.co.id', '+62813456789', 'QUALIFIED'),
    ('1ea00000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Dedi Prasetyo', 'PT Semen Indonesia Group', 'dedi.p@sig.id', '+62815678901', 'QUALIFIED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO opportunities (
    id, company_id, lead_id, title, estimated_value, stage, expected_closing_date
) VALUES
    (
        '0ff00000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        '1ea00000-0000-0000-0000-000000000001',
        'Sewa Jangka Panjang 8 Unit Excavator Proyek Tol Trans Sumatera',
        1200000000.0000,
        'PROPOSAL',
        CURRENT_DATE + INTERVAL '30 days'
    ),
    (
        '0ff00000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        '1ea00000-0000-0000-0000-000000000002',
        'Kontrak Pemeliharaan Fleet Heavy Hauler Tambang Tanjung Enim',
        850000000.0000,
        'WON',
        CURRENT_DATE - INTERVAL '5 days'
    ),
    (
        '0ff00000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        '1ea00000-0000-0000-0000-000000000003',
        'Pasokan Suku Cadang Undercarriage Komatsu D375A Pit Lati',
        420000000.0000,
        'QUALIFICATION',
        CURRENT_DATE + INTERVAL '45 days'
    ),
    (
        '0ff00000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        '1ea00000-0000-0000-0000-000000000004',
        'Fabrikasi Hopper Silo Pabrik Semen Tuban',
        600000000.0000,
        'LOST',
        CURRENT_DATE - INTERVAL '12 days'
    )
ON CONFLICT (id) DO UPDATE SET
    stage = EXCLUDED.stage,
    estimated_value = EXCLUDED.estimated_value;

-- 9. KURS VALUTA ASING (USD, SGD, EUR KE IDR)
INSERT INTO exchange_rates (
    company_id, from_currency, to_currency, exchange_rate, effective_date, source
) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'USD', 'IDR', 15850.000000, CURRENT_DATE, 'bank_indonesia'),
    ('c0000000-0000-0000-0000-000000000001', 'SGD', 'IDR', 11920.000000, CURRENT_DATE, 'bank_indonesia'),
    ('c0000000-0000-0000-0000-000000000001', 'EUR', 'IDR', 17250.000000, CURRENT_DATE, 'bank_indonesia')
ON CONFLICT (company_id, from_currency, to_currency, effective_date) DO UPDATE SET
    exchange_rate = EXCLUDED.exchange_rate,
    source = EXCLUDED.source;
