-- QSEC-ACMAP-001: Account Mapping Configuration
-- Replaces hardcoded account codes (e.g. "1-1300", "4-1100") with per-company configurable mappings.
-- Each company can map symbolic keys to their own CoA accounts.

CREATE TABLE IF NOT EXISTS account_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    mapping_key VARCHAR(100) NOT NULL,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, mapping_key)
);

CREATE INDEX IF NOT EXISTS idx_account_mappings_company ON account_mappings(company_id);

-- Standard mapping keys:
-- ACCOUNTS_RECEIVABLE  - Piutang Usaha (was hardcoded "1-1300")
-- SALES_REVENUE        - Pendapatan Penjualan (was hardcoded "4-1100")
-- ACCOUNTS_PAYABLE     - Hutang Usaha (was hardcoded "2-1100")
-- OPERATING_EXPENSE    - Beban Operasional (was hardcoded "6-1000")
-- VAT_OUTPUT           - PPN Keluaran
-- VAT_INPUT            - PPN Masukan
-- RETAINED_EARNINGS    - Laba Ditahan

COMMENT ON TABLE account_mappings IS 'Maps symbolic account keys to actual CoA accounts per company. Eliminates hardcoded account codes in business logic.';

DROP TRIGGER IF EXISTS update_account_mappings_updated_at ON account_mappings;
CREATE TRIGGER update_account_mappings_updated_at
BEFORE UPDATE ON account_mappings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

