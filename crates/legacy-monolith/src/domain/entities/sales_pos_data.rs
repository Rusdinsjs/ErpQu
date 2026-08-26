use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PosProfile {
    pub id: Uuid,
    pub company_id: Uuid,
    pub profile_name: String,
    pub warehouse_id: Uuid,
    pub cash_account_id: Uuid,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PosSettings {
    pub id: Uuid,
    pub company_id: Uuid,
    pub allow_discount_change: Option<bool>,
    pub allow_rate_change: Option<bool>,
    pub auto_print_receipt: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PosOpeningEntry {
    pub id: Uuid,
    pub company_id: Uuid,
    pub pos_profile_id: Uuid,
    pub user_id: Uuid,
    pub period_start_date: DateTime<Utc>,
    pub opening_amount: f64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PosClosingEntry {
    pub id: Uuid,
    pub company_id: Uuid,
    pub pos_profile_id: Uuid,
    pub user_id: Uuid,
    pub pos_opening_entry_id: Option<Uuid>,
    pub period_start_date: DateTime<Utc>,
    pub period_end_date: DateTime<Utc>,
    pub grand_total: f64,
    pub net_total: f64,
    pub total_quantity: f64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoyaltyProgram {
    pub id: Uuid,
    pub company_id: Uuid,
    pub program_name: String,
    pub auto_opt_in: Option<bool>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub conversion_factor: Option<f64>,
    pub expiry_duration_in_days: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoyaltyPointEntry {
    pub id: Uuid,
    pub company_id: Uuid,
    pub loyalty_program_id: Option<Uuid>,
    pub client_id: Uuid,
    pub sales_invoice_id: Option<Uuid>,
    pub loyalty_points: i32,
    pub purchase_amount: Option<f64>,
    pub expiry_date: Option<NaiveDate>,
    pub posting_date: NaiveDate,
    pub created_at: DateTime<Utc>,
}

// DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePosProfileRequest {
    pub profile_name: String,
    pub warehouse_id: Uuid,
    pub cash_account_id: Uuid,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePosSettingsRequest {
    pub allow_discount_change: Option<bool>,
    pub allow_rate_change: Option<bool>,
    pub auto_print_receipt: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePosOpeningEntryRequest {
    pub pos_profile_id: Uuid,
    pub user_id: Uuid,
    pub opening_amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePosClosingEntryRequest {
    pub pos_profile_id: Uuid,
    pub user_id: Uuid,
    pub pos_opening_entry_id: Option<Uuid>,
    pub period_start_date: DateTime<Utc>,
    pub grand_total: f64,
    pub net_total: f64,
    pub total_quantity: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLoyaltyProgramRequest {
    pub program_name: String,
    pub auto_opt_in: Option<bool>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub conversion_factor: Option<f64>,
    pub expiry_duration_in_days: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLoyaltyPointEntryRequest {
    pub loyalty_program_id: Option<Uuid>,
    pub client_id: Uuid,
    pub sales_invoice_id: Option<Uuid>,
    pub loyalty_points: i32,
    pub purchase_amount: Option<f64>,
    pub expiry_date: Option<NaiveDate>,
}
