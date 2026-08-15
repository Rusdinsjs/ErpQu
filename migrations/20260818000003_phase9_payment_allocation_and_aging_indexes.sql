-- Migration: 20260818000003_phase9_payment_allocation_and_aging_indexes.sql
-- Purpose: Indexes for AR/AP aging reports, credit limits, and payment allocations (Fase 9)

DO $$
BEGIN
    -- 1. Sales Invoices aging & customer balance index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales_invoices') THEN
        CREATE INDEX IF NOT EXISTS idx_sales_invoices_aging 
            ON public.sales_invoices(company_id, customer_id, due_date, status);
    END IF;

    -- 2. Purchase Invoices / Bills aging & vendor balance index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_invoices') THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_invoices_aging 
            ON public.purchase_invoices(company_id, vendor_id, due_date, status);
    END IF;

    -- 3. Payment Allocations check constraint
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_allocations') THEN
        CREATE INDEX IF NOT EXISTS idx_payment_allocations_ref 
            ON public.payment_allocations(payment_entry_id, invoice_id);
    END IF;

    -- 4. Bank transactions reconciliation index
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bank_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_bank_trans_reconciliation 
            ON public.bank_transactions(company_id, bank_account_id, transaction_date, is_reconciled);
    END IF;
END $$;
