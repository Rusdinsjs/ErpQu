use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateSalaryAssignmentRequest {
    pub employee_id: Uuid,
    pub salary_structure_id: Uuid,
    pub from_date: NaiveDate,
    pub base_salary: Decimal,
    pub tunjangan_jabatan: Option<Decimal>,
    pub tunjangan_transport: Option<Decimal>,
    pub tunjangan_makan: Option<Decimal>,
    pub ptkp_status: String,
    pub npwp_number: Option<String>,
    pub bank_name: Option<String>,
    pub bank_account: Option<String>,
    pub bank_account_holder: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RunPayrollEntryRequest {
    pub title: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub department_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct PayrollQueryParams {
    pub department_id: Option<Uuid>,
    pub status: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub employee_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateSalaryComponentRequest {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub r#type: String, // 'earning' or 'deduction'
    pub is_taxable: Option<bool>,
    pub depends_on_payment_days: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateSalaryComponentRequest {
    pub name: Option<String>,
    pub code: Option<String>,
    pub description: Option<String>,
    pub r#type: Option<String>,
    pub is_taxable: Option<bool>,
    pub depends_on_payment_days: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateSalaryStructureRequest {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub payroll_frequency: Option<String>,
    pub currency: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateSalaryStructureRequest {
    pub name: Option<String>,
    pub code: Option<String>,
    pub description: Option<String>,
    pub payroll_frequency: Option<String>,
    pub currency: Option<String>,
}
