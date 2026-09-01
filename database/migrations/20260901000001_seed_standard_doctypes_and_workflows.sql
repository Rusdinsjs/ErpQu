-- Seed Standard Transactional DocTypes & Workflows for ERPQu 1.0

INSERT INTO doctypes (name, module, description, is_submittable) VALUES
    ('PurchaseBill', 'Purchase', 'Tagihan Pembelian dari Vendor', TRUE),
    ('MaterialRequest', 'Inventory', 'Permintaan Barang / Material Gudang', TRUE),
    ('LeaveApplication', 'HR', 'Pengajuan Cuti / Izin Karyawan', TRUE),
    ('ExpenseClaim', 'HR', 'Klaim Pengeluaran / Reimbursement', TRUE),
    ('EmployeeLoan', 'HR', 'Pengajuan Pinjaman Karyawan', TRUE),
    ('SalesOrder', 'Sales', 'Pesanan Penjualan', TRUE)
ON CONFLICT (name) DO UPDATE SET is_submittable = EXCLUDED.is_submittable;

-- Auto-seed default workflows for LeaveApplication, ExpenseClaim, and PurchaseOrder if not exists
DO $$
DECLARE
    v_admin_role_id UUID;
    v_mgr_role_id UUID;
    v_leave_dt_id UUID;
    v_expense_dt_id UUID;
    v_po_dt_id UUID;

    v_wf_leave_id UUID;
    v_wf_expense_id UUID;

    v_s_draft UUID;
    v_s_pending UUID;
    v_s_approved UUID;
    v_s_rejected UUID;
BEGIN
    SELECT id INTO v_admin_role_id FROM roles WHERE code IN ('admin', 'super_admin') LIMIT 1;
    SELECT id INTO v_mgr_role_id FROM roles WHERE code IN ('manager', 'hr_manager', 'asset_manager') LIMIT 1;

    SELECT id INTO v_leave_dt_id FROM doctypes WHERE name = 'LeaveApplication' LIMIT 1;
    SELECT id INTO v_expense_dt_id FROM doctypes WHERE name = 'ExpenseClaim' LIMIT 1;

    -- 1. Leave Application Workflow
    IF v_leave_dt_id IS NOT NULL AND v_admin_role_id IS NOT NULL THEN
        INSERT INTO workflows (workflow_name, doctype_id, is_active, document_status_field)
        VALUES ('Leave Application Approval Workflow', v_leave_dt_id, TRUE, 'workflow_state')
        ON CONFLICT (workflow_name) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_wf_leave_id;

        IF v_wf_leave_id IS NOT NULL THEN
            INSERT INTO workflow_states (workflow_id, state_name, doc_status, style_variant)
            VALUES 
                (v_wf_leave_id, 'Draft', 0, 'secondary'),
                (v_wf_leave_id, 'Pending HR Approval', 0, 'warning'),
                (v_wf_leave_id, 'Approved', 1, 'success'),
                (v_wf_leave_id, 'Rejected', 2, 'danger')
            ON CONFLICT ON CONSTRAINT uq_workflow_state_name DO NOTHING;

            SELECT id INTO v_s_draft FROM workflow_states WHERE workflow_id = v_wf_leave_id AND state_name = 'Draft';
            SELECT id INTO v_s_pending FROM workflow_states WHERE workflow_id = v_wf_leave_id AND state_name = 'Pending HR Approval';
            SELECT id INTO v_s_approved FROM workflow_states WHERE workflow_id = v_wf_leave_id AND state_name = 'Approved';
            SELECT id INTO v_s_rejected FROM workflow_states WHERE workflow_id = v_wf_leave_id AND state_name = 'Rejected';

            IF v_s_draft IS NOT NULL AND v_s_pending IS NOT NULL THEN
                INSERT INTO workflow_transitions (workflow_id, state_id, action_name, next_state_id, allowed_role_id)
                VALUES 
                    (v_wf_leave_id, v_s_draft, 'Submit for Approval', v_s_pending, v_admin_role_id),
                    (v_wf_leave_id, v_s_pending, 'Approve Leave', v_s_approved, COALESCE(v_mgr_role_id, v_admin_role_id)),
                    (v_wf_leave_id, v_s_pending, 'Reject Leave', v_s_rejected, COALESCE(v_mgr_role_id, v_admin_role_id))
                ON CONFLICT ON CONSTRAINT uq_workflow_transition DO NOTHING;
            END IF;
        END IF;
    END IF;

    -- 2. Expense Claim Workflow
    IF v_expense_dt_id IS NOT NULL AND v_admin_role_id IS NOT NULL THEN
        INSERT INTO workflows (workflow_name, doctype_id, is_active, document_status_field)
        VALUES ('Expense Claim Approval Workflow', v_expense_dt_id, TRUE, 'workflow_state')
        ON CONFLICT (workflow_name) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_wf_expense_id;

        IF v_wf_expense_id IS NOT NULL THEN
            INSERT INTO workflow_states (workflow_id, state_name, doc_status, style_variant)
            VALUES 
                (v_wf_expense_id, 'Draft', 0, 'secondary'),
                (v_wf_expense_id, 'Pending Finance Review', 0, 'warning'),
                (v_wf_expense_id, 'Approved', 1, 'success'),
                (v_wf_expense_id, 'Rejected', 2, 'danger')
            ON CONFLICT ON CONSTRAINT uq_workflow_state_name DO NOTHING;

            SELECT id INTO v_s_draft FROM workflow_states WHERE workflow_id = v_wf_expense_id AND state_name = 'Draft';
            SELECT id INTO v_s_pending FROM workflow_states WHERE workflow_id = v_wf_expense_id AND state_name = 'Pending Finance Review';
            SELECT id INTO v_s_approved FROM workflow_states WHERE workflow_id = v_wf_expense_id AND state_name = 'Approved';
            SELECT id INTO v_s_rejected FROM workflow_states WHERE workflow_id = v_wf_expense_id AND state_name = 'Rejected';

            IF v_s_draft IS NOT NULL AND v_s_pending IS NOT NULL THEN
                INSERT INTO workflow_transitions (workflow_id, state_id, action_name, next_state_id, allowed_role_id)
                VALUES 
                    (v_wf_expense_id, v_s_draft, 'Submit Claim', v_s_pending, v_admin_role_id),
                    (v_wf_expense_id, v_s_pending, 'Approve Claim', v_s_approved, COALESCE(v_mgr_role_id, v_admin_role_id)),
                    (v_wf_expense_id, v_s_pending, 'Reject Claim', v_s_rejected, COALESCE(v_mgr_role_id, v_admin_role_id))
                ON CONFLICT ON CONSTRAINT uq_workflow_transition DO NOTHING;
            END IF;
        END IF;
    END IF;
END $$;
