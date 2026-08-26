use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::str::FromStr;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EmploymentStatus {
    Pkwt,
    Pkwtt,
    Magang,
    Lainnya,
}

impl FromStr for EmploymentStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pkwt" => Ok(Self::Pkwt),
            "pkwtt" => Ok(Self::Pkwtt),
            "magang" => Ok(Self::Magang),
            "lainnya" => Ok(Self::Lainnya),
            _ => Err(format!("Invalid employment status: {}", s)),
        }
    }
}

impl EmploymentStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pkwt => "pkwt",
            Self::Pkwtt => "pkwtt",
            Self::Magang => "magang",
            Self::Lainnya => "lainnya",
        }
    }

    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Option<Self> {
        <Self as FromStr>::from_str(s).ok()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Employee {
    pub id: Uuid,
    pub nik: String,
    pub name: String,
    pub email: String,
    #[sqlx(default)]
    pub phone: Option<String>,
    #[sqlx(default)]
    pub department_id: Option<Uuid>,
    #[sqlx(default)]
    pub position: Option<String>,
    pub employment_status: String,
    #[sqlx(default)]
    pub user_id: Option<Uuid>,
    pub is_active: bool,

    // Biodata
    #[sqlx(default)]
    pub ktp_number: Option<String>,
    #[sqlx(default)]
    pub place_of_birth: Option<String>,
    #[sqlx(default)]
    pub date_of_birth: Option<chrono::NaiveDate>,
    #[sqlx(default)]
    pub gender: Option<String>,
    #[sqlx(default)]
    pub marital_status: Option<String>,
    #[sqlx(default)]
    pub religion: Option<String>,
    #[sqlx(default)]
    pub address: Option<String>,
    #[sqlx(default)]
    pub blood_type: Option<String>,
    #[sqlx(default)]
    pub children_count: Option<i32>,
    #[sqlx(default)]
    pub residence_status: Option<String>,

    // Emergency Contact
    #[sqlx(default)]
    pub emergency_contact_name: Option<String>,
    #[sqlx(default)]
    pub emergency_contact_phone: Option<String>,
    #[sqlx(default)]
    pub emergency_contact_relation: Option<String>,

    // Employment Details
    #[sqlx(default)]
    pub start_date: Option<chrono::NaiveDate>,
    #[sqlx(default)]
    pub end_contract_date: Option<chrono::NaiveDate>,
    #[sqlx(default)]
    pub is_manager: bool,
    #[sqlx(default)]
    pub manager_id: Option<Uuid>,
    #[sqlx(default)]
    pub is_evaluator: Option<bool>,
    #[sqlx(default)]
    pub designation_id: Option<Uuid>,
    #[sqlx(default)]
    pub employment_type_id: Option<Uuid>,
    #[sqlx(default)]
    pub grade: Option<String>,
    #[sqlx(default)]
    pub probation_end_date: Option<chrono::NaiveDate>,
    #[sqlx(default)]
    pub confirmation_date: Option<chrono::NaiveDate>,
    #[sqlx(default)]
    pub resignation_date: Option<chrono::NaiveDate>,
    #[sqlx(default)]
    pub resignation_reason: Option<String>,
    #[sqlx(default)]
    pub is_account_requested: Option<bool>,

    // Payroll
    #[sqlx(default)]
    pub bank_account: Option<String>,
    #[sqlx(default)]
    pub bank_name: Option<String>,
    #[sqlx(default)]
    pub npwp: Option<String>,
    #[sqlx(default)]
    pub bpjs_kesehatan: Option<String>,
    #[sqlx(default)]
    pub bpjs_tenaga_kerja: Option<String>,
    #[sqlx(default)]
    pub basic_salary: Option<rust_decimal::Decimal>,
    #[sqlx(default)]
    pub is_allowance: Option<bool>,
    #[sqlx(default)]
    pub allowances: Option<serde_json::Value>,

    // Education & Competencies
    #[sqlx(default)]
    pub education: Option<String>,
    #[sqlx(default)]
    pub competencies: Option<String>,
    #[sqlx(default)]
    pub competency_attachments: Option<serde_json::Value>,

    // Leave
    #[sqlx(default)]
    pub leave_balance: i32,
    #[sqlx(default)]
    pub leave_used: i32,

    // Photos & Biometrics
    #[sqlx(default)]
    pub photo_url: Option<String>,
    #[sqlx(default)]
    pub face_embeddings: Option<serde_json::Value>,
    #[sqlx(default)]
    pub face_verification_status: Option<String>,
    #[sqlx(default)]
    pub office_location_id: Option<Uuid>,
    #[sqlx(default)]
    pub allowed_radius: Option<i32>,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // Optional joined fields
    #[sqlx(default)]
    pub department_name: Option<String>,
    #[sqlx(default)]
    pub assigned_asset_id: Option<Uuid>,
    #[sqlx(default)]
    pub work_area_id: Option<Uuid>,
}

impl Employee {
    pub fn status(&self) -> EmploymentStatus {
        EmploymentStatus::from_str(&self.employment_status).unwrap_or(EmploymentStatus::Lainnya)
    }
}
