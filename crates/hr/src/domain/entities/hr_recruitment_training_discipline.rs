use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ---- RECRUITMENT & ATS ----
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrJobOpening {
    pub id: Uuid,
    pub title: String,
    pub department_id: Option<Uuid>,
    pub designation_id: Option<Uuid>,
    pub employment_type: String,
    pub openings_count: i32,
    pub min_experience_years: i32,
    pub salary_min: Option<Decimal>,
    pub salary_max: Option<Decimal>,
    pub location: Option<String>,
    pub description: String,
    pub requirements: Option<String>,
    pub status: String, // 'open', 'in_progress', 'closed'
    pub posted_date: NaiveDate,
    pub closing_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub department_name: Option<String>,
    #[sqlx(default)]
    pub designation_name: Option<String>,
    #[sqlx(default)]
    pub applicant_count: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrJobApplicant {
    pub id: Uuid,
    pub job_opening_id: Uuid,
    pub full_name: String,
    pub email: String,
    pub phone: String,
    pub resume_url: Option<String>,
    pub portfolio_url: Option<String>,
    pub stage: String, // 'applied', 'screening', 'interview_hr', 'technical_test', 'interview_user', 'offering', 'hired', 'rejected'
    pub rating: Option<i32>,
    pub notes: Option<String>,
    pub rejection_reason: Option<String>,
    pub converted_employee_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub job_title: Option<String>,
}

// ---- TRAINING & CERTIFICATIONS ----
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrTrainingProgram {
    pub id: Uuid,
    pub title: String,
    pub code: String,
    pub description: Option<String>,
    pub trainer_type: String, // 'internal', 'external'
    pub duration_hours: i32,
    pub is_mandatory: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrTrainingEvent {
    pub id: Uuid,
    pub program_id: Uuid,
    pub title: String,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub location: String,
    pub trainer_name: String,
    pub total_cost: Option<Decimal>,
    pub status: String, // 'scheduled', 'ongoing', 'completed', 'cancelled'
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub program_title: Option<String>,
    #[sqlx(default)]
    pub participant_count: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrTrainingParticipant {
    pub id: Uuid,
    pub event_id: Uuid,
    pub employee_id: Uuid,
    pub attendance_status: String,
    pub score: Option<Decimal>,
    pub certificate_issued: bool,
    pub certificate_no: Option<String>,
    pub valid_until: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrEmployeeCertification {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub certificate_name: String,
    pub certificate_no: String,
    pub issuing_body: String,
    pub issue_date: NaiveDate,
    pub expiry_date: NaiveDate,
    pub document_url: Option<String>,
    pub status: String, // 'active', 'expiring_soon', 'expired'
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
}

// ---- DISCIPLINARY ACTIONS ----
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HrDisciplinaryAction {
    pub id: Uuid,
    pub employee_id: Uuid,
    pub action_type: String, // 'teguran', 'sp1', 'sp2', 'sp3'
    pub infraction_category: String,
    pub incident_date: NaiveDate,
    pub issue_date: NaiveDate,
    pub valid_until: NaiveDate,
    pub reason_details: String,
    pub action_plan: Option<String>,
    pub issued_by: Option<Uuid>,
    pub status: String, // 'active', 'expired', 'revoked'
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub employee_name: Option<String>,
    #[sqlx(default)]
    pub employee_nik: Option<String>,
}
