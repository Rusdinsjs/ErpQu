-- Migration: Multi-Currency Exchange Rate Table & GL Balance Constraint (Phase 3)
--
-- Adds:
-- 1. exchange_rates table for daily currency rates
-- 2. Database-level CHECK constraints for GL entry integrity
-- 3. Trigger to enforce debit=credit balance per voucher

-- ═══════════════════════════════════════════════════
-- 1. MULTI-CURRENCY EXCHANGE RATE TABLE
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    exchange_rate NUMERIC(18,6) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'manual',  -- 'manual', 'bank_indonesia', 'api'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    CONSTRAINT uq_exchange_rate UNIQUE (company_id, from_currency, to_currency, effective_date),
    CONSTRAINT chk_exchange_rate_positive CHECK (exchange_rate > 0),
    CONSTRAINT chk_from_to_different CHECK (from_currency != to_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup
    ON exchange_rates(company_id, from_currency, to_currency, effective_date DESC);

COMMENT ON TABLE exchange_rates IS 'Daily exchange rates for multi-currency transactions. Rate is: 1 from_currency = exchange_rate to_currency.';

-- ═══════════════════════════════════════════════════
-- 2. GL ENTRY INTEGRITY CONSTRAINTS
-- ═══════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_gl_debit_non_negative') THEN
        ALTER TABLE gl_entries ADD CONSTRAINT chk_gl_debit_non_negative CHECK (debit >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_gl_credit_non_negative') THEN
        ALTER TABLE gl_entries ADD CONSTRAINT chk_gl_credit_non_negative CHECK (credit >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_gl_debit_or_credit') THEN
        ALTER TABLE gl_entries ADD CONSTRAINT chk_gl_debit_or_credit CHECK (debit > 0 OR credit > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_gl_not_both_debit_credit') THEN
        ALTER TABLE gl_entries ADD CONSTRAINT chk_gl_not_both_debit_credit CHECK (NOT (debit > 0 AND credit > 0));
    END IF;
END $$;

-- ═══════════════════════════════════════════════════
-- 3. VOUCHER-LEVEL BALANCE ENFORCEMENT TRIGGER
-- ═══════════════════════════════════════════════════

-- This deferred constraint trigger verifies at COMMIT time that
-- all GL entries for a voucher are balanced (sum(debit) = sum(credit)).
-- Uses a deferred trigger to allow batch inserts within a transaction.

CREATE OR REPLACE FUNCTION check_voucher_balance()
RETURNS TRIGGER AS $$
DECLARE
    total_debit NUMERIC(20,4);
    total_credit NUMERIC(20,4);
BEGIN
    -- Only check for newly inserted entries (not reversals being created)
    SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
    INTO total_debit, total_credit
    FROM gl_entries
    WHERE voucher_id = NEW.voucher_id
      AND voucher_type = NEW.voucher_type
      AND company_id = NEW.company_id;

    IF total_debit != total_credit THEN
        RAISE EXCEPTION 'QACC-004 BALANCE VIOLATION: Voucher % (type: %) is unbalanced. Debit: %, Credit: %, Delta: %',
            NEW.voucher_id, NEW.voucher_type, total_debit, total_credit, (total_debit - total_credit);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create as CONSTRAINT TRIGGER (deferred)
DROP TRIGGER IF EXISTS trg_check_voucher_balance ON gl_entries;
CREATE CONSTRAINT TRIGGER trg_check_voucher_balance
    AFTER INSERT ON gl_entries
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION check_voucher_balance();

COMMENT ON TRIGGER trg_check_voucher_balance ON gl_entries IS
    'QACC-004: Database-level enforcement of double-entry balance rule. '
    'Deferred to COMMIT time to allow multi-row inserts within a transaction.';

-- ═══════════════════════════════════════════════════
-- 4. FISCAL YEAR/PERIOD CONSTRAINTS
-- ═══════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_fy_dates') THEN
        ALTER TABLE fiscal_years ADD CONSTRAINT chk_fy_dates CHECK (end_date > start_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ap_dates') THEN
        ALTER TABLE accounting_periods ADD CONSTRAINT chk_ap_dates CHECK (end_date >= start_date);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════
-- 5. AUDIT LOG IMMUTABILITY (Append-Only)
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are append-only. Updates and deletes are forbidden for compliance.';
END;
$$ LANGUAGE plpgsql;

-- Apply to audit_log if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        DROP TRIGGER IF EXISTS trg_prevent_audit_mutation ON audit_log;
        CREATE TRIGGER trg_prevent_audit_mutation
        BEFORE UPDATE OR DELETE ON audit_log
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
    END IF;
END
$$;
