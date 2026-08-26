-- Migration: 20260822000002_strict_rls_remove_null_allowance.sql
-- Purpose: Drop old lenient RLS policies from migration 20260817 that allowed company_id IS NULL.
-- The strict policies from migration 20260820000001 are already in place (no IS NULL allowance).
-- This cleanup ensures no conflicting policies coexist.

DO $$
DECLARE
    t text;
    old_policy_tables text[] := ARRAY[
        'assets',
        'maintenance_work_orders',
        'rental_contracts',
        'purchase_bills',
        'purchase_orders',
        'purchase_quotes',
        'purchase_receipts',
        'sales_invoices',
        'sales_orders',
        'sales_quotes',
        'sales_shipments',
        'expenses',
        'journal_entries',
        'gl_entries',
        'payment_entries',
        'stock_entries',
        'stock_ledger_entries',
        'warehouse_bins',
        'inventory_items',
        'payroll_entries',
        'fiscal_years',
        'clients',
        'vendors',
        'work_order_parts',
        'asset_custody_histories',
        'asset_depreciation_schedules',
        'asset_transfers',
        'asset_impairments',
        'asset_disposals',
        'uploads'
    ];
BEGIN
    FOREACH t IN ARRAY old_policy_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Drop any old lenient policy names (from phase2 tenancy baseline migration)
            EXECUTE format('DROP POLICY IF EXISTS %I_tenant_policy ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS rls_policy_%I ON public.%I', t, t);
            
            -- Ensure ONLY the strict policy exists (created by 20260820000001)
            -- Verify strict policy is active
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = t AND schemaname = 'public' 
                AND policyname = t || '_strict_tenant_isolation_policy'
            ) THEN
                -- Re-create strict policy if somehow missing
                EXECUTE format('CREATE POLICY %I_strict_tenant_isolation_policy ON public.%I
                    FOR ALL
                    USING (
                        company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                        OR current_setting(''app.is_super_tenant'', true) = ''true''
                    )
                    WITH CHECK (
                        company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid
                        OR current_setting(''app.is_super_tenant'', true) = ''true''
                    )', t, t);
            END IF;
        END IF;
    END LOOP;
END $$;
