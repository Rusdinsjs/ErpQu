use management_system_core::shared::errors::AppError;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::{
    HrPayrollEntry, HrSalaryAssignment, HrSalaryComponent, HrSalarySlip, HrSalaryStructure,
};
use crate::dto::{CreateSalaryAssignmentRequest, PayrollQueryParams, RunPayrollEntryRequest};

#[derive(Clone)]
pub struct HrPayrollRepository {
    pool: PgPool,
}

impl HrPayrollRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ---- SALARY COMPONENTS ----
    pub async fn list_salary_components(&self) -> Result<Vec<HrSalaryComponent>, AppError> {
        sqlx::query_as::<_, HrSalaryComponent>(
            "SELECT * FROM hr_salary_components WHERE is_active = TRUE ORDER BY type DESC, name ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- SALARY STRUCTURES ----
    pub async fn list_salary_structures(&self) -> Result<Vec<HrSalaryStructure>, AppError> {
        sqlx::query_as::<_, HrSalaryStructure>(
            "SELECT * FROM hr_salary_structures WHERE is_active = TRUE ORDER BY name ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_salary_component(&self, id: Uuid) -> Result<HrSalaryComponent, AppError> {
        sqlx::query_as::<_, HrSalaryComponent>("SELECT * FROM hr_salary_components WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound("Komponen gaji tidak ditemukan".into()))
    }

    pub async fn create_salary_component(
        &self,
        req: crate::dto::CreateSalaryComponentRequest,
    ) -> Result<HrSalaryComponent, AppError> {
        sqlx::query_as::<_, HrSalaryComponent>(
            r#"
            INSERT INTO hr_salary_components (id, name, code, description, type, is_taxable, depends_on_payment_days)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
            RETURNING *
            "#
        )
        .bind(&req.name)
        .bind(req.code.to_uppercase())
        .bind(&req.description)
        .bind(&req.r#type)
        .bind(req.is_taxable.unwrap_or(true))
        .bind(req.depends_on_payment_days.unwrap_or(false))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_salary_component(
        &self,
        id: Uuid,
        req: crate::dto::UpdateSalaryComponentRequest,
    ) -> Result<HrSalaryComponent, AppError> {
        sqlx::query_as::<_, HrSalaryComponent>(
            r#"
            UPDATE hr_salary_components
            SET name = COALESCE($2, name),
                code = COALESCE($3, code),
                description = COALESCE($4, description),
                type = COALESCE($5, type),
                is_taxable = COALESCE($6, is_taxable),
                depends_on_payment_days = COALESCE($7, depends_on_payment_days),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(req.code.as_ref().map(|c| c.to_uppercase()))
        .bind(&req.description)
        .bind(&req.r#type)
        .bind(req.is_taxable)
        .bind(req.depends_on_payment_days)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_salary_component(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE hr_salary_components SET is_active = FALSE WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- SALARY STRUCTURE CRUD ----
    pub async fn get_salary_structure(&self, id: Uuid) -> Result<HrSalaryStructure, AppError> {
        sqlx::query_as::<_, HrSalaryStructure>("SELECT * FROM hr_salary_structures WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound("Struktur gaji tidak ditemukan".into()))
    }

    pub async fn create_salary_structure(
        &self,
        req: crate::dto::CreateSalaryStructureRequest,
    ) -> Result<HrSalaryStructure, AppError> {
        sqlx::query_as::<_, HrSalaryStructure>(
            r#"
            INSERT INTO hr_salary_structures (id, name, code, description, payroll_frequency, currency)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(&req.name)
        .bind(req.code.to_uppercase())
        .bind(&req.description)
        .bind(req.payroll_frequency.unwrap_or_else(|| "monthly".into()))
        .bind(req.currency.unwrap_or_else(|| "IDR".into()))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_salary_structure(
        &self,
        id: Uuid,
        req: crate::dto::UpdateSalaryStructureRequest,
    ) -> Result<HrSalaryStructure, AppError> {
        sqlx::query_as::<_, HrSalaryStructure>(
            r#"
            UPDATE hr_salary_structures
            SET name = COALESCE($2, name),
                code = COALESCE($3, code),
                description = COALESCE($4, description),
                payroll_frequency = COALESCE($5, payroll_frequency),
                currency = COALESCE($6, currency),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(req.code.as_ref().map(|c| c.to_uppercase()))
        .bind(&req.description)
        .bind(&req.payroll_frequency)
        .bind(&req.currency)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn delete_salary_structure(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query("UPDATE hr_salary_structures SET is_active = FALSE WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- SALARY ASSIGNMENTS ----
    pub async fn list_salary_assignments(&self) -> Result<Vec<HrSalaryAssignment>, AppError> {
        sqlx::query_as::<_, HrSalaryAssignment>(
            r#"
            SELECT a.*, e.name as employee_name, e.nik as employee_nik,
                   dept.name as department_name, s.name as salary_structure_name
            FROM hr_salary_assignments a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN departments dept ON e.department_id = dept.id
            JOIN hr_salary_structures s ON a.salary_structure_id = s.id
            WHERE a.is_active = TRUE
            ORDER BY e.name ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_assignment_by_employee(
        &self,
        employee_id: Uuid,
    ) -> Result<Option<HrSalaryAssignment>, AppError> {
        sqlx::query_as::<_, HrSalaryAssignment>(
            r#"
            SELECT a.*, e.name as employee_name, e.nik as employee_nik,
                   dept.name as department_name, s.name as salary_structure_name
            FROM hr_salary_assignments a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN departments dept ON e.department_id = dept.id
            JOIN hr_salary_structures s ON a.salary_structure_id = s.id
            WHERE a.employee_id = $1 AND a.is_active = TRUE
            ORDER BY a.from_date DESC LIMIT 1
            "#,
        )
        .bind(employee_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_salary_assignment(
        &self,
        req: CreateSalaryAssignmentRequest,
    ) -> Result<HrSalaryAssignment, AppError> {
        sqlx::query_as::<_, HrSalaryAssignment>(
            r#"
            INSERT INTO hr_salary_assignments (
                id, employee_id, salary_structure_id, from_date,
                base_salary, tunjangan_jabatan, tunjangan_transport, tunjangan_makan,
                ptkp_status, npwp_number, bank_name, bank_account, bank_account_holder
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik,
                      NULL::text as department_name, NULL::text as salary_structure_name
            "#,
        )
        .bind(req.employee_id)
        .bind(req.salary_structure_id)
        .bind(req.from_date)
        .bind(req.base_salary)
        .bind(req.tunjangan_jabatan.unwrap_or(Decimal::ZERO))
        .bind(req.tunjangan_transport.unwrap_or(Decimal::ZERO))
        .bind(req.tunjangan_makan.unwrap_or(Decimal::ZERO))
        .bind(&req.ptkp_status)
        .bind(&req.npwp_number)
        .bind(&req.bank_name)
        .bind(&req.bank_account)
        .bind(&req.bank_account_holder)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- PAYROLL ENTRIES ----
    pub async fn list_payroll_entries(&self) -> Result<Vec<HrPayrollEntry>, AppError> {
        sqlx::query_as::<_, HrPayrollEntry>(
            r#"
            SELECT pe.*, dept.name as department_name
            FROM hr_payroll_entries pe
            LEFT JOIN departments dept ON pe.department_id = dept.id
            ORDER BY pe.posting_date DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_payroll_entry(
        &self,
        req: RunPayrollEntryRequest,
        processed_by: Option<Uuid>,
    ) -> Result<HrPayrollEntry, AppError> {
        sqlx::query_as::<_, HrPayrollEntry>(
            r#"
            INSERT INTO hr_payroll_entries (
                id, posting_date, start_date, end_date, department_id, title, status, processed_by
            ) VALUES (
                uuid_generate_v4(), CURRENT_DATE, $1, $2, $3, $4, 'calculated', $5
            )
            RETURNING *, NULL::text as department_name
            "#,
        )
        .bind(req.start_date)
        .bind(req.end_date)
        .bind(req.department_id)
        .bind(&req.title)
        .bind(processed_by)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_payroll_entry_totals(
        &self,
        id: Uuid,
        gross: Decimal,
        deductions: Decimal,
        net: Decimal,
        emp_count: i32,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE hr_payroll_entries
            SET total_gross_pay = $2, total_deductions = $3, total_net_pay = $4, total_employees = $5, updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(gross)
        .bind(deductions)
        .bind(net)
        .bind(emp_count)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    // ---- SALARY SLIPS ----
    pub async fn list_salary_slips(
        &self,
        params: PayrollQueryParams,
    ) -> Result<Vec<HrSalarySlip>, AppError> {
        sqlx::query_as::<_, HrSalarySlip>(
            r#"
            SELECT s.*, e.name as employee_name, e.nik as employee_nik, dept.name as department_name
            FROM hr_salary_slips s
            JOIN employees e ON s.employee_id = e.id
            LEFT JOIN departments dept ON e.department_id = dept.id
            WHERE ($1::uuid IS NULL OR s.payroll_entry_id = $1)
              AND ($2::uuid IS NULL OR s.employee_id = $2)
              AND ($3::text IS NULL OR s.status = $3)
            ORDER BY s.posting_date DESC, e.name ASC
            "#,
        )
        .bind(params.department_id) // reused field if needed
        .bind(params.employee_id)
        .bind(params.status)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_salary_slip(&self, id: Uuid) -> Result<HrSalarySlip, AppError> {
        sqlx::query_as::<_, HrSalarySlip>(
            r#"
            SELECT s.*, e.name as employee_name, e.nik as employee_nik, dept.name as department_name
            FROM hr_salary_slips s
            JOIN employees e ON s.employee_id = e.id
            LEFT JOIN departments dept ON e.department_id = dept.id
            WHERE s.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Slip gaji tidak ditemukan".into()))
    }

    pub async fn save_salary_slip(&self, slip: &HrSalarySlip) -> Result<HrSalarySlip, AppError> {
        sqlx::query_as::<_, HrSalarySlip>(
            r#"
            INSERT INTO hr_salary_slips (
                id, payroll_entry_id, employee_id, posting_date, start_date, end_date,
                base_salary, tunjangan_jabatan, tunjangan_transport, tunjangan_makan,
                overtime_hours, overtime_pay, other_earnings, gross_pay,
                bpjs_kes_employee, bpjs_kes_company, bpjs_jht_employee, bpjs_jht_company,
                bpjs_jp_employee, bpjs_jp_company, bpjs_jkk_company, bpjs_jkm_company,
                ptkp_status, pph21_ter_category, pph21_ter_rate, pph21_amount,
                kasbon_deduction, unpaid_leave_deduction, total_deductions, net_pay,
                status, bank_name, bank_account, bank_account_holder
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10,
                $11, $12, $13, $14,
                $15, $16, $17, $18,
                $19, $20, $21, $22,
                $23, $24, $25, $26,
                $27, $28, $29, $30,
                $31, $32, $33, $34
            )
            ON CONFLICT (employee_id, start_date, end_date) DO UPDATE SET
                base_salary = EXCLUDED.base_salary,
                tunjangan_jabatan = EXCLUDED.tunjangan_jabatan,
                tunjangan_transport = EXCLUDED.tunjangan_transport,
                tunjangan_makan = EXCLUDED.tunjangan_makan,
                overtime_hours = EXCLUDED.overtime_hours,
                overtime_pay = EXCLUDED.overtime_pay,
                other_earnings = EXCLUDED.other_earnings,
                gross_pay = EXCLUDED.gross_pay,
                bpjs_kes_employee = EXCLUDED.bpjs_kes_employee,
                bpjs_kes_company = EXCLUDED.bpjs_kes_company,
                bpjs_jht_employee = EXCLUDED.bpjs_jht_employee,
                bpjs_jht_company = EXCLUDED.bpjs_jht_company,
                bpjs_jp_employee = EXCLUDED.bpjs_jp_employee,
                bpjs_jp_company = EXCLUDED.bpjs_jp_company,
                bpjs_jkk_company = EXCLUDED.bpjs_jkk_company,
                bpjs_jkm_company = EXCLUDED.bpjs_jkm_company,
                pph21_amount = EXCLUDED.pph21_amount,
                pph21_ter_rate = EXCLUDED.pph21_ter_rate,
                kasbon_deduction = EXCLUDED.kasbon_deduction,
                unpaid_leave_deduction = EXCLUDED.unpaid_leave_deduction,
                total_deductions = EXCLUDED.total_deductions,
                net_pay = EXCLUDED.net_pay,
                updated_at = NOW()
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as department_name
            "#,
        )
        .bind(slip.id)
        .bind(slip.payroll_entry_id)
        .bind(slip.employee_id)
        .bind(slip.posting_date)
        .bind(slip.start_date)
        .bind(slip.end_date)
        .bind(slip.base_salary)
        .bind(slip.tunjangan_jabatan)
        .bind(slip.tunjangan_transport)
        .bind(slip.tunjangan_makan)
        .bind(slip.overtime_hours)
        .bind(slip.overtime_pay)
        .bind(slip.other_earnings)
        .bind(slip.gross_pay)
        .bind(slip.bpjs_kes_employee)
        .bind(slip.bpjs_kes_company)
        .bind(slip.bpjs_jht_employee)
        .bind(slip.bpjs_jht_company)
        .bind(slip.bpjs_jp_employee)
        .bind(slip.bpjs_jp_company)
        .bind(slip.bpjs_jkk_company)
        .bind(slip.bpjs_jkm_company)
        .bind(&slip.ptkp_status)
        .bind(&slip.pph21_ter_category)
        .bind(slip.pph21_ter_rate)
        .bind(slip.pph21_amount)
        .bind(slip.kasbon_deduction)
        .bind(slip.unpaid_leave_deduction)
        .bind(slip.total_deductions)
        .bind(slip.net_pay)
        .bind(&slip.status)
        .bind(&slip.bank_name)
        .bind(&slip.bank_account)
        .bind(&slip.bank_account_holder)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }
}
