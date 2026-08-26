-- Migration: 20260823000001_create_bank_reconciliation_tables.sql
-- Purpose: Support Bank Statement Imports (CSV/OFX), Transaction Matching, and Reconciliation Audit History.

CREATE TABLE IF NOT EXISTS public.bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL, -- GL Cash/Bank Account ID
    statement_date DATE NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    opening_balance DECIMAL(18,4) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(18,4) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, MATCHED, RECONCILED
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_statement_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    amount DECIMAL(18,4) NOT NULL, -- Positive for Deposit, Negative for Withdrawal
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    matched_gl_entry_id UUID REFERENCES public.gl_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL,
    statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE RESTRICT,
    as_of_date DATE NOT NULL,
    statement_ending_balance DECIMAL(18,4) NOT NULL,
    gl_ending_balance DECIMAL(18,4) NOT NULL,
    unreconciled_difference DECIMAL(18,4) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    reconciled_by UUID NOT NULL,
    reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_statements_company ON public.bank_statements(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_stmt ON public.bank_statement_lines(statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_company ON public.bank_reconciliations(company_id);

ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statement_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations FORCE ROW LEVEL SECURITY;

CREATE POLICY bank_statements_strict_isolation ON public.bank_statements
    FOR ALL USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid OR current_setting('app.is_super_tenant', true) = 'true');

CREATE POLICY bank_statement_lines_strict_isolation ON public.bank_statement_lines
    FOR ALL USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid OR current_setting('app.is_super_tenant', true) = 'true');

CREATE POLICY bank_reconciliations_strict_isolation ON public.bank_reconciliations
    FOR ALL USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid OR current_setting('app.is_super_tenant', true) = 'true');
