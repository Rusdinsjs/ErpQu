use chrono::{DateTime, Utc};
use management_system_macros::DocType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, utoipa::ToSchema, DocType)]
#[doctype(module = "Purchase", description = "Entity PurchaseBill")]
pub struct PurchaseBill {
    pub id: Uuid,
    pub bill_number: String,
    pub vendor_id: Uuid,
    pub bill_date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub subtotal: Decimal,
    pub tax_amount: Decimal,
    pub total_amount: Decimal,
    pub status: String,
    pub notes: Option<String>,
    pub company_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, utoipa::ToSchema, DocType)]
#[doctype(module = "Purchase", description = "Entity CreatePurchaseBillRequest")]
pub struct CreatePurchaseBillRequest {
    pub vendor_id: Uuid,
    pub bill_date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub subtotal: Decimal,
    pub tax_amount: Option<Decimal>,
    pub notes: Option<String>,
    pub company_id: Option<Uuid>,
}
