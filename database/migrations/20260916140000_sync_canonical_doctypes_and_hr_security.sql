-- Synchronize canonical SQL DocTypes with the runtime registry and secure HR transactions.
-- This is a forward, idempotent migration. Existing business rows are preserved.

-- 1. Canonical metadata rows. Runtime startup will keep these values current.
INSERT INTO doctypes (name, module, description, is_submittable) VALUES
    ('Asset', 'Assets', 'Manajemen Aset Perusahaan', FALSE),
    ('Employee', 'HR', 'Data Karyawan & Kepegawaian', FALSE),
    ('Attendance', 'HR', 'Manajemen absensi dan kehadiran karyawan', FALSE),
    ('InventoryItem', 'Inventory', 'Stok & Barang Material', FALSE),
    ('WorkOrder', 'Maintenance', 'Perintah Kerja Pemeliharaan', TRUE),
    ('PurchaseOrder', 'Purchase', 'Pesanan Pembelian', TRUE),
    ('SalesInvoice', 'Sales', 'Faktur Penjualan', TRUE),
    ('RentalContract', 'Rentals', 'Kontrak Sewa Aset', TRUE),
    ('PurchaseBill', 'Finance', 'Tagihan Pembelian dari Vendor', TRUE),
    ('MaterialRequest', 'Inventory', 'Permintaan Barang / Material Gudang', TRUE),
    ('LeaveApplication', 'HR', 'Pengajuan cuti dan izin karyawan', TRUE),
    ('ExpenseClaim', 'HR', 'Klaim pengeluaran dan reimbursement karyawan', TRUE),
    ('EmployeeLoan', 'HR', 'Pengajuan pinjaman karyawan', TRUE),
    ('SalesOrder', 'Sales', 'Pesanan Penjualan', TRUE)
ON CONFLICT (name) DO UPDATE SET
    module = EXCLUDED.module,
    description = EXCLUDED.description,
    is_submittable = EXCLUDED.is_submittable;

-- 2. Migrate references from the old prefixed HR metadata rows created by
-- previous runtime versions, then remove the obsolete metadata aliases.
DO $$
DECLARE
    alias_row record;
    canonical_id uuid;
    legacy_id uuid;
BEGIN
    FOR alias_row IN
        SELECT * FROM (VALUES
            ('LeaveApplication'::text, 'HrLeaveApplication'::text),
            ('ExpenseClaim'::text, 'HrExpenseClaim'::text),
            ('EmployeeLoan'::text, 'HrEmployeeLoan'::text)
        ) AS aliases(canonical_name, legacy_name)
    LOOP
        SELECT id INTO canonical_id FROM doctypes WHERE name = alias_row.canonical_name;
        SELECT id INTO legacy_id FROM doctypes WHERE name = alias_row.legacy_name;

        IF canonical_id IS NOT NULL AND legacy_id IS NOT NULL THEN
            UPDATE workflows SET doctype_id = canonical_id WHERE doctype_id = legacy_id;
            UPDATE custom_docperms SET doctype_id = canonical_id WHERE doctype_id = legacy_id
              AND NOT EXISTS (
                  SELECT 1 FROM custom_docperms existing
                  WHERE existing.doctype_id = canonical_id
                    AND existing.role_id = custom_docperms.role_id
                    AND existing.permlevel = custom_docperms.permlevel
              );
            DELETE FROM custom_docperms WHERE doctype_id = legacy_id;
            DELETE FROM doctypes WHERE id = legacy_id;
        END IF;
    END LOOP;
END $$;

-- 3. Add baseline document permissions after all standard DocTypes exist.
DO $$
DECLARE
    dt record;
    admin_role uuid;
    manager_role uuid;
