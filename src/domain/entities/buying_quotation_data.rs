use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDate};
use uuid::Uuid;
use bigdecimal::BigDecimal;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RequestForQuotation {
    pub id: Uuid,
    pub company_id: Uuid,
    pub rfq_number: String,
    pub transaction_date: NaiveDate,
    pub status: String,
    pub tc_name: Option<String>,
    pub terms: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RfqItem {
    pub id: Uuid,
    pub rfq_id: Uuid,
    pub item_id: Uuid,
    pub qty: BigDecimal,
    pub warehouse_id: Option<Uuid>,
    pub schedule_date: Option<NaiveDate>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RfqSupplier {
    pub id: Uuid,
    pub rfq_id: Uuid,
    pub vendor_id: Uuid,
    pub quote_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierQuotation {
    pub id: Uuid,
    pub company_id: Uuid,
    pub quotation_number: String,
    pub vendor_id: Uuid,
    pub rfq_id: Option<Uuid>,
    pub transaction_date: NaiveDate,
    pub valid_till: Option<NaiveDate>,
    pub subtotal: BigDecimal,
    pub total_tax: BigDecimal,
    pub grand_total: BigDecimal,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupplierQuotationItem {
    pub id: Uuid,
    pub quotation_id: Uuid,
    pub item_id: Uuid,
    pub qty: BigDecimal,
    pub rate: BigDecimal,
    pub amount: BigDecimal,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubcontractingOrder {
    pub id: Uuid,
    pub company_id: Uuid,
    pub order_number: String,
    pub vendor_id: Uuid,
    pub transaction_date: NaiveDate,
    pub status: Option<String>,
    pub created_at: DateTime<Utc>,
}

// DTOs

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRequestForQuotationRequest {
    pub rfq_number: String,
    pub transaction_date: Option<NaiveDate>,
    pub tc_name: Option<String>,
    pub terms: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierQuotationRequest {
    pub quotation_number: String,
    pub vendor_id: Uuid,
    pub rfq_id: Option<Uuid>,
    pub transaction_date: Option<NaiveDate>,
    pub valid_till: Option<NaiveDate>,
    pub subtotal: BigDecimal,
    pub total_tax: BigDecimal,
    pub grand_total: BigDecimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSubcontractingOrderRequest {
    pub order_number: String,
    pub vendor_id: Uuid,
    pub transaction_date: Option<NaiveDate>,
}
