use chrono::{Datelike, NaiveDate};
use management_system_core::shared::errors::AppError;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::domain::entities::{
    HrAppraisalTemplate, HrAppraisalTemplateItem, HrEmployeeAppraisal, HrEmployeeLoan,
    HrExpenseClaim, HrExpenseClaimType, HrLoanRepaymentSchedule, HrLoanType,
};
use crate::dto::{
    CreateAppraisalRequest, CreateExpenseClaimRequest, CreateLoanRequest,
    ReviewExpenseClaimRequest, ReviewLoanRequest,
};
use crate::repositories::HrLoansClaimsKpiRepository;

#[derive(Clone)]
pub struct HrLoansClaimsKpiService {
    repo: HrLoansClaimsKpiRepository,
}

impl HrLoansClaimsKpiService {
    pub fn new(repo: HrLoansClaimsKpiRepository) -> Self {
        Self { repo }
    }

    // ---- LOANS ----
    pub async fn list_loan_types(&self) -> Result<Vec<HrLoanType>, AppError> {
        self.repo.list_loan_types().await
    }

    pub async fn list_employee_loans(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrEmployeeLoan>, AppError> {
        self.repo.list_employee_loans(employee_id).await
    }

    pub async fn apply_loan(
        &self,
        req: CreateLoanRequest,
        created_by: Option<Uuid>,
    ) -> Result<HrEmployeeLoan, AppError> {
        if req.tenure_months <= 0 {
            return Err(AppError::BadRequest(
                "Tenor pinjaman minimal 1 bulan".into(),
            ));
        }
        let monthly = (req.loan_amount / Decimal::from(req.tenure_months)).round_dp(0);
        let loan = self
            .repo
            .create_employee_loan(req, monthly, created_by)
            .await?;
        Ok(loan)
    }

    pub async fn review_loan(
        &self,
        id: Uuid,
        req: ReviewLoanRequest,
        reviewer_id: Option<Uuid>,
    ) -> Result<HrEmployeeLoan, AppError> {
        let loan = self.repo.get_employee_loan(id).await?;
        if loan.created_by.is_some() && loan.created_by == reviewer_id {
            return Err(AppError::Forbidden(
                "Pembuat pengajuan tidak boleh menyetujui atau mencairkan pinjaman sendiri".into(),
            ));
        }

        match req.action.as_str() {
            "approve" => {
                self.repo
                    .update_loan_status(id, "approved", reviewer_id, None)
                    .await
            }
            "disburse" => {
                if loan.status != "approved" {
                    return Err(AppError::BadRequest(
                        "Pinjaman harus berstatus approved sebelum dicairkan".into(),
                    ));
                }
                // Generate Amortization Repayment Schedule before disbursement.
                let curr_date = loan.start_date;
                for i in 1..=loan.tenure_months {
                    let due_date = Self::add_months(curr_date, i as u32);
                    self.repo
                        .create_repayment_schedule(loan.id, i, due_date, loan.monthly_installment)
                        .await?;
                }
                self.repo
                    .update_loan_status(id, "disbursed", reviewer_id, None)
                    .await
            }
            "reject" => {
                self.repo
                    .update_loan_status(
                        id,
                        "rejected",
                        reviewer_id,
                        req.rejection_reason.as_deref(),
                    )
                    .await
            }
            _ => Err(AppError::BadRequest(
                "Aksi review pinjaman tidak valid".into(),
            )),
        }
    }

    pub async fn list_repayment_schedules(
        &self,
        loan_id: Uuid,
    ) -> Result<Vec<HrLoanRepaymentSchedule>, AppError> {
        self.repo.list_repayment_schedules(loan_id).await
    }

    fn add_months(date: NaiveDate, months: u32) -> NaiveDate {
        let mut year = date.year();
        let mut month = date.month() + months;
        while month > 12 {
            year += 1;
            month -= 12;
        }
        let day = date.day().min(28); // Safe day of month
        NaiveDate::from_ymd_opt(year, month, day).unwrap_or(date)
    }

    // ---- EXPENSE CLAIMS ----
    pub async fn list_expense_claim_types(&self) -> Result<Vec<HrExpenseClaimType>, AppError> {
        self.repo.list_expense_claim_types().await
    }

    pub async fn list_expense_claims(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrExpenseClaim>, AppError> {
        self.repo.list_expense_claims(employee_id).await
    }

    pub async fn create_expense_claim(
        &self,
        req: CreateExpenseClaimRequest,
        created_by: Option<Uuid>,
    ) -> Result<HrExpenseClaim, AppError> {
        self.repo.create_expense_claim(req, created_by).await
    }

    pub async fn review_expense_claim(
        &self,
        id: Uuid,
        req: ReviewExpenseClaimRequest,
        reviewer_id: Option<Uuid>,
    ) -> Result<HrExpenseClaim, AppError> {
        let claim = self
            .repo
            .list_expense_claims(None)
            .await?
            .into_iter()
            .find(|claim| claim.id == id)
            .ok_or_else(|| AppError::NotFound("Klaim tidak ditemukan".into()))?;
        if claim.created_by.is_some() && claim.created_by == reviewer_id {
            return Err(AppError::Forbidden(
                "Pembuat klaim tidak boleh menyetujui atau membayar klaim sendiri".into(),
            ));
        }

        match req.action.as_str() {
            "approve" => {
                self.repo
                    .update_claim_status(id, "approved", reviewer_id, None)
                    .await
            }
            "mark_paid" => {
                self.repo
                    .update_claim_status(id, "paid", reviewer_id, None)
                    .await
            }
            "reject" => {
                self.repo
                    .update_claim_status(
                        id,
                        "rejected",
                        reviewer_id,
                        req.rejection_reason.as_deref(),
                    )
                    .await
            }
            _ => Err(AppError::BadRequest("Aksi review klaim tidak valid".into())),
        }
    }

    // ---- KPI APPRAISAL ----
    pub async fn list_appraisal_templates(&self) -> Result<Vec<HrAppraisalTemplate>, AppError> {
        self.repo.list_appraisal_templates().await
    }

    pub async fn list_template_items(
        &self,
        template_id: Uuid,
    ) -> Result<Vec<HrAppraisalTemplateItem>, AppError> {
        self.repo.list_template_items(template_id).await
    }

    pub async fn list_employee_appraisals(
        &self,
        employee_id: Option<Uuid>,
    ) -> Result<Vec<HrEmployeeAppraisal>, AppError> {
        self.repo.list_employee_appraisals(employee_id).await
    }

    pub async fn submit_appraisal(
        &self,
        req: CreateAppraisalRequest,
        evaluator_id: Option<Uuid>,
    ) -> Result<HrEmployeeAppraisal, AppError> {
        let mgr = req.manager_score.unwrap_or(Decimal::ZERO);
        let self_s = req.self_score.unwrap_or(Decimal::ZERO);

        let final_score = if mgr > Decimal::ZERO && self_s > Decimal::ZERO {
            ((mgr * Decimal::from(70) + self_s * Decimal::from(30)) / Decimal::from(100))
                .round_dp(1)
        } else if mgr > Decimal::ZERO {
            mgr
        } else {
            self_s
        };

        let score_f = final_score.to_f64().unwrap_or(0.0);
        let rating = if score_f >= 90.0 {
            "A"
        } else if score_f >= 80.0 {
            "B"
        } else if score_f >= 70.0 {
            "C"
        } else {
            "D"
        };

        self.repo
            .create_employee_appraisal(req, evaluator_id, final_score, rating)
            .await
    }
}
