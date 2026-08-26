-- Migration: Add Performance Indexes for HR, Finance, Assets, and Operations FKs
-- Date: 2026-08-16

SET search_path TO public, hr, crm, rental, inventory, commercial;

-- HR Indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_driver_assignments' AND column_name = 'employee_id') THEN
        CREATE INDEX IF NOT EXISTS idx_hr_driver_assignments_emp_id ON hr_driver_assignments(employee_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_driver_assignments' AND column_name = 'asset_id') THEN
        CREATE INDEX IF NOT EXISTS idx_hr_driver_assignments_asset_id ON hr_driver_assignments(asset_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_p2h_inspections' AND column_name = 'employee_id') THEN
        CREATE INDEX IF NOT EXISTS idx_hr_p2h_inspections_emp_id ON hr_p2h_inspections(employee_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_p2h_inspections' AND column_name = 'asset_id') THEN
        CREATE INDEX IF NOT EXISTS idx_hr_p2h_inspections_asset_id ON hr_p2h_inspections(asset_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_driver_safety_incidents' AND column_name = 'employee_id') THEN
        CREATE INDEX IF NOT EXISTS idx_hr_driver_safety_incidents_emp_id ON hr_driver_safety_incidents(employee_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_vehicle_handovers' AND column_name = 'asset_id') THEN
        CREATE INDEX IF NOT EXISTS idx_hr_vehicle_handovers_asset_id ON hr_vehicle_handovers(asset_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department_id') THEN
        CREATE INDEX IF NOT EXISTS idx_employees_dept_id ON employees(department_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
    END IF;
END $$;

-- Finance & Accounting Indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'company_id') THEN
        CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON journal_entries(company_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entry_items' AND column_name = 'journal_entry_id') THEN
        CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_id ON journal_entry_items(journal_entry_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asset_expenses' AND column_name = 'asset_id') THEN
        CREATE INDEX IF NOT EXISTS idx_asset_expenses_asset_id ON asset_expenses(asset_id);
    END IF;
END $$;

-- Asset & Ops Indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'asset_id') THEN
        CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'assigned_to') THEN
        CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fuel_logs' AND column_name = 'asset_id') THEN
        CREATE INDEX IF NOT EXISTS idx_fuel_logs_asset_id ON fuel_logs(asset_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fuel_logs' AND column_name = 'driver_id') THEN
        CREATE INDEX IF NOT EXISTS idx_fuel_logs_driver_id ON fuel_logs(driver_id);
    END IF;
END $$;
