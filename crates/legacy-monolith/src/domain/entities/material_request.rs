use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MaterialRequest {
    pub id: Uuid,
    pub company_id: Uuid,
    pub transaction_date: NaiveDate,
    pub material_request_type: String, // 'PURCHASE', 'MATERIAL_TRANSFER', 'MATERIAL_ISSUE'
    pub voucher_no: String,
    pub required_by_date: Option<NaiveDate>,
    pub status: String,
    pub remarks: Option<String>,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_at: DateTime<Utc>,
    pub updated_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MaterialRequestItem {
    pub id: Uuid,
    pub material_request_id: Uuid,
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub ordered_qty: Decimal,
    pub received_qty: Decimal,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialRequestWithItems {
    #[serde(flatten)]
    pub request: MaterialRequest,
    pub items: Vec<MaterialRequestItem>,
}
