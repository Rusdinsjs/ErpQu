use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateDesignationRequest {
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub grade: Option<String>,
    pub department_id: Option<Uuid>,
    pub is_manager: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDesignationRequest {
    pub name: Option<String>,
    pub code: Option<String>,
    pub description: Option<String>,
    pub grade: Option<String>,
    pub department_id: Option<Uuid>,
    pub is_manager: Option<bool>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEmploymentTypeRequest {
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub max_contract_years: Option<i32>,
    pub is_eligible_bpjs: Option<bool>,
    pub is_eligible_pph21: Option<bool>,
    pub is_eligible_leave: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLifecycleEventRequest {
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
}

#[derive(Debug, Deserialize)]
pub struct CreateEmployeeDocumentRequest {
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
}

#[derive(Debug, Deserialize)]
pub struct CreateEmployeeEducationRequest {
    pub employee_id: Uuid,
    pub level: String,
    pub institution_name: String,
    pub major: Option<String>,
    pub graduation_year: Option<i32>,
    pub gpa: Option<Decimal>,
    pub is_highest: Option<bool>,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LifecycleQueryParams {
    pub employee_id: Option<Uuid>,
    pub event_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Employee360Response {
    pub employee: crate::domain::entities::Employee,
    pub designation: Option<crate::domain::entities::HrDesignation>,
    pub employment_type: Option<crate::domain::entities::HrEmploymentType>,
    pub lifecycle_history: Vec<crate::domain::entities::HrEmployeeLifecycle>,
    pub documents: Vec<crate::domain::entities::HrEmployeeDocument>,
    pub education: Vec<crate::domain::entities::HrEmployeeEducation>,
    pub work_experiences: Vec<crate::domain::entities::WorkExperience>,
}
