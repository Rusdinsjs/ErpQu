-- Give HR transactions an explicit workflow state separate from their
-- business status. The status columns remain machine-readable values such as
-- pending/approved/paid/disbursed; workflow_state stores the approval label.

ALTER TABLE public.hr_leave_applications
    ADD COLUMN IF NOT EXISTS workflow_state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.hr_expense_claims
    ADD COLUMN IF NOT EXISTS workflow_state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.hr_employee_loans
    ADD COLUMN IF NOT EXISTS workflow_state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

UPDATE public.hr_leave_applications
SET workflow_state = CASE status
    WHEN 'approved' THEN 'Approved'
    WHEN 'rejected' THEN 'Rejected'
    WHEN 'cancelled' THEN 'Cancelled'
    ELSE 'Pending HR Approval'
END
WHERE workflow_state IS NULL;

UPDATE public.hr_expense_claims
SET workflow_state = CASE status
    WHEN 'approved' THEN 'Approved'
    WHEN 'rejected' THEN 'Rejected'
    WHEN 'paid' THEN 'Paid'
    WHEN 'included_in_payroll' THEN 'Included in Payroll'
    ELSE 'Pending Finance Review'
END
WHERE workflow_state IS NULL;

UPDATE public.hr_employee_loans
SET workflow_state = CASE status
    WHEN 'approved' THEN 'Approved'
    WHEN 'disbursed' THEN 'Disbursed'
    WHEN 'rejected' THEN 'Rejected'
    WHEN 'closed' THEN 'Closed'
    ELSE 'Pending Loan Approval'
END
WHERE workflow_state IS NULL;

ALTER TABLE public.hr_leave_applications
    ALTER COLUMN workflow_state SET DEFAULT 'Pending HR Approval',
    ALTER COLUMN workflow_state SET NOT NULL;
ALTER TABLE public.hr_expense_claims
    ALTER COLUMN workflow_state SET DEFAULT 'Pending Finance Review',
    ALTER COLUMN workflow_state SET NOT NULL;
ALTER TABLE public.hr_employee_loans
    ALTER COLUMN workflow_state SET DEFAULT 'Pending Loan Approval',
    ALTER COLUMN workflow_state SET NOT NULL;

-- EmployeeLoan was previously handled only by bespoke endpoints. Register an
-- active workflow so generic workflow clients can discover the same lifecycle.
DO $$
DECLARE
    dt_id UUID;
    workflow_record_id UUID;
    admin_role UUID;
    manager_role UUID;
    draft_id UUID;
    pending_id UUID;
    approved_id UUID;
    rejected_id UUID;
    disbursed_id UUID;
    closed_id UUID;
BEGIN
    SELECT id INTO dt_id FROM doctypes WHERE name = 'EmployeeLoan' LIMIT 1;
    SELECT id INTO admin_role FROM roles WHERE code IN ('admin', 'super_admin') ORDER BY CASE code WHEN 'admin' THEN 1 ELSE 2 END LIMIT 1;
    SELECT id INTO manager_role FROM roles WHERE code IN ('hr_manager', 'manager', 'asset_manager') LIMIT 1;

    IF dt_id IS NOT NULL AND admin_role IS NOT NULL THEN
        INSERT INTO workflows (workflow_name, doctype_id, is_active, document_status_field)
        VALUES ('Employee Loan Approval Workflow', dt_id, TRUE, 'workflow_state')
        ON CONFLICT (workflow_name) DO UPDATE SET doctype_id = EXCLUDED.doctype_id, is_active = TRUE, updated_at = NOW()
        RETURNING id INTO workflow_record_id;

        INSERT INTO workflow_states (workflow_id, state_name, doc_status, style_variant)
        VALUES
            (workflow_record_id, 'Draft', 0, 'secondary'),
            (workflow_record_id, 'Pending Loan Approval', 0, 'warning'),
            (workflow_record_id, 'Approved', 1, 'success'),
            (workflow_record_id, 'Rejected', 2, 'danger'),
            (workflow_record_id, 'Disbursed', 1, 'primary'),
            (workflow_record_id, 'Closed', 1, 'info')
        ON CONFLICT ON CONSTRAINT uq_workflow_state_name DO UPDATE SET
            doc_status = EXCLUDED.doc_status,
            style_variant = EXCLUDED.style_variant;

        SELECT ws.id INTO draft_id FROM workflow_states ws WHERE ws.workflow_id = workflow_record_id AND ws.state_name = 'Draft';
        SELECT ws.id INTO pending_id FROM workflow_states ws WHERE ws.workflow_id = workflow_record_id AND ws.state_name = 'Pending Loan Approval';
        SELECT ws.id INTO approved_id FROM workflow_states ws WHERE ws.workflow_id = workflow_record_id AND ws.state_name = 'Approved';
        SELECT ws.id INTO rejected_id FROM workflow_states ws WHERE ws.workflow_id = workflow_record_id AND ws.state_name = 'Rejected';
        SELECT ws.id INTO disbursed_id FROM workflow_states ws WHERE ws.workflow_id = workflow_record_id AND ws.state_name = 'Disbursed';
        SELECT ws.id INTO closed_id FROM workflow_states ws WHERE ws.workflow_id = workflow_record_id AND ws.state_name = 'Closed';

        IF manager_role IS NULL THEN
            manager_role := admin_role;
        END IF;

        INSERT INTO workflow_transitions (workflow_id, state_id, action_name, next_state_id, allowed_role_id)
        VALUES
            (workflow_record_id, draft_id, 'Submit Loan', pending_id, admin_role),
            (workflow_record_id, pending_id, 'Approve Loan', approved_id, manager_role),
            (workflow_record_id, pending_id, 'Reject Loan', rejected_id, manager_role),
            (workflow_record_id, approved_id, 'Disburse Loan', disbursed_id, manager_role),
            (workflow_record_id, disbursed_id, 'Close Loan', closed_id, manager_role)
        ON CONFLICT ON CONSTRAINT uq_workflow_transition DO UPDATE SET
            next_state_id = EXCLUDED.next_state_id,
            allowed_role_id = EXCLUDED.allowed_role_id;
    END IF;
END $$;
