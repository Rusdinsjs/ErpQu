use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StockEntry {
    pub id: Uuid,
    pub company_id: Uuid,
    pub posting_date: NaiveDate,
    pub posting_time: NaiveTime,
    pub stock_entry_type: String, // 'MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'MATERIAL_TRANSFER', 'REPACK'
    pub voucher_no: String,
    pub purpose: Option<String>,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub status: String, // 'DRAFT', 'SUBMITTED', 'CANCELLED'
    pub remarks: Option<String>,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_at: DateTime<Utc>,
    pub updated_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StockEntryItem {
    pub id: Uuid,
    pub stock_entry_id: Uuid,
    pub item_id: Uuid,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub basic_rate: Decimal,
    pub amount: Decimal,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockEntryWithItems {
    #[serde(flatten)]
    pub entry: StockEntry,
    pub items: Vec<StockEntryItem>,
}
