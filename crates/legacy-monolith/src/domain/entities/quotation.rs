use serde::{Deserialize, Serialize};
use chrono::{NaiveDate, DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Quotation {
    pub id: Uuid,
    pub quotation_number: String,
    pub client_id: Uuid,
    pub date: NaiveDate,
    pub valid_until: Option<NaiveDate>,
    pub status: String,
    pub total_amount: f64,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuotationItem {
    pub id: Uuid,
    pub quotation_id: Uuid,
    pub item_id: Uuid,
    pub qty: f64,
    pub rate: f64,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateQuotationRequest {
    pub quotation_number: String,
    pub client_id: Uuid,
    pub date: NaiveDate,
    pub valid_until: Option<NaiveDate>,
    pub status: Option<String>,
    pub notes: Option<String>,
    pub items: Vec<CreateQuotationItemRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateQuotationItemRequest {
    pub item_name: Option<String>,
    pub qty: f64,
    pub rate: f64,
}
