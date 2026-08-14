use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Loans DTO
#[derive(Debug, Deserialize, Serialize)]
pub struct CreateLoanRequest {
    pub employee_id: Uuid,
    pub loan_type_id: Uuid,
    pub loan_amount: Decimal,
    pub tenure_months: i32,
    pub start_date: NaiveDate,
    pub reason: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ReviewLoanRequest {
    pub action: String, // 'approve', 'reject', 'disburse'
    pub rejection_reason: Option<String>,
}

// Expense Claims DTO
#[derive(Debug, Deserialize, Serialize)]
pub struct CreateExpenseClaimRequest {
    pub employee_id: Uuid,
    pub claim_type_id: Uuid,
    pub claim_date: NaiveDate,
    pub total_amount: Decimal,
    pub description: String,
    pub receipt_url: Option<String>,
    pub payment_method: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ReviewExpenseClaimRequest {
    pub action: String, // 'approve', 'reject', 'mark_paid'
    pub rejection_reason: Option<String>,
}

// Appraisal DTO
#[derive(Debug, Deserialize, Serialize)]
pub struct CreateAppraisalRequest {
    pub employee_id: Uuid,
    pub template_id: Uuid,
    pub cycle_title: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub self_score: Option<Decimal>,
    pub manager_score: Option<Decimal>,
    pub feedback: Option<String>,
    pub recommendation: Option<String>,
}
