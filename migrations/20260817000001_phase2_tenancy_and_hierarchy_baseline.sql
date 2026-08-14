-- Migration: Phase 2 Tenancy, Database & Organizational Hierarchy Baseline (QTEN-003, QDB-001, QRLS-001)

-- 1. Ensure explicit organizational hierarchy columns on all key transaction tables
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS cost_center_id UUID;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS warehouse_id UUID;

ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS cost_center_id UUID;

ALTER TABLE public.purchase_bills ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.purchase_bills ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.purchase_bills ADD COLUMN IF NOT EXISTS cost_center_id UUID;

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS cost_center_id UUID;

ALTER TABLE public.cash_bank_transactions ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.cash_bank_transactions ADD COLUMN IF NOT EXISTS branch_id UUID;

ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS warehouse_id UUID;

ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS cost_center_id UUID;

-- 2. Performance & Multi-Tenant Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_assets_company_id ON public.assets(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_branch_id ON public.assets(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_company_id ON public.sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_company_id ON public.purchase_bills(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON public.expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_bank_transactions_company_id ON public.cash_bank_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_company_id ON public.inventory_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_company_id ON public.work_orders(company_id);

-- 3. Row-Level Security (RLS) Defense-In-Depth Policies (QRLS-001)
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_bank_transactions ENABLE ROW LEVEL SECURITY;

-- Allow access if company_id matches app.current_company_id session variable or if superadmin mode is active
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'sales_invoices_tenant_policy'
    ) THEN
        CREATE POLICY sales_invoices_tenant_policy ON public.sales_invoices
        FOR ALL USING (
            company_id IS NULL
            OR company_id::text = current_setting('app.current_company_id', true)
            OR current_setting('app.is_super_admin', true) = 'true'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'purchase_bills_tenant_policy'
    ) THEN
        CREATE POLICY purchase_bills_tenant_policy ON public.purchase_bills
        FOR ALL USING (
            company_id IS NULL
            OR company_id::text = current_setting('app.current_company_id', true)
            OR current_setting('app.is_super_admin', true) = 'true'
        );
    END IF;
END $$;
