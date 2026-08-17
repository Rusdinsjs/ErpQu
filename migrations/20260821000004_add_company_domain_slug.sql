-- Migration: Add domain_slug to companies for Subdomain-based Tenant Resolution (QTEN-005)

ALTER TABLE companies ADD COLUMN IF NOT EXISTS domain_slug VARCHAR(100);

-- Unique index on non-null domain_slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_domain_slug
    ON companies(LOWER(domain_slug))
    WHERE domain_slug IS NOT NULL;

-- Automatically populate domain_slug from company code if null
UPDATE companies
SET domain_slug = LOWER(code)
WHERE domain_slug IS NULL;

COMMENT ON COLUMN companies.domain_slug IS 'QTEN-005: Subdomain slug for tenant resolution (e.g. acme for acme.erpqu.com)';
