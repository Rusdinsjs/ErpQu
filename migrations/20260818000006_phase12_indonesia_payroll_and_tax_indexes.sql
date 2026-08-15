-- Migration: 20260818000006_phase12_indonesia_payroll_and_tax_indexes.sql
-- Purpose: Indexes for e-Faktur tax invoices, payroll period processing, and PTKP tax profiles (Fase 12)

DO $$
BEGIN
    -- 1. e-Faktur Tax Invoices index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tax_invoices' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_tax_invoices_comp_num 
            ON public.tax_invoices(company_id, tax_invoice_number);
    END IF;

    -- 2. Payroll Entries period & status index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_entries' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_payroll_entries_period 
            ON public.payroll_entries(company_id, posting_date, status);
    END IF;

    -- 3. Withholding Certificates index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'withholding_certificates' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_withholding_cert_type 
            ON public.withholding_certificates(company_id, pph_type, posting_date);
    END IF;
END $$;
