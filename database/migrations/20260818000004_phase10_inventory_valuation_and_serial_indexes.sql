-- Migration: 20260818000004_phase10_inventory_valuation_and_serial_indexes.sql
-- Purpose: Indexes for Inventory Valuation, Serial Traceability, and Bin Conservation (Fase 10)

DO $$
BEGIN
    -- 1. Stock ledger entries valuation & FIFO index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_ledger_entries' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_ledger_entries' AND column_name = 'item_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_ledger_entries' AND column_name = 'posting_time') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sle_valuation_fifo ON public.stock_ledger_entries(company_id, item_id, warehouse_id, posting_date, posting_time)';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_ledger_entries' AND column_name = 'posting_date') THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sle_valuation_fifo ON public.stock_ledger_entries(company_id, item_id, warehouse_id, posting_date)';
        ELSE
            EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sle_valuation_fifo ON public.stock_ledger_entries(company_id, item_id, warehouse_id)';
        END IF;
    END IF;

    -- 2. Serial and batch tracking index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'serial_and_batch_bundles' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'serial_and_batch_bundles' AND column_name = 'item_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_serial_bundles_item ON public.serial_and_batch_bundles(company_id, item_id, voucher_type, voucher_no)';
    END IF;

    -- 3. Warehouse bin quantity conservation index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_bins' AND column_name = 'company_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_bins' AND column_name = 'item_id') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_warehouse_bins_stock ON public.warehouse_bins(company_id, warehouse_id, item_id)';
    END IF;
END $$;
