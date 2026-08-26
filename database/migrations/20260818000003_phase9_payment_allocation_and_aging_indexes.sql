-- Migration: 20260818000003_phase9_payment_allocation_and_aging_indexes.sql
-- Purpose: Indexes for AR/AP aging reports, credit limits, and payment allocations (Fase 9)

DO $$
BEGIN
    -- 1. Sales Invoices aging index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'customer_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_aging ON public.sales_invoices(company_id, customer_id, due_date, status)';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_invoices' AND column_name = 'client_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sales_invoices_aging ON public.sales_invoices(company_id, client_id, due_date, status)';
    END IF;

    -- 2. Purchase Invoices / Bills aging index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_invoices' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_invoices' AND column_name = 'vendor_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_purchase_invoices_aging ON public.purchase_invoices(company_id, vendor_id, due_date, status)';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_bills' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_bills' AND column_name = 'vendor_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_purchase_bills_aging ON public.purchase_bills(company_id, vendor_id, due_date, status)';
    END IF;

    -- 3. Payment Allocations index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_allocations' AND column_name = 'payment_entry_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_allocations' AND column_name = 'invoice_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_allocations_ref ON public.payment_allocations(payment_entry_id, invoice_id)';
    END IF;

    -- 4. Bank transactions reconciliation index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_transactions' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_transactions' AND column_name = 'bank_account_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bank_trans_reconciliation ON public.bank_transactions(company_id, bank_account_id, transaction_date, is_reconciled)';
    END IF;
END $$;
