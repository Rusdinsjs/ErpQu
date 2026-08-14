use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateJobOpeningRequest {
    pub title: String,
    pub department_id: Option<Uuid>,
    pub designation_id: Option<Uuid>,
    pub employment_type: Option<String>,
    pub openings_count: Option<i32>,
    pub min_experience_years: Option<i32>,
    pub salary_min: Option<Decimal>,
    pub salary_max: Option<Decimal>,
    pub location: Option<String>,
    pub description: String,
    pub requirements: Option<String>,
    pub closing_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateJobApplicantRequest {
    pub job_opening_id: Uuid,
    pub full_name: String,
    pub email: String,
    pub phone: String,
    pub resume_url: Option<String>,
    pub portfolio_url: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UpdateApplicantStageRequest {
    pub stage: String,
    pub notes: Option<String>,
    pub rating: Option<i32>,
    pub rejection_reason: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ConvertApplicantRequest {
    pub nik: String,
    pub date_of_joining: NaiveDate,
    pub base_salary: Decimal,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateTrainingProgramRequest {
    pub title: String,
    pub code: String,
    pub description: Option<String>,
    pub trainer_type: Option<String>,
    pub duration_hours: i32,
    pub is_mandatory: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateTrainingEventRequest {
    pub program_id: Uuid,
    pub title: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub location: Option<String>,
    pub trainer_name: String,
    pub total_cost: Option<Decimal>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AddTrainingParticipantRequest {
    pub employee_id: Uuid,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateEmployeeCertificationRequest {
    pub employee_id: Uuid,
    pub certificate_name: String,
    pub certificate_no: String,
    pub issuing_body: String,
    pub issue_date: NaiveDate,
    pub expiry_date: NaiveDate,
    pub document_url: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct IssueDisciplinaryActionRequest {
    pub employee_id: Uuid,
    pub action_type: String, // 'teguran', 'sp1', 'sp2', 'sp3'
    pub infraction_category: String,
    pub incident_date: NaiveDate,
    pub reason_details: String,
    pub action_plan: Option<String>,
}
