-- Migration: 20260810140000_complete_accounting_erpnext_tables.sql
-- Description: Complete ERPNext Accounting Desk tables replication

-- 1. Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entry_no VARCHAR(100) NOT NULL UNIQUE,
    voucher_type VARCHAR(50) DEFAULT 'Journal Entry',
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_remark TEXT,
    total_debit NUMERIC(18, 2) DEFAULT 0.00,
    total_credit NUMERIC(18, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entry_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID,
    account_name VARCHAR(255),
    debit NUMERIC(18, 2) DEFAULT 0.00,
    credit NUMERIC(18, 2) DEFAULT 0.00,
    cost_center_id UUID,
    user_remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Payment Entries
CREATE TABLE IF NOT EXISTS payment_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entry_no VARCHAR(100) NOT NULL UNIQUE,
    payment_type VARCHAR(50) DEFAULT 'Pay',
    party_type VARCHAR(50),
    party_id UUID,
    party_name VARCHAR(255),
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode_of_payment VARCHAR(50) DEFAULT 'Bank Transfer',
    paid_from_account_id UUID,
    paid_to_account_id UUID,
    paid_amount NUMERIC(18, 2) DEFAULT 0.00,
    received_amount NUMERIC(18, 2) DEFAULT 0.00,
    reference_no VARCHAR(100),
    reference_date DATE,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_entry_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_entry_id UUID REFERENCES payment_entries(id) ON DELETE CASCADE,
    reference_doctype VARCHAR(50),
    reference_id UUID,
    reference_name VARCHAR(100),
    total_amount NUMERIC(18, 2) DEFAULT 0.00,
    allocated_amount NUMERIC(18, 2) DEFAULT 0.00,
    outstanding_amount NUMERIC(18, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Payment Reconciliations
CREATE TABLE IF NOT EXISTS payment_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    party_type VARCHAR(50),
    party_id UUID,
    receivable_payable_account_id UUID,
    status VARCHAR(50) DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bank Accounts & Transactions
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    bank_account_no VARCHAR(100) NOT NULL,
    iban VARCHAR(100),
    swift_code VARCHAR(50),
    gl_account_id UUID,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    deposit NUMERIC(18, 2) DEFAULT 0.00,
    withdrawal NUMERIC(18, 2) DEFAULT 0.00,
    description TEXT,
    reference_number VARCHAR(100),
    unallocated_amount NUMERIC(18, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_clearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    clearance_date DATE NOT NULL,
    total_cleared NUMERIC(18, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cost Centers & Budgets
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    cost_center_name VARCHAR(255) NOT NULL,
    cost_center_number VARCHAR(100),
    parent_cost_center_id UUID REFERENCES cost_centers(id),
    is_group BOOLEAN DEFAULT false,
    disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    cost_center_id UUID REFERENCES cost_centers(id),
    fiscal_year VARCHAR(20) NOT NULL,
    monthly_distribution VARCHAR(100),
    action_if_accumulated_monthly_budget_exceeded VARCHAR(50) DEFAULT 'Warn',
    action_if_annual_budget_exceeded VARCHAR(50) DEFAULT 'Stop',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    account_id UUID,
    budget_amount NUMERIC(18, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Accounting Dimensions
CREATE TABLE IF NOT EXISTS accounting_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    fieldname VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tax Categories & Tax Rules
CREATE TABLE IF NOT EXISTS tax_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type VARCHAR(50) DEFAULT 'Sales',
    tax_template_id UUID,
    tax_category_id UUID REFERENCES tax_categories(id),
    priority INT DEFAULT 1,
    disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Credit Notes & Debit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    credit_note_no VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    total_amount NUMERIC(18, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    debit_note_no VARCHAR(100) NOT NULL UNIQUE,
    supplier_id UUID,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    total_amount NUMERIC(18, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Dunnings
CREATE TABLE IF NOT EXISTS dunnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    dunning_no VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID,
    dunning_fee NUMERIC(18, 2) DEFAULT 0.00,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
