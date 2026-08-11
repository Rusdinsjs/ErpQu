-- Migration 20260811010000: Complete All Stock & Inventory Module Doctypes & Tables
-- Ensures all 24 Stock Workspace Doctypes have complete, robust database tables following ERPQu standards.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Stock Reconciliations (Stock Opname)
CREATE TABLE IF NOT EXISTS stock_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    reconciliation_number VARCHAR(100) NOT NULL,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    posting_time TIME NOT NULL DEFAULT CURRENT_TIME,
    warehouse_id UUID REFERENCES warehouses(id),
    purpose VARCHAR(100) DEFAULT 'Stock Reconciliation',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Submitted, Completed, Cancelled
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT uq_company_stock_rec_number UNIQUE (company_id, reconciliation_number)
);

CREATE TABLE IF NOT EXISTS stock_reconciliation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id UUID NOT NULL REFERENCES stock_reconciliations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    warehouse_id UUID REFERENCES warehouses(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    valuation_rate NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    current_qty NUMERIC(15,4) DEFAULT 0.0000,
    current_valuation_rate NUMERIC(20,4) DEFAULT 0.0000,
    difference_qty NUMERIC(15,4) DEFAULT 0.0000,
    batch_no VARCHAR(100),
    serial_no TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Delivery Trips (Fleet & Logistics)
CREATE TABLE IF NOT EXISTS delivery_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    trip_number VARCHAR(100) NOT NULL,
    driver_id UUID,
    vehicle_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, In Transit, Completed, Cancelled
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_trip_number_company UNIQUE (company_id, trip_number)
);

CREATE TABLE IF NOT EXISTS delivery_trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES delivery_trips(id) ON DELETE CASCADE,
    delivery_note_id UUID,
    stop_order INT NOT NULL DEFAULT 1,
    customer_address TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Delivered, Failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Product Bundles
CREATE TABLE IF NOT EXISTS product_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    new_item_code VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_product_bundle UNIQUE (company_id, new_item_code)
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    qty NUMERIC(15,4) DEFAULT 1.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Warehouse Bins & Item Bin Balances
CREATE TABLE IF NOT EXISTS warehouse_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    bin_code VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_warehouse_bin_code_pub UNIQUE (warehouse_id, bin_code)
);

CREATE TABLE IF NOT EXISTS item_bin_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    warehouse_bin_id UUID NOT NULL REFERENCES warehouse_bins(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    actual_qty NUMERIC(20,9) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_bin_item_pub UNIQUE (company_id, warehouse_bin_id, item_id)
);

-- 5. Add performance indexes for stock querying
CREATE INDEX IF NOT EXISTS idx_stock_rec_company ON stock_reconciliations(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_rec_items_rec ON stock_reconciliation_items(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_delivery_trips_company ON delivery_trips(company_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_company ON product_bundles(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_bins_wh ON warehouse_bins(warehouse_id);
