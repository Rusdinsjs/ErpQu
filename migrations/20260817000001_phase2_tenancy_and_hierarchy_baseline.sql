-- Migration: Phase 2 Tenancy, Database & Organizational Hierarchy Baseline (QTEN-003, QDB-001, QRLS-001)

DO $$
BEGIN
    -- 1. assets
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assets') THEN
        EXECUTE 'ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS branch_id UUID';
        EXECUTE 'ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS cost_center_id UUID';
        EXECUTE 'ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS warehouse_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assets_company_id ON public.assets(company_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assets_branch_id ON public.assets(branch_id)';
    END IF;

    -- 2. sales_invoices
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_invoices') THEN
        EXECUTE 'ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS branch_id UUID';
        EXECUTE 'ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS cost_center_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_company_id ON public.sales_invoices(company_id)';
        EXECUTE 'ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY';
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sales_invoices_tenant_policy') THEN
            EXECUTE 'CREATE POLICY sales_invoices_tenant_policy ON public.sales_invoices FOR ALL USING (company_id IS NULL OR company_id::text = current_setting(''app.current_company_id'', true) OR current_setting(''app.is_super_admin'', true) = ''true'')';
        END IF;
    END IF;

    -- 3. purchase_bills
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_bills') THEN
        EXECUTE 'ALTER TABLE public.purchase_bills ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'ALTER TABLE public.purchase_bills ADD COLUMN IF NOT EXISTS branch_id UUID';
        EXECUTE 'ALTER TABLE public.purchase_bills ADD COLUMN IF NOT EXISTS cost_center_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_purchase_bills_company_id ON public.purchase_bills(company_id)';
        EXECUTE 'ALTER TABLE public.purchase_bills ENABLE ROW LEVEL SECURITY';
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_bills_tenant_policy') THEN
            EXECUTE 'CREATE POLICY purchase_bills_tenant_policy ON public.purchase_bills FOR ALL USING (company_id IS NULL OR company_id::text = current_setting(''app.current_company_id'', true) OR current_setting(''app.is_super_admin'', true) = ''true'')';
        END IF;
    END IF;

    -- 4. expenses
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
        EXECUTE 'ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS branch_id UUID';
        EXECUTE 'ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS cost_center_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON public.expenses(company_id)';
        EXECUTE 'ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY';
    END IF;

    -- 5. cash_bank_transactions
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cash_bank_transactions') THEN
        EXECUTE 'ALTER TABLE public.cash_bank_transactions ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'ALTER TABLE public.cash_bank_transactions ADD COLUMN IF NOT EXISTS branch_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cash_bank_transactions_company_id ON public.cash_bank_transactions(company_id)';
        EXECUTE 'ALTER TABLE public.cash_bank_transactions ENABLE ROW LEVEL SECURITY';
    END IF;

    -- 6. inventory_movements
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_movements') THEN
        EXECUTE 'ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS branch_id UUID';
        EXECUTE 'ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS warehouse_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_inventory_movements_company_id ON public.inventory_movements(company_id)';
    END IF;

    -- 7. work_orders
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_orders') THEN
        EXECUTE 'ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS company_id UUID';
        EXECUTE 'ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS branch_id UUID';
        EXECUTE 'ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS cost_center_id UUID';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_work_orders_company_id ON public.work_orders(company_id)';
    END IF;
END $$;
