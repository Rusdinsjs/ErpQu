//! Commercial Price List & Pricing Rules Entities (QCOM-002)

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceList {
    pub id: Uuid,
    pub company_id: Uuid,
    pub name: String,
    pub currency: String,
    pub is_buying: bool,
    pub is_selling: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceListItem {
    pub id: Uuid,
    pub price_list_id: Uuid,
    pub item_code: String,
    pub rate: Decimal,
    pub valid_from: Option<chrono::NaiveDate>,
    pub valid_until: Option<chrono::NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePriceListRequest {
    pub company_id: Uuid,
    pub name: String,
    pub currency: String,
    pub is_buying: Option<bool>,
    pub is_selling: Option<bool>,
}
