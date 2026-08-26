use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LandedCostVoucher {
    pub id: Uuid,
    pub company_id: Uuid,
    pub voucher_number: String,
    pub posting_date: NaiveDate,
    pub total_freight_charge: Option<Decimal>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    
    // items
    pub items: Vec<LandedCostItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LandedCostItem {
    pub id: Uuid,
    pub voucher_id: Uuid,
    pub receipt_document_type: String,
    pub receipt_document_id: Uuid,
    pub item_id: Uuid,
    pub qty: Decimal,
    pub applicable_charges: Option<Decimal>,

    // virtual field
    pub item_name: Option<String>,
}
