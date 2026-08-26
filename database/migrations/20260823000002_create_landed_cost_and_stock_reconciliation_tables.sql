-- Migration: 20260823000002_create_landed_cost_and_stock_reconciliation_tables.sql
-- Purpose: Support Landed Cost Vouchers (allocating freight/duties onto stock valuation layers) and Stock Reconciliations.

CREATE TABLE IF NOT EXISTS public.landed_cost_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    voucher_number VARCHAR(100) NOT NULL UNIQUE,
    posting_date DATE NOT NULL,
    total_charges DECIMAL(18,4) NOT NULL DEFAULT 0,
    distribute_by VARCHAR(30) NOT NULL DEFAULT 'QTY', -- QTY, AMOUNT, WEIGHT
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.landed_cost_taxes_and_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.landed_cost_vouchers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    expense_account_id UUID NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(18,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.landed_cost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.landed_cost_vouchers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    receipt_document_type VARCHAR(50) NOT NULL, -- Purchase Receipt, Stock Entry
    receipt_document_id UUID NOT NULL,
    item_id UUID NOT NULL,
    qty DECIMAL(18,4) NOT NULL,
    base_amount DECIMAL(18,4) NOT NULL,
    applicable_charges DECIMAL(18,4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.stock_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    reconciliation_number VARCHAR(100) NOT NULL UNIQUE,
    posting_date DATE NOT NULL,
    posting_time TIME NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'Stock Reconciliation',
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    expense_account_id UUID NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_reconciliation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id UUID NOT NULL REFERENCES public.stock_reconciliations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    qty_on_hand DECIMAL(18,4) NOT NULL,
    real_qty DECIMAL(18,4) NOT NULL,
    valuation_rate DECIMAL(18,4) NOT NULL,
    amount_difference DECIMAL(18,4) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_landed_cost_vouchers_company ON public.landed_cost_vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_reconciliations_company ON public.stock_reconciliations(company_id);

ALTER TABLE public.landed_cost_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landed_cost_vouchers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reconciliations FORCE ROW LEVEL SECURITY;

CREATE POLICY landed_cost_vouchers_isolation ON public.landed_cost_vouchers
    FOR ALL USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid OR current_setting('app.is_super_tenant', true) = 'true');

CREATE POLICY stock_reconciliations_isolation ON public.stock_reconciliations
    FOR ALL USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid OR current_setting('app.is_super_tenant', true) = 'true');
