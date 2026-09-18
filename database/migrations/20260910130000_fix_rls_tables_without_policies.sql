-- Migration: 20260910130000_fix_rls_tables_without_policies
--
-- Problem
-- -------
-- Migrations 20260820000003 (auth sessions) and 20260820000007 (outbox DLQ /
-- job executions) enabled Row Level Security on infrastructure tables but never
-- created a policy. In PostgreSQL, "RLS enabled + zero policies" means deny-all
-- for every non-owner role. Since the runtime connects as `erpqu_app`
-- (non-superuser, no BYPASSRLS), the effect was:
--
--   * `refresh_tokens`  -> INSERT/SELECT denied. Refresh-token rotation silently
--                          failed because the handler discards the result
--                          (`let _ = sqlx::query(...)`), so every session dropped
--                          after the short-lived access token expired.
--   * `user_sessions`   -> session bookkeeping unreachable.
--   * `outbox_dlq`      -> dead-letter records unreachable, hiding failed events.
--   * `scheduled_job_executions` -> job audit history unreachable.
--   * `cash_bank_transactions`   -> had company_id but no policy either, so the
--                          cash/bank ledger was unreadable and unwritable.
--
-- These are *system* tables. Access is controlled by which user the API acts for
-- (`user_id`), not by operating company, so company-scoped tenant policies do not
-- apply. This migration grants the runtime role the privileges it needs and, for
-- tables that do carry a company/tenant column, adds a policy that preserves
-- isolation without blocking the system-level rows (which legitimately have a
-- NULL company_id).

-- 1. System tables keyed by user_id (no company column).
--    RLS here was enabled without a policy, which made them deny-all for the
--    runtime role (GRANT alone does not bypass RLS). Company isolation does not
--    apply to these rows, and the session context only exposes a company id —
--    there is no session variable to scope rows by user. The application always
--    filters by user_id explicitly, so row security is enforced at that layer.
--    We therefore disable RLS on these tables instead of leaving a dead policy.
ALTER TABLE public.refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_job_executions DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO erpqu_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO erpqu_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_job_executions TO erpqu_app;

-- 2. Tables that carry company/tenant context: keep tenant isolation, but allow
--    system-level (company_id IS NULL) rows such as DLQ entries emitted by
--    background workers that run outside a company scope.
DROP POLICY IF EXISTS outbox_dlq_tenant_isolation_policy ON public.outbox_dlq;
CREATE POLICY outbox_dlq_tenant_isolation_policy ON public.outbox_dlq
    FOR ALL
    USING (
        company_id IS NULL
        OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    )
    WITH CHECK (
        company_id IS NULL
        OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    );
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbox_dlq TO erpqu_app;

-- 3. Cash/bank ledger: legitimate business data, so apply the standard strict
--    company isolation used by the other finance tables.
DROP POLICY IF EXISTS cash_bank_transactions_strict_tenant_isolation_policy
    ON public.cash_bank_transactions;
CREATE POLICY cash_bank_transactions_strict_tenant_isolation_policy
    ON public.cash_bank_transactions
    FOR ALL
    USING (
        company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    )
    WITH CHECK (
        company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
        OR current_setting('app.is_super_tenant', true) = 'true'
    );
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_bank_transactions TO erpqu_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erpqu_app;

-- 3b. Backfill any legacy rows that predate company ownership so they do not
--     become invisible under the strict policy above.
DO $$
DECLARE
    default_company_id uuid;
BEGIN
    SELECT id INTO default_company_id
    FROM public.companies
    WHERE status = 'ACTIVE'
    ORDER BY created_at
    LIMIT 1;

    IF default_company_id IS NOT NULL THEN
        UPDATE public.cash_bank_transactions
        SET company_id = default_company_id
        WHERE company_id IS NULL;
    END IF;
END $$;

-- 4. Fail loudly if any further "RLS enabled but no policy" table is introduced.
DO $$
DECLARE
    offender text;
    offenders text := '';
BEGIN
    SELECT string_agg(n.nspname || '.' || c.relname, ', ')
    INTO offenders
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND c.relrowsecurity = true
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid);

    IF offenders IS NOT NULL THEN
        RAISE EXCEPTION 'RLS enabled without any policy on: %', offenders;
    END IF;
END $$;
