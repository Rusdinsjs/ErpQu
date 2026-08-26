-- ERPQu Schema Consolidation: Remove public.employees duplicate
-- The hr.employees table is the canonical employee table.
-- The public.employees table was created by an older migration (20260806000019)
-- but has been empty (0 rows) and caused schema ambiguity errors.

-- Step 1: Drop the duplicate empty table in public schema
DROP TABLE IF EXISTS public.employees CASCADE;

-- Step 2: Create a backward-compatibility view pointing to hr.employees
-- This ensures any external tool or report that references public.employees
-- continues to work transparently.
CREATE OR REPLACE VIEW public.employees AS
SELECT * FROM hr.employees;

-- Step 3: Grant access on the view to the app user
GRANT SELECT ON public.employees TO erpqu_app;

-- Step 4: Add comment for documentation
COMMENT ON VIEW public.employees IS 
    'Backward-compatibility view pointing to hr.employees. '
    'The canonical employees table is hr.employees. '
    'Created by schema consolidation migration (Phase 1.2).';
