use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Brand {
    pub id: Uuid,
    pub company_id: Uuid,
    pub brand_name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manufacturer {
    pub id: Uuid,
    pub company_id: Uuid,
    pub name: String,
    pub website: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemAttribute {
    pub id: Uuid,
    pub company_id: Uuid,
    pub attribute_name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemAlternative {
    pub id: Uuid,
    pub item_id: Uuid,
    pub alternative_item_id: Uuid,
    pub two_way: Option<bool>,
    pub created_at: DateTime<Utc>,

    // Virtual fields
    pub item_name: Option<String>,
    pub alternative_item_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductBundle {
    pub id: Uuid,
    pub company_id: Uuid,
    pub new_item_code: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub items: Vec<ProductBundleItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductBundleItem {
    pub id: Uuid,
    pub bundle_id: Uuid,
    pub item_code: String,
    pub qty: Option<rust_decimal::Decimal>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemTaxTemplate {
    pub id: Uuid,
    pub company_id: Uuid,
    pub title: String,
    pub tax_rate: Option<rust_decimal::Decimal>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemManufacturer {
    pub id: Uuid,
    pub item_id: Uuid,
    pub manufacturer_id: Uuid,
    pub manufacturer_part_no: Option<String>,
    pub created_at: DateTime<Utc>,

    // Virtual fields
    pub item_name: Option<String>,
    pub manufacturer_name: Option<String>,
}
