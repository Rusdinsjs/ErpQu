-- Migration: 20260822000003_enforce_company_id_not_null.sql
-- Purpose: Backfill missing company_ids (Point A4) and enforce NOT NULL.

DO $$
DECLARE
    t text;
    default_company_id uuid;
    target_tables text[] := ARRAY[
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
    -- Resolve default company for backfilling
    SELECT id INTO default_company_id 
    FROM public.companies 
    WHERE code = 'ERP-QU' OR name = 'ERP-QU' 
    LIMIT 1;

    -- Fallback to first available active company if ERP-QU doesn't exist
    IF default_company_id IS NULL THEN
        SELECT id INTO default_company_id 
        FROM public.companies 
        WHERE status = 'ACTIVE' 
        LIMIT 1;
    END IF;

    -- If no companies exist at all (e.g., fresh DB), skip backfill to avoid errors
    IF default_company_id IS NOT NULL THEN
        FOREACH t IN ARRAY target_tables LOOP
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
                -- Backfill NULLs
                EXECUTE format('UPDATE public.%I SET company_id = %L WHERE company_id IS NULL', t, default_company_id);
                
                -- Enforce NOT NULL
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET NOT NULL', t);
            END IF;
        END LOOP;
    ELSE
        -- If no default company, still try to enforce NOT NULL if tables are empty
        FOREACH t IN ARRAY target_tables LOOP
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET NOT NULL', t);
            END IF;
        END LOOP;
    END IF;
END $$;
