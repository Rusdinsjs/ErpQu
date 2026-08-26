-- Migration 20260810100000: Warehouse Bins & Location Ledger

-- 1. Create warehouse_bins table
CREATE TABLE IF NOT EXISTS inventory.warehouse_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    bin_code VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_warehouse_bin_code UNIQUE (warehouse_id, bin_code)
);

-- 2. Create item_bin_balances table
CREATE TABLE IF NOT EXISTS inventory.item_bin_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    warehouse_bin_id UUID NOT NULL REFERENCES inventory.warehouse_bins(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory.inventory_items(id) ON DELETE CASCADE,
    actual_qty NUMERIC(20, 9) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_bin_item UNIQUE (company_id, warehouse_bin_id, item_id)
);

-- 3. Modify stock_ledger_entries and stock_entry_items tables
ALTER TABLE public.stock_ledger_entries ADD COLUMN IF NOT EXISTS warehouse_bin_id UUID REFERENCES inventory.warehouse_bins(id);

ALTER TABLE inventory.stock_entry_items ADD COLUMN IF NOT EXISTS source_bin_id UUID REFERENCES inventory.warehouse_bins(id);
ALTER TABLE inventory.stock_entry_items ADD COLUMN IF NOT EXISTS target_bin_id UUID REFERENCES inventory.warehouse_bins(id);
