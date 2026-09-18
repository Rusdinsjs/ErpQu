-- Ensure HR transactions inherit company scope from their employee.
-- The canonical DocType/RLS migration adds company_id to legacy HR tables,
-- while existing HR create services intentionally identify the employee only.
-- This trigger keeps those APIs compatible without allowing a caller to assign
-- a transaction to a different company than its employee.

CREATE OR REPLACE FUNCTION public.set_hr_transaction_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, hr
AS $$
DECLARE
    employee_company_id uuid;
BEGIN
    SELECT e.company_id
      INTO employee_company_id
      FROM hr.employees e
     WHERE e.id = NEW.employee_id;

    IF employee_company_id IS NULL THEN
        RAISE EXCEPTION 'Employee % has no company assignment', NEW.employee_id
            USING ERRCODE = '23514';
    END IF;

    NEW.company_id := employee_company_id;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_hr_transaction_company_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_hr_transaction_company_id() TO erpqu_app;

CREATE INDEX IF NOT EXISTS idx_hr_attendance_records_company_id
    ON hr.attendance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_applications_company_id
    ON public.hr_leave_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_expense_claims_company_id
    ON public.hr_expense_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_employee_loans_company_id
    ON public.hr_employee_loans(company_id);

DROP TRIGGER IF EXISTS set_hr_transaction_company_id ON hr.attendance_records;
CREATE TRIGGER set_hr_transaction_company_id
    BEFORE INSERT OR UPDATE OF employee_id ON hr.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_transaction_company_id();

DROP TRIGGER IF EXISTS set_hr_transaction_company_id ON public.hr_leave_applications;
CREATE TRIGGER set_hr_transaction_company_id
    BEFORE INSERT OR UPDATE OF employee_id ON public.hr_leave_applications
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_transaction_company_id();

DROP TRIGGER IF EXISTS set_hr_transaction_company_id ON public.hr_expense_claims;
CREATE TRIGGER set_hr_transaction_company_id
    BEFORE INSERT OR UPDATE OF employee_id ON public.hr_expense_claims
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_transaction_company_id();

DROP TRIGGER IF EXISTS set_hr_transaction_company_id ON public.hr_employee_loans;
CREATE TRIGGER set_hr_transaction_company_id
    BEFORE INSERT OR UPDATE OF employee_id ON public.hr_employee_loans
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_transaction_company_id();
