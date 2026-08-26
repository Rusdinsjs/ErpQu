-- Optional Demo Seed Data for Local Development / Testing Only (Fase 16)
-- Do NOT execute in production environments.

-- Demo Client Seed
INSERT INTO crm.clients (id, client_code, name, created_at)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'CLIENT-DEMO-01', 'PT Nusantara Demo Client', NOW()),
    ('c0000000-0000-0000-0000-000000000002', 'CLIENT-DEMO-02', 'CV Jaya Abadi Demo', NOW())
ON CONFLICT (id) DO NOTHING;

-- Demo Vendor / Supplier Seed
INSERT INTO procurement.suppliers (id, supplier_code, name, created_at)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'SUPP-DEMO-01', 'PT Mitra Utama Supplier', NOW())
ON CONFLICT (id) DO NOTHING;
