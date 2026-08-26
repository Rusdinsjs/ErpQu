use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BlanketOrder {
    pub id: Uuid,
    pub company_id: Uuid,
    pub order_number: String,
    pub client_id: Uuid,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub tc_name: Option<String>,
    pub terms: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ShippingRule {
    pub id: Uuid,
    pub company_id: Uuid,
    pub name: String,
    pub shipping_amount: f64,
    pub calculate_based_on: Option<String>,
    pub account_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SellingSettings {
    pub id: Uuid,
    pub company_id: Uuid,
    pub so_required: Option<bool>,
    pub dn_required: Option<bool>,
    pub allow_negative_stock: Option<bool>,
    pub default_price_list_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TermsAndConditionsTemplate {
    pub id: Uuid,
    pub company_id: Uuid,
    pub title: String,
    pub terms_content: String,
    pub disabled: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SalesTaxesTemplate {
    pub id: Uuid,
    pub company_id: Uuid,
    pub title: String,
    pub rate: f64,
    pub account_id: Option<Uuid>,
    pub is_default: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UtmSource {
    pub id: Uuid,
    pub company_id: Uuid,
    pub name: String,
    pub medium: Option<String>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Campaign {
    pub id: Uuid,
    pub company_id: Uuid,
    pub campaign_name: String,
    pub utm_source_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub budget: Option<f64>,
    pub actual_cost: Option<f64>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

// DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBlanketOrderRequest {
    pub order_number: String,
    pub client_id: Uuid,
    pub from_date: NaiveDate,
    pub to_date: NaiveDate,
    pub tc_name: Option<String>,
    pub terms: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateShippingRuleRequest {
    pub name: String,
    pub shipping_amount: f64,
    pub calculate_based_on: Option<String>,
    pub account_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSellingSettingsRequest {
    pub so_required: Option<bool>,
    pub dn_required: Option<bool>,
    pub allow_negative_stock: Option<bool>,
    pub default_price_list_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTermsAndConditionsTemplateRequest {
    pub title: String,
    pub terms_content: String,
    pub disabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSalesTaxesTemplateRequest {
    pub title: String,
    pub rate: f64,
    pub account_id: Option<Uuid>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUtmSourceRequest {
    pub name: String,
    pub medium: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCampaignRequest {
    pub campaign_name: String,
    pub utm_source_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub budget: Option<f64>,
    pub actual_cost: Option<f64>,
    pub description: Option<String>,
}
