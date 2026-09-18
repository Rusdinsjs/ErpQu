-- Granular permissions for canonical HR transaction actions.
-- The route-action registry and default-deny middleware use these exact codes.

INSERT INTO permissions (code, name, description, resource, action) VALUES
    ('attendance.create', 'Check in/out', 'Create attendance transactions', 'attendance', 'create'),
    ('attendance.read', 'Read Attendance', 'Read attendance records', 'attendance', 'read'),
    ('leave_application.create', 'Create Leave Application', 'Submit a leave application', 'leave_application', 'create'),
    ('leave_application.read', 'Read Leave Applications', 'Read leave applications', 'leave_application', 'read'),
    ('leave_application.approve', 'Approve Leave Application', 'Approve a pending leave application', 'leave_application', 'approve'),
    ('leave_application.reject', 'Reject Leave Application', 'Reject a pending leave application', 'leave_application', 'reject'),
    ('expense_claim.create', 'Create Expense Claim', 'Submit an expense claim', 'expense_claim', 'create'),
    ('expense_claim.read', 'Read Expense Claims', 'Read expense claims', 'expense_claim', 'read'),
    ('expense_claim.approve', 'Approve Expense Claim', 'Approve a pending expense claim', 'expense_claim', 'approve'),
    ('expense_claim.reject', 'Reject Expense Claim', 'Reject a pending expense claim', 'expense_claim', 'reject'),
    ('expense_claim.pay', 'Pay Expense Claim', 'Mark an approved expense claim as paid', 'expense_claim', 'pay'),
    ('employee_loan.create', 'Create Employee Loan', 'Submit an employee loan request', 'employee_loan', 'create'),
    ('employee_loan.read', 'Read Employee Loans', 'Read employee loan requests', 'employee_loan', 'read'),
    ('employee_loan.approve', 'Approve Employee Loan', 'Approve a pending employee loan', 'employee_loan', 'approve'),
    ('employee_loan.reject', 'Reject Employee Loan', 'Reject a pending employee loan', 'employee_loan', 'reject'),
    ('employee_loan.disburse', 'Disburse Employee Loan', 'Disburse an approved employee loan', 'employee_loan', 'disburse'),
    ('workflow_action.approve', 'Apply Workflow Action', 'Apply a configured workflow transition', 'workflow_action', 'approve')
ON CONFLICT (code) DO NOTHING;

-- HR managers and managers may review HR submissions. The admin role is
-- intentionally explicit; wildcard permissions do not bypass sensitive actions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'attendance.read',
    'leave_application.read', 'leave_application.approve', 'leave_application.reject',
    'expense_claim.read', 'expense_claim.approve', 'expense_claim.reject', 'expense_claim.pay',
    'employee_loan.read', 'employee_loan.approve', 'employee_loan.reject', 'employee_loan.disburse',
    'workflow_action.approve'
)
WHERE r.code IN ('admin', 'manager', 'hr_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'attendance.create', 'attendance.read',
    'leave_application.create', 'leave_application.read',
    'expense_claim.create', 'expense_claim.read',
    'employee_loan.create', 'employee_loan.read'
)
WHERE r.code IN ('admin', 'manager', 'hr_manager', 'staff', 'user')
ON CONFLICT (role_id, permission_id) DO NOTHING;
