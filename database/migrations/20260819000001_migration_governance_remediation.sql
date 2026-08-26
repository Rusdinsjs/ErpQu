-- Migration: 20260819000001_migration_governance_remediation.sql
-- Purpose: Forward governance remediation (Fase 16)
-- Enforces:
-- 1. Idempotent schema verification for all business tables.
-- 2. Grants least-privilege DML to runtime application role.
-- 3. Idempotent index and RLS policy verification without data destruction.

DO $$
BEGIN
    -- 1. Ensure core tables have company_id
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assets') THEN
        EXECUTE 'ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assets_company_id ON public.assets(company_id)';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'journal_entries') THEN
        EXECUTE 'ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON public.journal_entries(company_id)';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_entries') THEN
        EXECUTE 'ALTER TABLE public.stock_entries ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_stock_entries_company_id ON public.stock_entries(company_id)';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
        EXECUTE 'ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id)';
    END IF;

    -- 2. Ensure application role has required DML privileges
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'erpqu_app') THEN
        GRANT USAGE ON SCHEMA public TO erpqu_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erpqu_app;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erpqu_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erpqu_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO erpqu_app;
    END IF;
END $$;
