-- Migration: 20260818000006_phase12_indonesia_payroll_and_tax_indexes.sql
-- Purpose: Indexes for Indonesian e-Faktur and Payroll Statutory Processing (Fase 12)

DO $$
BEGIN
    -- 1. e-Faktur Pajak Keluaran/Masukan query index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'id_tax_invoices' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'id_tax_invoices' AND column_name = 'faktur_number') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_id_tax_invoices_faktur ON public.id_tax_invoices(company_id, faktur_number, tax_period, tax_year)';
    END IF;

    -- 2. Payroll slip employee tax & BPJS calculation index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_slips' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_slips' AND column_name = 'employee_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_salary_slips_emp_period ON public.salary_slips(company_id, employee_id, start_date, end_date)';
    END IF;
END $$;
