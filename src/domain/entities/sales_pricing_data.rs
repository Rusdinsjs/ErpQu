use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PriceList {
    pub id: Uuid,
    pub company_id: Uuid,
    pub price_list_name: String,
    pub currency: Option<String>,
    pub buying: Option<bool>,
    pub selling: Option<bool>,
    pub enabled: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemPrice {
    pub id: Uuid,
    pub company_id: Uuid,
    pub price_list_id: Uuid,
    pub item_id: Uuid,
    pub price_list_rate: f64,
    pub valid_from: Option<NaiveDate>,
    pub valid_upto: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductBundle {
    pub id: Uuid,
    pub company_id: Uuid,
    pub new_item_code: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PricingRule {
    pub id: Uuid,
    pub company_id: Uuid,
    pub title: String,
    pub apply_on: Option<String>,
    pub discount_percentage: Option<f64>,
    pub margin_type: Option<String>,
    pub margin_rate: Option<f64>,
    pub priority: Option<i32>,
    pub enabled: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PromotionalScheme {
    pub id: Uuid,
    pub company_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub discount_type: Option<String>,
    pub discount_value: Option<f64>,
    pub min_qty: Option<f64>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub enabled: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CouponCode {
    pub id: Uuid,
    pub company_id: Uuid,
    pub coupon_name: String,
    pub coupon_code: String,
    pub discount_percentage: Option<f64>,
    pub maximum_use: Option<i32>,
    pub used_count: Option<i32>,
    pub valid_from: Option<NaiveDate>,
    pub valid_upto: Option<NaiveDate>,
    pub used: Option<bool>,
    pub created_at: DateTime<Utc>,
}

// DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePriceListRequest {
    pub price_list_name: String,
    pub currency: Option<String>,
    pub buying: Option<bool>,
    pub selling: Option<bool>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateItemPriceRequest {
    pub price_list_id: Uuid,
    pub item_id: Uuid,
    pub price_list_rate: f64,
    pub valid_from: Option<NaiveDate>,
    pub valid_upto: Option<NaiveDate>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProductBundleRequest {
    pub new_item_code: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePricingRuleRequest {
    pub title: String,
    pub apply_on: Option<String>,
    pub discount_percentage: Option<f64>,
    pub margin_type: Option<String>,
    pub margin_rate: Option<f64>,
    pub priority: Option<i32>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePromotionalSchemeRequest {
    pub name: String,
    pub description: Option<String>,
    pub discount_type: Option<String>,
    pub discount_value: Option<f64>,
    pub min_qty: Option<f64>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCouponCodeRequest {
    pub coupon_name: String,
    pub coupon_code: String,
    pub discount_percentage: Option<f64>,
    pub maximum_use: Option<i32>,
    pub valid_from: Option<NaiveDate>,
    pub valid_upto: Option<NaiveDate>,
}
