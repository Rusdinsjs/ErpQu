-- Migration: 20260820000006_create_asset_lifecycle_and_depreciation_tables.sql
-- Description: Create tables for Asset Depreciation Schedules, Asset Transfers, Asset Impairments, Asset Disposals, and WO Settlement

-- 1. Asset Depreciation Schedules
CREATE TABLE IF NOT EXISTS public.asset_depreciation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id),
    schedule_date DATE NOT NULL,
    depreciation_amount NUMERIC(15, 4) NOT NULL CHECK (depreciation_amount >= 0),
    accumulated_depreciation NUMERIC(15, 4) NOT NULL CHECK (accumulated_depreciation >= 0),
    remaining_book_value NUMERIC(15, 4) NOT NULL CHECK (remaining_book_value >= 0),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'posted', 'cancelled'
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_depr_schedules_asset ON public.asset_depreciation_schedules(asset_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_asset_depr_schedules_status ON public.asset_depreciation_schedules(status);

-- 2. Asset Transfers
CREATE TABLE IF NOT EXISTS public.asset_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id),
    from_location_id UUID REFERENCES public.locations(id),
    to_location_id UUID REFERENCES public.locations(id),
    from_department_id UUID REFERENCES public.departments(id),
    to_department_id UUID REFERENCES public.departments(id),
    from_custodian_id UUID REFERENCES public.users(id),
    to_custodian_id UUID REFERENCES public.users(id),
    transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transferred_by UUID REFERENCES public.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset ON public.asset_transfers(asset_id);

-- 3. Asset Impairments (IAS 36 Write-down)
CREATE TABLE IF NOT EXISTS public.asset_impairments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id),
    impairment_date DATE NOT NULL,
    impairment_amount NUMERIC(15, 4) NOT NULL CHECK (impairment_amount > 0),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    reason TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_impairments_asset ON public.asset_impairments(asset_id);

-- 4. Asset Disposals (Sale / Scrapping with Gain/Loss)
CREATE TABLE IF NOT EXISTS public.asset_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id),
    disposal_date DATE NOT NULL,
    disposal_type VARCHAR(50) NOT NULL DEFAULT 'sale', -- 'sale', 'scrapping', 'trade_in'
    sale_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
    book_value NUMERIC(15, 4) NOT NULL CHECK (book_value >= 0),
    gain_loss_amount NUMERIC(15, 4) NOT NULL, -- Positive for Gain, Negative for Loss
    destination_account_id UUID REFERENCES public.chart_of_accounts(id),
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    reason TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset ON public.asset_disposals(asset_id);

-- 5. Asset Custody History Table Append-Only Enforcement
CREATE TABLE IF NOT EXISTS public.asset_custody_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    custodian_user_id UUID REFERENCES public.users(id),
    department_id UUID REFERENCES public.departments(id),
    location_id UUID REFERENCES public.locations(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_asset_custody_histories_asset ON public.asset_custody_histories(asset_id, assigned_at);

-- Append-only trigger on asset_custody_histories
CREATE OR REPLACE FUNCTION prevent_asset_custody_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'asset_custody_histories table is append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_asset_custody_history_mutation ON public.asset_custody_histories;
CREATE TRIGGER trg_prevent_asset_custody_history_mutation
BEFORE UPDATE OR DELETE ON public.asset_custody_histories
FOR EACH ROW EXECUTE FUNCTION prevent_asset_custody_history_mutation();

-- 6. Enable RLS and Grant Permissions
ALTER TABLE public.asset_depreciation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_impairments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_custody_histories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erpqu_app') THEN
        GRANT SELECT, INSERT, UPDATE ON public.asset_depreciation_schedules TO erpqu_app;
        GRANT SELECT, INSERT ON public.asset_transfers TO erpqu_app;
        GRANT SELECT, INSERT ON public.asset_impairments TO erpqu_app;
        GRANT SELECT, INSERT ON public.asset_disposals TO erpqu_app;
        GRANT SELECT, INSERT ON public.asset_custody_histories TO erpqu_app;
    END IF;
END $$;
