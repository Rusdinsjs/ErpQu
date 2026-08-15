-- Migration: 20260818000002_phase8_immutable_gl_triggers_and_constraints.sql
-- Purpose: Database-level immutability triggers, check constraints, and reporting indexes (Fase 8)

-- 1. Create or replace trigger function to block UPDATE and DELETE on posted GL entries
CREATE OR REPLACE FUNCTION prevent_gl_entry_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'IMMUTABILITY VIOLATION: General ledger entries are strictly append-only. UPDATE and DELETE operations are forbidden. Issue an explicit reversal voucher instead.';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- 2. Attach immutability trigger to general_ledger_entries
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'general_ledger_entries') THEN
        DROP TRIGGER IF EXISTS trg_prevent_gl_entry_mutation ON public.general_ledger_entries;
        CREATE TRIGGER trg_prevent_gl_entry_mutation
            BEFORE UPDATE OR DELETE ON public.general_ledger_entries
            FOR EACH ROW
            EXECUTE FUNCTION prevent_gl_entry_mutation();

        -- 3. Composite reporting index: (company_id, posting_date, account_id)
        CREATE INDEX IF NOT EXISTS idx_gl_company_posting_account 
            ON public.general_ledger_entries(company_id, posting_date, account_id);
    END IF;

    -- 4. Attach immutability trigger to gl_entries if present
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gl_entries') THEN
        DROP TRIGGER IF EXISTS trg_prevent_gl_entries_mutation ON public.gl_entries;
        CREATE TRIGGER trg_prevent_gl_entries_mutation
            BEFORE UPDATE OR DELETE ON public.gl_entries
            FOR EACH ROW
            EXECUTE FUNCTION prevent_gl_entry_mutation();

        CREATE INDEX IF NOT EXISTS idx_gl_entries_company_posting_account 
            ON public.gl_entries(company_id, posting_date, account_id);
    END IF;
END $$;
