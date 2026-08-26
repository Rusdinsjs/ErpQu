-- Add company_id to hr.employees for User-Company relationship
-- The company of a user is determined by their linked employee record

ALTER TABLE hr.employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

-- Backfill existing employees with default company
UPDATE hr.employees SET company_id = (SELECT id FROM companies ORDER BY created_at LIMIT 1) WHERE company_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON hr.employees(company_id);
