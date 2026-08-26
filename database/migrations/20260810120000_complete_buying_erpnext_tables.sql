-- Migration 20260810120000: Complete Buying ERPNext Tables Replication
-- Adds tables for RFQs, Supplier Quotations, Supplier Groups/Contacts/Addresses,
-- Supplier Scorecards, Buying Settings, Purchase Taxes Templates, and Subcontracting.

-- 1. Requests for Quotation (RFQ)
CREATE TABLE IF NOT EXISTS requests_for_quotation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    rfq_number VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Submitted, Cancelled
    tc_name VARCHAR(100),
    terms TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES requests_for_quotation(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    warehouse_id UUID REFERENCES warehouses(id),
    schedule_date DATE
);

CREATE TABLE IF NOT EXISTS rfq_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES requests_for_quotation(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    quote_status VARCHAR(50) DEFAULT 'Pending'
);

-- 2. Supplier Quotations
CREATE TABLE IF NOT EXISTS supplier_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    quotation_number VARCHAR(100) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    rfq_id UUID REFERENCES requests_for_quotation(id),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_till DATE,
    subtotal NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    total_tax NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    grand_total NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Submitted, Accepted, Rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    rate NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000
);

-- 3. Supplier Groups, Contacts & Addresses
CREATE TABLE IF NOT EXISTS supplier_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    parent_group_id UUID REFERENCES supplier_groups(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    address_title VARCHAR(100) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    pincode VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Supplier Scorecards
CREATE TABLE IF NOT EXISTS supplier_scorecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    status VARCHAR(50) DEFAULT 'Approved', -- Preferred, Approved, On Hold, Rejected
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_scorecard_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    param_type VARCHAR(50) DEFAULT 'Delivery Time',
    weight NUMERIC(5,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_scorecard_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    criteria_name VARCHAR(100) NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 100.00,
    formula TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_scorecard_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    standing_name VARCHAR(100) NOT NULL,
    min_score NUMERIC(5,2) DEFAULT 0.00,
    max_score NUMERIC(5,2) DEFAULT 100.00,
    prevent_po BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Buying Settings & Purchase Taxes
CREATE TABLE IF NOT EXISTS buying_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL UNIQUE,
    po_required BOOLEAN DEFAULT FALSE,
    pr_required BOOLEAN DEFAULT FALSE,
    maintain_same_rate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_taxes_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    rate NUMERIC(5,2) NOT NULL DEFAULT 11.00, -- Default PPN 11%
    account_id UUID REFERENCES chart_of_accounts(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Subcontracting
CREATE TABLE IF NOT EXISTS subcontracting_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
