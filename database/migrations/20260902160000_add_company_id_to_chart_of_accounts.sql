-- QSEC-COA-001: Add company_id to chart_of_accounts for multi-tenant isolation
-- Previously, the CoA was global across all tenants, causing data leakage.

-- 1. Add company_id column
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 2. Add is_group column if not exists (used in trial balance query)
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;

-- 3. Drop old global unique constraint on code
ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_code_key;

-- 4. Create per-company unique constraint on code
-- Allow NULL company_id for legacy/template accounts during migration
CREATE UNIQUE INDEX IF NOT EXISTS uq_coa_company_code 
    ON chart_of_accounts(company_id, code) 
    WHERE company_id IS NOT NULL;

-- 5. Index for tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_coa_company_id ON chart_of_accounts(company_id);
