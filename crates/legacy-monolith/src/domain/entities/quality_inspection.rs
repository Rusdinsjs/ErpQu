use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityInspection {
    pub id: Uuid,
    pub company_id: Uuid,
    pub inspection_number: String,
    pub inspection_type: String,
    pub item_id: Uuid,
    pub batch_no: Option<String>,
    pub sample_size: Decimal,
    pub status: String,
    pub inspected_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,

    // Virtual fields
    pub item_name: Option<String>,
}
