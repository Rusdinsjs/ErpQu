-- Migration: 20260809000000_create_stock_entry_and_request
-- Description: Creates stock_entries, stock_entry_items, material_requests, and material_request_items tables in inventory schema.

-- 1. Create Stock Entries Table (Header)
CREATE TABLE IF NOT EXISTS inventory.stock_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    posting_date DATE NOT NULL,
    posting_time TIME NOT NULL DEFAULT NOW()::TIME,
    stock_entry_type VARCHAR(50) NOT NULL, -- 'MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'MATERIAL_TRANSFER', 'REPACK'
    voucher_no VARCHAR(100) NOT NULL,
    purpose VARCHAR(255),
    source_warehouse_id UUID REFERENCES public.warehouses(id),
    target_warehouse_id UUID REFERENCES public.warehouses(id),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'CANCELLED'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT uq_stock_entry_voucher_no UNIQUE (company_id, voucher_no)
);

CREATE INDEX IF NOT EXISTS idx_stock_entries_company_date ON inventory.stock_entries(company_id, posting_date);
CREATE INDEX IF NOT EXISTS idx_stock_entries_status ON inventory.stock_entries(status);

-- 2. Create Stock Entry Items Table (Detail)
CREATE TABLE IF NOT EXISTS inventory.stock_entry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_entry_id UUID NOT NULL REFERENCES inventory.stock_entries(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory.inventory_items(id),
    source_warehouse_id UUID REFERENCES public.warehouses(id),
    target_warehouse_id UUID REFERENCES public.warehouses(id),
    qty NUMERIC(15,4) NOT NULL,
    basic_rate NUMERIC(18,6) NOT NULL DEFAULT 0.000000, -- unit valuation rate
    amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000,       -- total value
    batch_no VARCHAR(100),
    serial_no VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_entry_items_entry ON inventory.stock_entry_items(stock_entry_id);
CREATE INDEX IF NOT EXISTS idx_stock_entry_items_item ON inventory.stock_entry_items(item_id);

-- 3. Create Material Requests Table (Header)
CREATE TABLE IF NOT EXISTS inventory.material_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    material_request_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'MATERIAL_TRANSFER', 'MATERIAL_ISSUE'
    voucher_no VARCHAR(100) NOT NULL,
    required_by_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PARTIALLY_ORDERED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT uq_material_request_voucher_no UNIQUE (company_id, voucher_no)
);

CREATE INDEX IF NOT EXISTS idx_material_requests_company_date ON inventory.material_requests(company_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON inventory.material_requests(status);

-- 4. Create Material Request Items Table (Detail)
CREATE TABLE IF NOT EXISTS inventory.material_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_request_id UUID NOT NULL REFERENCES inventory.material_requests(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory.inventory_items(id),
    warehouse_id UUID REFERENCES public.warehouses(id), -- target warehouse where item is needed
    qty NUMERIC(15,4) NOT NULL,
    ordered_qty NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    received_qty NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_request_items_req ON inventory.material_request_items(material_request_id);
CREATE INDEX IF NOT EXISTS idx_material_request_items_item ON inventory.material_request_items(item_id);
