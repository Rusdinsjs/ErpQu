use chrono::{NaiveDate, Utc};
use management_system_core::shared::errors::AppError;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::{
    HrAppraisalTemplate, HrAppraisalTemplateItem, HrEmployeeAppraisal, HrEmployeeLoan,
    HrExpenseClaim, HrExpenseClaimType, HrLoanRepaymentSchedule, HrLoanType,
};
use crate::dto::{CreateAppraisalRequest, CreateExpenseClaimRequest, CreateLoanRequest};

#[derive(Clone)]
pub struct HrLoansClaimsKpiRepository {
    pool: PgPool,
}

impl HrLoansClaimsKpiRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ---- LOAN TYPES ----
    pub async fn list_loan_types(&self) -> Result<Vec<HrLoanType>, AppError> {
        sqlx::query_as::<_, HrLoanType>(
            "SELECT * FROM hr_loan_types WHERE is_active = TRUE ORDER BY name ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- EMPLOYEE LOANS ----
    pub async fn list_employee_loans(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrEmployeeLoan>, AppError> {
        sqlx::query_as::<_, HrEmployeeLoan>(
            r#"
            SELECT l.*, e.name as employee_name, e.nik as employee_nik, lt.name as loan_type_name
            FROM hr_employee_loans l
            JOIN employees e ON l.employee_id = e.id
            JOIN hr_loan_types lt ON l.loan_type_id = lt.id
            WHERE ($1::uuid IS NULL OR l.employee_id = $1)
            ORDER BY l.created_at DESC
            "#,
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_employee_loan(&self, id: Uuid) -> Result<HrEmployeeLoan, AppError> {
        sqlx::query_as::<_, HrEmployeeLoan>(
            r#"
            SELECT l.*, e.name as employee_name, e.nik as employee_nik, lt.name as loan_type_name
            FROM hr_employee_loans l
            JOIN employees e ON l.employee_id = e.id
            JOIN hr_loan_types lt ON l.loan_type_id = lt.id
            WHERE l.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Pinjaman tidak ditemukan".into()))
    }

    pub async fn create_employee_loan(
        &self,
        req: CreateLoanRequest,
        monthly_installment: Decimal,
    ) -> Result<HrEmployeeLoan, AppError> {
        sqlx::query_as::<_, HrEmployeeLoan>(
            r#"
            INSERT INTO hr_employee_loans (
                id, employee_id, loan_type_id, loan_amount, monthly_installment,
                tenure_months, start_date, status, total_paid, remaining_balance, reason
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, 'pending', 0, $3, $7
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as loan_type_name
            "#,
        )
        .bind(req.employee_id)
        .bind(req.loan_type_id)
        .bind(req.loan_amount)
        .bind(monthly_installment)
        .bind(req.tenure_months)
        .bind(req.start_date)
        .bind(&req.reason)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_loan_status(
        &self,
        id: Uuid,
        status: &str,
        approved_by: Option<Uuid>,
        rejection_reason: Option<&str>,
    ) -> Result<HrEmployeeLoan, AppError> {
        let is_disbursed = status == "disbursed";
        let is_approved = status == "approved" || is_disbursed;

        sqlx::query_as::<_, HrEmployeeLoan>(
            r#"
            UPDATE hr_employee_loans
            SET status = $2,
                approved_by = CASE WHEN $3 THEN COALESCE(approved_by, $4) ELSE approved_by END,
                approved_at = CASE WHEN $3 THEN COALESCE(approved_at, NOW()) ELSE approved_at END,
                rejection_reason = $5,
                disbursed_at = CASE WHEN $6 THEN NOW() ELSE disbursed_at END,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as loan_type_name
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(is_approved)
        .bind(approved_by)
        .bind(rejection_reason)
        .bind(is_disbursed)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_repayment_schedule(
        &self,
        loan_id: Uuid,
        installment_no: i32,
        due_date: NaiveDate,
        amount: Decimal,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO hr_loan_repayment_schedules (id, loan_id, installment_no, due_date, installment_amount, status)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'unpaid')
            ON CONFLICT (loan_id, installment_no) DO NOTHING
            "#,
        )
        .bind(loan_id)
        .bind(installment_no)
        .bind(due_date)
        .bind(amount)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn list_repayment_schedules(
        &self,
        loan_id: Uuid,
    ) -> Result<Vec<HrLoanRepaymentSchedule>, AppError> {
        sqlx::query_as::<_, HrLoanRepaymentSchedule>(
            "SELECT * FROM hr_loan_repayment_schedules WHERE loan_id = $1 ORDER BY installment_no ASC",
        )
        .bind(loan_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn get_due_loan_installment(
        &self,
        employee_id: Uuid,
        period_end: NaiveDate,
    ) -> Result<Option<(Uuid, Decimal, Uuid)>, AppError> {
        // Returns (schedule_id, installment_amount, loan_id)
        let row = sqlx::query_as::<_, (Uuid, Decimal, Uuid)>(
            r#"
            SELECT s.id, s.installment_amount, s.loan_id
            FROM hr_loan_repayment_schedules s
            JOIN hr_employee_loans l ON s.loan_id = l.id
            WHERE l.employee_id = $1
              AND l.status = 'disbursed'
              AND s.status = 'unpaid'
              AND s.due_date <= $2
            ORDER BY s.installment_no ASC LIMIT 1
            "#,
        )
        .bind(employee_id)
        .bind(period_end)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(row)
    }

    pub async fn mark_schedule_paid_by_payroll(
        &self,
        schedule_id: Uuid,
        loan_id: Uuid,
        paid_amount: Decimal,
        payroll_entry_id: Uuid,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE hr_loan_repayment_schedules
            SET status = 'payroll_deducted', paid_amount = $2, payroll_entry_id = $3, paid_at = NOW(), updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(schedule_id)
        .bind(paid_amount)
        .bind(payroll_entry_id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        sqlx::query(
            r#"
            UPDATE hr_employee_loans
            SET total_paid = total_paid + $2,
                remaining_balance = GREATEST(0, remaining_balance - $2),
                status = CASE WHEN (remaining_balance - $2) <= 0 THEN 'closed' ELSE status END,
                updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(loan_id)
        .bind(paid_amount)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(())
    }

    // ---- EXPENSE CLAIM TYPES ----
    pub async fn list_expense_claim_types(&self) -> Result<Vec<HrExpenseClaimType>, AppError> {
        sqlx::query_as::<_, HrExpenseClaimType>(
            "SELECT * FROM hr_expense_claim_types WHERE is_active = TRUE ORDER BY name ASC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- EXPENSE CLAIMS ----
    pub async fn list_expense_claims(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrExpenseClaim>, AppError> {
        sqlx::query_as::<_, HrExpenseClaim>(
            r#"
            SELECT c.*, e.name as employee_name, e.nik as employee_nik, ct.name as claim_type_name
            FROM hr_expense_claims c
            JOIN employees e ON c.employee_id = e.id
            JOIN hr_expense_claim_types ct ON c.claim_type_id = ct.id
            WHERE ($1::uuid IS NULL OR c.employee_id = $1)
            ORDER BY c.claim_date DESC
            "#,
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_expense_claim(
        &self,
        req: CreateExpenseClaimRequest,
    ) -> Result<HrExpenseClaim, AppError> {
        sqlx::query_as::<_, HrExpenseClaim>(
            r#"
            INSERT INTO hr_expense_claims (
                id, employee_id, claim_type_id, claim_date, total_amount, description, receipt_url, payment_method, status
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, COALESCE($7, 'payroll_transfer'), 'pending'
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as claim_type_name
            "#,
        )
        .bind(req.employee_id)
        .bind(req.claim_type_id)
        .bind(req.claim_date)
        .bind(req.total_amount)
        .bind(&req.description)
        .bind(&req.receipt_url)
        .bind(&req.payment_method)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn update_claim_status(
        &self,
        id: Uuid,
        status: &str,
        approved_by: Option<Uuid>,
        rejection_reason: Option<&str>,
    ) -> Result<HrExpenseClaim, AppError> {
        sqlx::query_as::<_, HrExpenseClaim>(
            r#"
            UPDATE hr_expense_claims
            SET status = $2,
                approved_by = COALESCE(approved_by, $3),
                approved_at = CASE WHEN $2 = 'approved' THEN NOW() ELSE approved_at END,
                rejection_reason = $4,
                payment_date = CASE WHEN $2 = 'paid' THEN CURRENT_DATE ELSE payment_date END,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as claim_type_name
            "#,
        )
        .bind(id)
        .bind(status)
        .bind(approved_by)
        .bind(rejection_reason)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    // ---- APPRAISAL TEMPLATES & PERFORMANCE ----
    pub async fn list_appraisal_templates(&self) -> Result<Vec<HrAppraisalTemplate>, AppError> {
        sqlx::query_as::<_, HrAppraisalTemplate>(
            r#"
            SELECT t.*, dept.name as department_name
            FROM hr_appraisal_templates t
            LEFT JOIN departments dept ON t.department_id = dept.id
            WHERE t.is_active = TRUE
            ORDER BY t.title ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn list_template_items(
        &self,
        template_id: Uuid,
    ) -> Result<Vec<HrAppraisalTemplateItem>, AppError> {
        sqlx::query_as::<_, HrAppraisalTemplateItem>(
            "SELECT * FROM hr_appraisal_template_items WHERE template_id = $1",
        )
        .bind(template_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn list_employee_appraisals(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrEmployeeAppraisal>, AppError> {
        sqlx::query_as::<_, HrEmployeeAppraisal>(
            r#"
            SELECT a.*, e.name as employee_name, e.nik as employee_nik, t.title as template_title
            FROM hr_employee_appraisals a
            JOIN employees e ON a.employee_id = e.id
            JOIN hr_appraisal_templates t ON a.template_id = t.id
            WHERE ($1::uuid IS NULL OR a.employee_id = $1)
            ORDER BY a.end_date DESC
            "#,
        )
        .bind(employee_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }

    pub async fn create_employee_appraisal(
        &self,
        req: CreateAppraisalRequest,
        evaluator_id: Option<Uuid>,
        final_score: Decimal,
        final_rating: &str,
    ) -> Result<HrEmployeeAppraisal, AppError> {
        sqlx::query_as::<_, HrEmployeeAppraisal>(
            r#"
            INSERT INTO hr_employee_appraisals (
                id, employee_id, template_id, cycle_title, start_date, end_date,
                evaluator_id, self_score, manager_score, final_score, final_rating,
                feedback, recommendation, status
            ) VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed'
            )
            RETURNING *, NULL::text as employee_name, NULL::text as employee_nik, NULL::text as template_title
            "#,
        )
        .bind(req.employee_id)
        .bind(req.template_id)
        .bind(&req.cycle_title)
        .bind(req.start_date)
        .bind(req.end_date)
        .bind(evaluator_id)
        .bind(req.self_score)
        .bind(req.manager_score)
        .bind(final_score)
        .bind(final_rating)
        .bind(&req.feedback)
        .bind(&req.recommendation)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))
    }
}
