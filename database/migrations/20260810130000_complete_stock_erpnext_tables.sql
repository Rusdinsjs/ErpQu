-- Migration 20260810130000: Complete Stock ERPNext Tables Replication
-- Adds tables for Delivery Notes, Pick Lists, Landed Cost Vouchers, Serial Numbers, Batches,
-- Manufacturers, Item Alternatives, Stock Settings, Brands, UOMs, UOM Conversions, and Tax Templates.

-- 1. Delivery Notes (Surat Jalan / Delivery Notes)
CREATE TABLE IF NOT EXISTS delivery_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    delivery_note_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES clients(id),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    posting_time TIME NOT NULL DEFAULT CURRENT_TIME,
    warehouse_id UUID REFERENCES warehouses(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Submitted, Completed, Cancelled
    grand_total NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_note_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    rate NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    batch_no VARCHAR(100),
    serial_no TEXT
);

-- 2. Pick Lists
CREATE TABLE IF NOT EXISTS pick_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    pick_list_number VARCHAR(100) NOT NULL,
    purpose VARCHAR(100) DEFAULT 'Delivery',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Open, Picked, Completed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pick_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pick_list_id UUID NOT NULL REFERENCES pick_lists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    warehouse_id UUID REFERENCES warehouses(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    picked_qty NUMERIC(15,4) NOT NULL DEFAULT 0.0000
);

-- 3. Landed Cost Vouchers
CREATE TABLE IF NOT EXISTS landed_cost_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    voucher_number VARCHAR(100) NOT NULL,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_freight_charge NUMERIC(20,4) DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS landed_cost_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES landed_cost_vouchers(id) ON DELETE CASCADE,
    receipt_document_type VARCHAR(50) NOT NULL, -- Purchase Receipt, Purchase Bill
    receipt_document_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    applicable_charges NUMERIC(20,4) DEFAULT 0.0000
);

-- 4. Serial Numbers & Batches
CREATE TABLE IF NOT EXISTS serial_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    serial_no VARCHAR(100) NOT NULL,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    warehouse_id UUID REFERENCES warehouses(id),
    status VARCHAR(50) DEFAULT 'Active', -- Active, Expired, Delivered, Defective
    warranty_expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_serial UNIQUE (company_id, serial_no)
);

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    batch_no VARCHAR(100) NOT NULL,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    manufacturing_date DATE,
    expiry_date DATE,
    qty NUMERIC(15,4) DEFAULT 0.0000,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_batch UNIQUE (company_id, item_id, batch_no)
);

-- 5. Manufacturers & Item Alternatives
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    website VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    manufacturer_id UUID NOT NULL REFERENCES manufacturers(id),
    manufacturer_part_no VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_alternatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    alternative_item_id UUID NOT NULL REFERENCES inventory_items(id),
    two_way BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Installation Notes
CREATE TABLE IF NOT EXISTS installation_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    note_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES clients(id),
    inst_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Settings, Brands, UOMs & Tax Templates
CREATE TABLE IF NOT EXISTS stock_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL UNIQUE,
    default_valuation_method VARCHAR(50) DEFAULT 'FIFO', -- FIFO, Moving Average
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    auto_reorder_level BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    uom_name VARCHAR(50) NOT NULL,
    must_be_whole_number BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uom_conversion_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    from_uom_id UUID NOT NULL REFERENCES uoms(id),
    to_uom_id UUID NOT NULL REFERENCES uoms(id),
    value NUMERIC(15,6) NOT NULL DEFAULT 1.000000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_tax_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 11.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
