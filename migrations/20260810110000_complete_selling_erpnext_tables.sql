-- Migration 20260810110000: Complete Selling ERPNext Tables Replication
-- Adds tables for Blanket Orders, Sales Partners/Persons, POS Shifts & Settings,
-- Loyalty Programs, Pricing & Discounts, Selling Settings, UTM, Territories, Campaigns, and Target Variances.

-- 1. Blanket Orders (Pesanan Payung)
CREATE TABLE IF NOT EXISTS blanket_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    tc_name VARCHAR(100),
    terms TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Completed, Cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blanket_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blanket_order_id UUID NOT NULL REFERENCES blanket_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    qty NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    ordered_qty NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    rate NUMERIC(20,4) NOT NULL DEFAULT 0.0000
);

-- 2. Sales Partners & Sales Persons
CREATE TABLE IF NOT EXISTS sales_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    partner_name VARCHAR(150) NOT NULL,
    partner_type VARCHAR(50) DEFAULT 'Reseller',
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    sales_person_name VARCHAR(150) NOT NULL,
    employee_id UUID REFERENCES employees(id),
    parent_sales_person_id UUID REFERENCES sales_persons(id),
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. POS Settings, Opening & Closing Entries
CREATE TABLE IF NOT EXISTS pos_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL UNIQUE,
    allow_discount_change BOOLEAN DEFAULT TRUE,
    allow_rate_change BOOLEAN DEFAULT FALSE,
    auto_print_receipt BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_opening_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    pos_profile_id UUID NOT NULL REFERENCES pos_profiles(id),
    user_id UUID NOT NULL REFERENCES users(id),
    period_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opening_amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_closing_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    pos_profile_id UUID NOT NULL REFERENCES pos_profiles(id),
    user_id UUID NOT NULL REFERENCES users(id),
    pos_opening_entry_id UUID REFERENCES pos_opening_entries(id),
    period_start_date TIMESTAMPTZ NOT NULL,
    period_end_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    grand_total NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    net_total NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    total_quantity NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_closing_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pos_closing_entry_id UUID NOT NULL REFERENCES pos_closing_entries(id) ON DELETE CASCADE,
    mode_of_payment VARCHAR(50) NOT NULL,
    opening_amount NUMERIC(20,4) DEFAULT 0.0000,
    expected_amount NUMERIC(20,4) DEFAULT 0.0000,
    closing_amount NUMERIC(20,4) DEFAULT 0.0000,
    difference NUMERIC(20,4) DEFAULT 0.0000
);

-- 4. Loyalty Program & Loyalty Points
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    program_name VARCHAR(100) NOT NULL,
    auto_opt_in BOOLEAN DEFAULT TRUE,
    from_date DATE,
    to_date DATE,
    conversion_factor NUMERIC(10,4) DEFAULT 1.0000, -- Amount spent per 1 point
    expiry_duration_in_days INT DEFAULT 365,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_point_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    loyalty_program_id UUID REFERENCES loyalty_programs(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    sales_invoice_id UUID REFERENCES sales_invoices(id),
    loyalty_points INT NOT NULL DEFAULT 0,
    purchase_amount NUMERIC(20,4) DEFAULT 0.0000,
    expiry_date DATE,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Items and Pricing Tables
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    price_list_name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    buying BOOLEAN DEFAULT FALSE,
    selling BOOLEAN DEFAULT TRUE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    price_list_rate NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    valid_from DATE,
    valid_upto DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotional_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) DEFAULT 'Percentage', -- Percentage, Fixed Amount, Buy X Get Y
    discount_value NUMERIC(15,4) DEFAULT 0.0000,
    min_qty NUMERIC(15,4) DEFAULT 1.0000,
    from_date DATE,
    to_date DATE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    apply_on VARCHAR(50) DEFAULT 'Item Code', -- Item Code, Item Group, Customer
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    margin_type VARCHAR(50) DEFAULT 'Percentage',
    margin_rate NUMERIC(15,4) DEFAULT 0.0000,
    priority INT DEFAULT 1,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipping_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    shipping_amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    calculate_based_on VARCHAR(50) DEFAULT 'Fixed', -- Fixed, Weight, Value
    account_id UUID REFERENCES chart_of_accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    coupon_name VARCHAR(100) NOT NULL,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    maximum_use INT DEFAULT 100,
    used_count INT DEFAULT 0,
    valid_from DATE,
    valid_upto DATE,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Settings, Territories, Campaigns & Master Setup
CREATE TABLE IF NOT EXISTS selling_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL UNIQUE,
    so_required BOOLEAN DEFAULT FALSE,
    dn_required BOOLEAN DEFAULT FALSE,
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    default_price_list_id UUID REFERENCES price_lists(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terms_and_conditions_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    terms_content TEXT NOT NULL,
    disabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_taxes_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    rate NUMERIC(5,2) NOT NULL DEFAULT 11.00, -- Default PPN 11%
    account_id UUID REFERENCES chart_of_accounts(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utm_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    medium VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    parent_group_id UUID REFERENCES customer_groups(id),
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    address_title VARCHAR(100) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    pincode VARCHAR(20),
    is_primary_billing BOOLEAN DEFAULT FALSE,
    is_primary_shipping BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    territory_name VARCHAR(100) NOT NULL,
    parent_territory_id UUID REFERENCES territories(id),
    target_amount NUMERIC(20,4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    campaign_name VARCHAR(150) NOT NULL,
    utm_source_id UUID REFERENCES utm_sources(id),
    start_date DATE,
    end_date DATE,
    budget NUMERIC(20,4) DEFAULT 0.0000,
    actual_cost NUMERIC(20,4) DEFAULT 0.0000,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- Territory, Sales Person, Sales Partner
    reference_id UUID NOT NULL,
    fiscal_year INT NOT NULL DEFAULT 2026,
    target_amount NUMERIC(20,4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
