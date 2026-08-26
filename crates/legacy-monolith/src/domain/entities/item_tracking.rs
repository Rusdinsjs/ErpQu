use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerialNumber {
    pub id: Uuid,
    pub company_id: Uuid,
    pub serial_no: String,
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub status: Option<String>,
    pub warranty_expiry_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,

    // Virtual fields for display
    pub item_name: Option<String>,
    pub warehouse_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Batch {
    pub id: Uuid,
    pub company_id: Uuid,
    pub batch_no: String,
    pub item_id: Uuid,
    pub manufacturing_date: Option<NaiveDate>,
    pub expiry_date: Option<NaiveDate>,
    pub qty: Option<rust_decimal::Decimal>,
    pub status: Option<String>,
    pub created_at: DateTime<Utc>,

    // Virtual fields for display
    pub item_name: Option<String>,
}
