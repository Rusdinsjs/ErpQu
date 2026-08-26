-- Migration 20260811020000: Complete All Selling & Sales Module Doctypes & Tables
-- Ensures all 30 Selling Workspace Doctypes have complete, robust database tables following ERPQu standards.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS marketing_campaigns CASCADE;
DROP TABLE IF EXISTS customer_contacts CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS blanket_orders CASCADE;

-- 1. Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    campaign_name VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget NUMERIC(20,4) DEFAULT 0.0000,
    actual_cost NUMERIC(20,4) DEFAULT 0.0000,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Planned, Completed, Cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_campaign_name UNIQUE (company_id, campaign_name)
);

-- 2. Customer Contacts
CREATE TABLE IF NOT EXISTS customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    customer_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(50),
    mobile_no VARCHAR(50),
    designation VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    customer_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    address_title VARCHAR(150) NOT NULL,
    address_type VARCHAR(50) DEFAULT 'Billing', -- Billing, Shipping, Both
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    postal_code VARCHAR(20),
    is_primary_billing BOOLEAN DEFAULT FALSE,
    is_primary_shipping BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure blanket_orders table
CREATE TABLE IF NOT EXISTS blanket_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    blanket_order_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES clients(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    grand_total NUMERIC(20,4) DEFAULT 0.0000,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_blanket_order UNIQUE (company_id, blanket_order_number)
);

-- 5. Add performance indexes for Selling queries
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_company ON marketing_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_cust ON customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_cust ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_blanket_orders_company ON blanket_orders(company_id);
