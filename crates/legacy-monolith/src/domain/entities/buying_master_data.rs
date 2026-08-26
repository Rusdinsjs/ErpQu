use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierGroup {
    pub id: Uuid,
    pub company_id: Uuid,
    pub group_name: String,
    pub parent_group_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierContact {
    pub id: Uuid,
    pub vendor_id: Uuid,
    pub first_name: String,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_primary: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierAddress {
    pub id: Uuid,
    pub vendor_id: Uuid,
    pub address_title: String,
    pub address_line1: String,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub pincode: Option<String>,
    pub is_primary: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuyingSettings {
    pub id: Uuid,
    pub company_id: Uuid,
    pub po_required: Option<bool>,
    pub pr_required: Option<bool>,
    pub maintain_same_rate: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PurchaseTaxesTemplate {
    pub id: Uuid,
    pub company_id: Uuid,
    pub title: String,
    pub rate: f64,
    pub account_id: Option<Uuid>,
    pub is_default: Option<bool>,
    pub created_at: DateTime<Utc>,
}

// DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierGroupRequest {
    pub group_name: String,
    pub parent_group_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierContactRequest {
    pub vendor_id: Uuid,
    pub first_name: String,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_primary: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierAddressRequest {
    pub vendor_id: Uuid,
    pub address_title: String,
    pub address_line1: String,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub pincode: Option<String>,
    pub is_primary: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBuyingSettingsRequest {
    pub po_required: Option<bool>,
    pub pr_required: Option<bool>,
    pub maintain_same_rate: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePurchaseTaxesTemplateRequest {
    pub title: String,
    pub rate: f64,
    pub account_id: Option<Uuid>,
    pub is_default: Option<bool>,
}
