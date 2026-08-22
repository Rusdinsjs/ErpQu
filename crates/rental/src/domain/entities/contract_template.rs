use management_system_macros::DocType;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "Rentals", description = "Entity ContractTemplate")]
pub struct ContractTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub header_content: Option<String>,
    pub body_content: String,
    pub footer_content: Option<String>,
    pub is_active: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}