BEGIN
    SELECT id INTO admin_role FROM roles WHERE code IN ('admin', 'super_admin') ORDER BY CASE code WHEN 'admin' THEN 1 ELSE 2 END LIMIT 1;
    SELECT id INTO manager_role FROM roles WHERE code IN ('hr_manager', 'manager', 'asset_manager') LIMIT 1;

    FOR dt IN SELECT id FROM doctypes WHERE name IN (
        'Asset', 'Employee', 'Attendance', 'InventoryItem', 'WorkOrder',
        'PurchaseOrder', 'SalesInvoice', 'RentalContract', 'PurchaseBill',
        'MaterialRequest', 'LeaveApplication', 'ExpenseClaim', 'EmployeeLoan', 'SalesOrder'
    ) LOOP
        IF admin_role IS NOT NULL THEN
            INSERT INTO custom_docperms (
                doctype_id, role_id, permlevel, read_perm, write_perm, create_perm,
                delete_perm, submit_perm, cancel_perm, amend_perm, print_perm,
                email_perm, export_perm, import_perm, share_perm, report_perm
            ) VALUES (
                dt.id, admin_role, 0, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,
                TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
            ) ON CONFLICT ON CONSTRAINT uq_docperm_doctype_role_level DO UPDATE SET
                read_perm = TRUE, write_perm = TRUE, create_perm = TRUE, delete_perm = TRUE,
                submit_perm = TRUE, cancel_perm = TRUE, amend_perm = TRUE, print_perm = TRUE,
                email_perm = TRUE, export_perm = TRUE, import_perm = TRUE, share_perm = TRUE,
                report_perm = TRUE;
        END IF;

        IF manager_role IS NOT NULL THEN
            INSERT INTO custom_docperms (
                doctype_id, role_id, permlevel, read_perm, write_perm, create_perm,
                delete_perm, submit_perm, cancel_perm, amend_perm, print_perm,
                email_perm, export_perm, import_perm, share_perm, report_perm
            ) VALUES (
                dt.id, manager_role, 0, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE,
                TRUE, TRUE, TRUE, FALSE, TRUE, TRUE
            ) ON CONFLICT ON CONSTRAINT uq_docperm_doctype_role_level DO UPDATE SET
                read_perm = TRUE, write_perm = TRUE, create_perm = TRUE, delete_perm = FALSE,
                submit_perm = TRUE, cancel_perm = FALSE, amend_perm = TRUE, print_perm = TRUE,
                email_perm = TRUE, export_perm = TRUE, import_perm = FALSE, share_perm = TRUE,
                report_perm = TRUE;
        END IF;
    END LOOP;
END $$;

-- 4. Ensure HR transactional tables have company ownership and strict RLS.
DO $$
DECLARE
    default_company uuid;
    target_table text;
    target_schema text;
BEGIN
    SELECT id INTO default_company FROM public.companies
    WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1;

    FOREACH target_table IN ARRAY ARRAY['attendance_records', 'hr_leave_applications', 'hr_expense_claims', 'hr_employee_loans'] LOOP
        target_schema := CASE WHEN target_table = 'attendance_records' THEN 'hr' ELSE 'public' END;
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_schema = target_schema AND t.table_name = target_table
        ) THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema = target_schema
                  AND c.table_name = target_table
                  AND c.column_name = 'company_id'
            ) THEN
                EXECUTE format('ALTER TABLE %I.%I ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT', target_schema, target_table);
            END IF;

            IF default_company IS NOT NULL THEN
                IF target_table = 'attendance_records' THEN
                    EXECUTE 'UPDATE hr.attendance_records a SET company_id = e.company_id FROM hr.employees e WHERE a.employee_id = e.id AND a.company_id IS NULL';
                    EXECUTE 'UPDATE hr.attendance_records SET company_id = $1 WHERE company_id IS NULL' USING default_company;
                ELSE
                    EXECUTE format('UPDATE public.%I t SET company_id = e.company_id FROM hr.employees e WHERE t.employee_id = e.id AND t.company_id IS NULL', target_table);
                    EXECUTE format('UPDATE public.%I SET company_id = $1 WHERE company_id IS NULL', target_table) USING default_company;
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Apply policies only when the target tables exist. NULL company rows are not
-- accepted by the policy, except for super tenants; legacy rows were backfilled above.
DO $$
DECLARE
    target record;
BEGIN
    FOR target IN
        SELECT * FROM (VALUES
            ('hr'::text, 'attendance_records'::text),
            ('public'::text, 'hr_leave_applications'::text),
            ('public'::text, 'hr_expense_claims'::text),
            ('public'::text, 'hr_employee_loans'::text)
        ) AS targets(schema_name, table_name)
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_schema = target.schema_name AND t.table_name = target.table_name
        ) THEN
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', target.schema_name, target.table_name);
            EXECUTE format('DROP POLICY IF EXISTS %I_strict_tenant_isolation_policy ON %I.%I', target.table_name, target.schema_name, target.table_name);
            EXECUTE format('CREATE POLICY %I_strict_tenant_isolation_policy ON %I.%I FOR ALL USING (company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid OR current_setting(''app.is_super_tenant'', true) = ''true'') WITH CHECK (company_id = NULLIF(current_setting(''app.current_company_id'', true), '''')::uuid OR current_setting(''app.is_super_tenant'', true) = ''true'')', target.table_name, target.schema_name, target.table_name);
        END IF;
    END LOOP;
END $$;
