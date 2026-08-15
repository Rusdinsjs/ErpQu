-- Migration: 20260818000001_phase6_enforce_strict_tenant_rls_and_indexes.sql
-- Purpose: Enforce strict company-scoped RLS policies, B-Tree indexes, and tenancy constraints (Fase 6)

DO $$
BEGIN
    -- 1. Journal Entries
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'journal_entries') THEN
        EXECUTE 'ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON public.journal_entries(company_id)';
        EXECUTE 'ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS journal_entries_tenant_isolation_policy ON public.journal_entries';
        EXECUTE 'CREATE POLICY journal_entries_tenant_isolation_policy ON public.journal_entries
            FOR ALL
            USING (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )
            WITH CHECK (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )';
    END IF;

    -- 2. General Ledger Entries
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'general_ledger_entries') THEN
        EXECUTE 'ALTER TABLE public.general_ledger_entries ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_general_ledger_entries_company_id ON public.general_ledger_entries(company_id)';
        EXECUTE 'ALTER TABLE public.general_ledger_entries ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS general_ledger_tenant_isolation_policy ON public.general_ledger_entries';
        EXECUTE 'CREATE POLICY general_ledger_tenant_isolation_policy ON public.general_ledger_entries
            FOR ALL
            USING (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )';
    END IF;

    -- 3. Payment Entries
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_entries') THEN
        EXECUTE 'ALTER TABLE public.payment_entries ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_entries_company_id ON public.payment_entries(company_id)';
        EXECUTE 'ALTER TABLE public.payment_entries ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS payment_entries_tenant_isolation_policy ON public.payment_entries';
        EXECUTE 'CREATE POLICY payment_entries_tenant_isolation_policy ON public.payment_entries
            FOR ALL
            USING (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )
            WITH CHECK (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )';
    END IF;

    -- 4. Purchase Orders
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
        EXECUTE 'ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id)';
        EXECUTE 'ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS purchase_orders_tenant_isolation_policy ON public.purchase_orders';
        EXECUTE 'CREATE POLICY purchase_orders_tenant_isolation_policy ON public.purchase_orders
            FOR ALL
            USING (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )
            WITH CHECK (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )';
    END IF;

    -- 5. Stock Entries & Stock Ledger
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_entries') THEN
        EXECUTE 'ALTER TABLE public.stock_entries ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stock_entries_company_id ON public.stock_entries(company_id)';
        EXECUTE 'ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS stock_entries_tenant_isolation_policy ON public.stock_entries';
        EXECUTE 'CREATE POLICY stock_entries_tenant_isolation_policy ON public.stock_entries
            FOR ALL
            USING (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )
            WITH CHECK (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )';
    END IF;

    -- 6. Payroll Entries
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payroll_entries') THEN
        EXECUTE 'ALTER TABLE public.payroll_entries ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payroll_entries_company_id ON public.payroll_entries(company_id)';
        EXECUTE 'ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS payroll_entries_tenant_isolation_policy ON public.payroll_entries';
        EXECUTE 'CREATE POLICY payroll_entries_tenant_isolation_policy ON public.payroll_entries
            FOR ALL
            USING (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )
            WITH CHECK (
                company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                OR current_setting(''app.is_super_tenant'', true) = ''true''
            )';
    END IF;
END $$;
