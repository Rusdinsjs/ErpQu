-- Migration: Add Performance Indexes for HR, Finance, Assets, and Operations FKs
-- Date: 2026-08-16

-- HR Indexes
CREATE INDEX IF NOT EXISTS idx_hr_driver_assignments_emp_id ON hr_driver_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_driver_assignments_asset_id ON hr_driver_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_hr_p2h_inspections_emp_id ON hr_p2h_inspections(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_p2h_inspections_asset_id ON hr_p2h_inspections(asset_id);
CREATE INDEX IF NOT EXISTS idx_hr_driver_safety_incidents_emp_id ON hr_driver_safety_incidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_vehicle_handovers_asset_id ON hr_vehicle_handovers(asset_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Finance & Accounting Indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_id ON journal_entry_items(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_asset_expenses_asset_id ON asset_expenses(asset_id);

-- Asset & Ops Indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_asset_id ON fuel_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_driver_id ON fuel_logs(driver_id);
