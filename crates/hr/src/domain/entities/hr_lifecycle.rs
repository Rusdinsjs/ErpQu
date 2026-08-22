use management_system_macros::DocType;
use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrDesignation")]
pub struct HrDesignation {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub grade: Option<String>,
    pub department_id: Option<Uuid>,
    pub is_manager: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub department_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrEmploymentType")]
pub struct HrEmploymentType {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub max_contract_years: Option<i32>,
    pub is_eligible_bpjs: bool,
    pub is_eligible_pph21: bool,
    pub is_eligible_leave: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrEmployeeLifecycle")]
pub struct HrEmployeeLifecycle {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub event_type: String,
    pub effective_date: NaiveDate,
    pub notes: Option<String>,
    pub from_designation_id: Option<Uuid>,
    pub to_designation_id: Option<Uuid>,
    pub from_department_id: Option<Uuid>,
    pub to_department_id: Option<Uuid>,
    pub from_position: Option<String>,
    pub to_position: Option<String>,
    pub from_salary: Option<Decimal>,
    pub to_salary: Option<Decimal>,
    pub warning_level: Option<String>,
    pub warning_expiry_date: Option<NaiveDate>,
    pub warning_reason: Option<String>,
    pub last_working_date: Option<NaiveDate>,
    pub exit_reason: Option<String>,
    pub exit_interview_notes: Option<String>,
    pub document_url: Option<String>,
    pub document_number: Option<String>,
    pub performed_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
    #[sqlx(default)]
    pub from_designation_name: Option<String>,
    #[sqlx(default)]
    pub to_designation_name: Option<String>,
    #[sqlx(default)]
    pub from_department_name: Option<String>,
    #[sqlx(default)]
    pub to_department_name: Option<String>,
    #[sqlx(default)]
    pub performed_by_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrEmployeeDocument")]
pub struct HrEmployeeDocument {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub document_type: String,
    pub document_name: Option<String>,
    pub document_number: Option<String>,
    pub document_url: String,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub expiry_date: Option<NaiveDate>,
    pub notes: Option<String>,
    pub uploaded_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity HrEmployeeEducation")]
pub struct HrEmployeeEducation {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub level: String,
    pub institution_name: String,
    pub major: Option<String>,
    pub graduation_year: Option<i32>,
    pub gpa: Option<Decimal>,
    pub is_highest: bool,
    pub attachment_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "HR", description = "Entity WorkExperience")]
pub struct WorkExperience {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub company_name: String,
    pub position: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub description: Option<String>,
    pub attachment_urls: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}
