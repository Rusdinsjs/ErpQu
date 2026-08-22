use management_system_macros::DocType;
use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ---- LOANS & KASBON ----
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLoanType")]
pub struct HrLoanType {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub max_amount: Decimal,
    pub max_tenure_months: i32,
    pub interest_percentage: Decimal,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrEmployeeLoan")]
pub struct HrEmployeeLoan {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub loan_type_id: Uuid,
    pub loan_amount: Decimal,
    pub monthly_installment: Decimal,
    pub tenure_months: i32,
    pub start_date: NaiveDate,
    pub status: String, // 'pending', 'approved', 'disbursed', 'rejected', 'closed'
    pub total_paid: Decimal,
    pub remaining_balance: Decimal,
    pub reason: String,
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub disbursed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub loan_type_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrLoanRepaymentSchedule")]
pub struct HrLoanRepaymentSchedule {
    pub id: Uuid,
    pub loan_id: Uuid,
    pub installment_no: i32,
    pub due_date: NaiveDate,
    pub installment_amount: Decimal,
    pub paid_amount: Decimal,
    pub status: String, // 'unpaid', 'paid', 'payroll_deducted'
    pub payroll_entry_id: Option<Uuid>,
    pub paid_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ---- EXPENSE CLAIMS / REIMBURSEMENT ----
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrExpenseClaimType")]
pub struct HrExpenseClaimType {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub max_amount_per_claim: Option<Decimal>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrExpenseClaim")]
pub struct HrExpenseClaim {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub claim_type_id: Uuid,
    pub claim_date: NaiveDate,
    pub total_amount: Decimal,
    pub description: String,
    pub receipt_url: Option<String>,
    pub status: String, // 'pending', 'approved', 'rejected', 'paid', 'included_in_payroll'
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub payment_method: Option<String>,
    pub payment_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub claim_type_name: Option<String>,
}

// ---- PERFORMANCE APPRAISAL & KPI ----
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrAppraisalTemplate")]
pub struct HrAppraisalTemplate {
    pub id: Uuid,
    pub title: String,
    pub code: String,
    pub department_id: Option<Uuid>,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub department_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrAppraisalTemplateItem")]
pub struct HrAppraisalTemplateItem {
    pub id: Uuid,
    pub template_id: Uuid,
    pub kpi_criteria: String,
    pub weight_percentage: i32,
    pub target_description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrEmployeeAppraisal")]
pub struct HrEmployeeAppraisal {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub template_id: Uuid,
    pub cycle_title: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub evaluator_id: Option<Uuid>,
    pub self_score: Option<Decimal>,
    pub manager_score: Option<Decimal>,
    pub final_score: Option<Decimal>,
    pub final_rating: Option<String>,
    pub feedback: Option<String>,
    pub recommendation: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub template_title: Option<String>,
}
