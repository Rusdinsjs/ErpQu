use chrono::{DateTime, Utc};
use management_system_macros::DocType;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "Assets", description = "Entity CategoryAttributeTemplate")]
pub struct CategoryAttributeTemplate {
    pub id: Uuid,
    pub category_id: Uuid,
    pub attributes: JsonValue, // Should be array of strings
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Response struct with category name included for frontend display
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, DocType)]
#[doctype(module = "Assets", description = "Entity CategoryTemplateWithName")]
pub struct CategoryTemplateWithName {
    pub id: Uuid,
    pub category_id: Uuid,
    pub category_name: String,
    pub attributes: JsonValue,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(
    module = "Assets",
    description = "Entity CreateCategoryAttributeTemplateRequest"
)]
pub struct CreateCategoryAttributeTemplateRequest {
    pub category_id: Uuid,
    pub attributes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(
    module = "Assets",
    description = "Entity UpdateCategoryAttributeTemplateRequest"
)]
pub struct UpdateCategoryAttributeTemplateRequest {
    pub attributes: Vec<String>,
}
