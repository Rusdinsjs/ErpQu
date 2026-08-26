use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Uom {
    pub id: Uuid,
    pub company_id: Uuid,
    pub uom_name: String,
    pub must_be_whole_number: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UomConversionFactor {
    pub id: Uuid,
    pub company_id: Uuid,
    pub from_uom_id: Uuid,
    pub to_uom_id: Uuid,
    pub value: rust_decimal::Decimal,
    pub created_at: DateTime<Utc>,
    
    // Virtual fields for display
    pub from_uom_name: Option<String>,
    pub to_uom_name: Option<String>,
}
