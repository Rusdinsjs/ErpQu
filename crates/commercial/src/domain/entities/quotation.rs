//! Commercial Sales Quotation Entities (QCOM-001)

use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesQuotation {
    pub id: Uuid,
    pub company_id: Uuid,
    pub quotation_number: String,
    pub client_id: Uuid,
    pub transaction_date: NaiveDate,
    pub valid_until: NaiveDate,
    pub total_amount: Decimal,
    pub status: String,
    pub notes: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotationItem {
    pub id: Uuid,
    pub quotation_id: Uuid,
    pub item_name: String,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub discount_percentage: Decimal,
    pub total_amount: Decimal,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuotationItemRequest {
    pub item_name: String,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub discount_percentage: Option<Decimal>,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuotationRequest {
    pub company_id: Uuid,
    pub quotation_number: String,
    pub client_id: Uuid,
    pub transaction_date: NaiveDate,
    pub valid_until: NaiveDate,
    pub items: Vec<CreateQuotationItemRequest>,
    pub notes: Option<String>,
}
