use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrSalaryComponent {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub r#type: String, // 'earning' or 'deduction'
    pub is_taxable: bool,
    pub depends_on_payment_days: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrSalaryStructure {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub payroll_frequency: String,
    pub currency: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrSalaryAssignment {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub salary_structure_id: Uuid,
    pub from_date: NaiveDate,
    pub base_salary: Decimal,
    pub tunjangan_jabatan: Decimal,
    pub tunjangan_transport: Decimal,
    pub tunjangan_makan: Decimal,
    pub ptkp_status: String,
    pub has_npwp: bool,
    pub npwp_number: Option<String>,
    pub bpjs_kes_number: Option<String>,
    pub bpjs_tk_number: Option<String>,
    pub bank_name: Option<String>,
    pub bank_account: Option<String>,
    pub bank_account_holder: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub department_name: Option<String>,
    #[sqlx(default)]
    pub salary_structure_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrPayrollEntry {
    pub id: Uuid,
    pub posting_date: NaiveDate,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub department_id: Option<Uuid>,
    pub title: String,
    pub status: String,
    pub total_gross_pay: Decimal,
    pub total_deductions: Decimal,
    pub total_net_pay: Decimal,
    pub total_employees: i32,
    pub processed_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub department_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrSalarySlip {
    pub id: Uuid,
    pub payroll_entry_id: Option<Uuid>,
    pub employee_id: Uuid,
    pub posting_date: NaiveDate,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    
    // Earnings
    pub base_salary: Decimal,
    pub tunjangan_jabatan: Decimal,
    pub tunjangan_transport: Decimal,
    pub tunjangan_makan: Decimal,
    pub overtime_hours: Decimal,
    pub overtime_pay: Decimal,
    pub other_earnings: Decimal,
    pub gross_pay: Decimal,
    
    // BPJS
    pub bpjs_kes_employee: Decimal,
    pub bpjs_kes_company: Decimal,
    pub bpjs_jht_employee: Decimal,
    pub bpjs_jht_company: Decimal,
    pub bpjs_jp_employee: Decimal,
    pub bpjs_jp_company: Decimal,
    pub bpjs_jkk_company: Decimal,
    pub bpjs_jkm_company: Decimal,
    
    // PPh 21 TER
    pub ptkp_status: String,
    pub pph21_ter_category: String,
    pub pph21_ter_rate: Decimal,
    pub pph21_amount: Decimal,
    
    // Deductions & Net
    pub kasbon_deduction: Decimal,
    pub unpaid_leave_deduction: Decimal,
    pub total_deductions: Decimal,
    pub net_pay: Decimal,
    
    // Status & Bank
    pub status: String,
    pub bank_name: Option<String>,
    pub bank_account: Option<String>,
    pub bank_account_holder: Option<String>,
    pub payment_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub department_name: Option<String>,
}
