-- Migration: 20260818000004_phase10_inventory_valuation_and_serial_indexes.sql
-- Purpose: Indexes for stock ledger valuation, bin balance reconciliation, and serial tracking (Fase 10)

DO $$
BEGIN
    -- 1. Stock Ledger Entries valuation & timeline index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_ledger_entries' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_stock_ledger_val_timeline 
            ON public.stock_ledger_entries(company_id, warehouse_id, item_id, posting_date);
    END IF;

    -- 2. Serial Numbers uniqueness and company index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'serial_numbers' AND column_name = 'company_id') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_serial_nos_unique_per_company 
            ON public.serial_numbers(company_id, serial_no);
    END IF;

    -- 3. Batch Numbers tracking index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'batches' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_batch_nos_company_item 
            ON public.batches(company_id, item_id, batch_no);
    END IF;

    -- 4. Bins lookup index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bins' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_bins_lookup 
            ON public.bins(company_id, warehouse_id, item_id);
    END IF;
END $$;
