use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DepreciationMethod {
    pub id: Uuid,
    pub code: String,
    pub method_name: String,
    pub annual_rate: Option<String>,
    pub frequency_months: Option<String>,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}
