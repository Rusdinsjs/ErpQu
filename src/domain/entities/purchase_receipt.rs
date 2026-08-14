use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseReceipt {
    pub id: Uuid,
    pub company_id: Uuid,
    pub receipt_number: String,
    pub purchase_order_id: Option<Uuid>,
    pub vendor_id: Uuid,
    pub warehouse_id: Uuid,
    pub posting_date: NaiveDate,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseReceiptItem {
    pub id: Uuid,
    pub receipt_id: Uuid,
    pub item_id: Uuid,
    pub qty_received: Decimal,
    pub unit_cost: Decimal,
    pub total_amount: Decimal,
    pub po_line_id: Option<Uuid>,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseReceiptWithItems {
    #[serde(flatten)]
    pub receipt: PurchaseReceipt,
    pub items: Vec<PurchaseReceiptItem>,
}
