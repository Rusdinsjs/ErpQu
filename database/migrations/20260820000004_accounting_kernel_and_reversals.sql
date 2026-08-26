-- Migration: 20260820000004_accounting_kernel_and_reversals.sql
-- Description: Hardening Accounting Kernel, Reversal Tracking, Payment Allocations, FIFO Layers, and 3-State Period

-- 1. Extend journal_status enum
ALTER TYPE journal_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE journal_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE journal_status ADD VALUE IF NOT EXISTS 'reversed';
ALTER TYPE journal_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 2. Add audit and reversal columns to journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES users(id);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reversal_reason TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reversal_source_id UUID REFERENCES journal_entries(id);

-- 3. Fiscal Period 3-state enum
DO $$ BEGIN
    CREATE TYPE fiscal_period_status AS ENUM ('open', 'closed', 'permanently_closed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE accounting_periods ADD COLUMN IF NOT EXISTS period_status fiscal_period_status DEFAULT 'open';

-- 4. Payment Allocations Physical Table
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    payment_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    allocated_amount NUMERIC(15, 4) NOT NULL CHECK (allocated_amount > 0),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice ON public.payment_allocations(invoice_id);

-- 5. Stock FIFO Layers Table
CREATE TABLE IF NOT EXISTS public.stock_fifo_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    voucher_type VARCHAR(50) NOT NULL,
    voucher_id UUID NOT NULL,
    posting_date DATE NOT NULL,
    remaining_qty NUMERIC(15, 4) NOT NULL CHECK (remaining_qty >= 0),
    unit_cost NUMERIC(15, 4) NOT NULL CHECK (unit_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fifo_layers_item ON public.stock_fifo_layers(company_id, warehouse_id, item_id, posting_date, created_at);

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_payment_allocations ON public.payment_allocations;
CREATE POLICY tenant_isolation_payment_allocations ON public.payment_allocations
    FOR ALL
    USING (
        company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR NULLIF(current_setting('app.current_company_id', true), '') IS NULL
    );

ALTER TABLE public.stock_fifo_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_fifo_layers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_stock_fifo_layers ON public.stock_fifo_layers;
CREATE POLICY tenant_isolation_stock_fifo_layers ON public.stock_fifo_layers
    FOR ALL
    USING (
        company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR NULLIF(current_setting('app.current_company_id', true), '') IS NULL
    );
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs table is append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
