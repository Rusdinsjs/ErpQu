use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// 1. Delivery Notes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryNote {
    pub id: Uuid,
    pub company_id: Uuid,
    pub delivery_note_number: String,
    pub customer_id: Option<Uuid>,
    pub transaction_date: NaiveDate,
    pub posting_time: NaiveTime,
    pub warehouse_id: Option<Uuid>,
    pub status: String,
    pub grand_total: Decimal,
    pub created_at: DateTime<Utc>,
    pub items: Vec<DeliveryNoteItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryNoteItem {
    pub id: Uuid,
    pub delivery_note_id: Uuid,
    pub item_id: Uuid,
    pub qty: Decimal,
    pub rate: Decimal,
    pub amount: Decimal,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
}

// 2. Pick Lists
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PickList {
    pub id: Uuid,
    pub company_id: Uuid,
    pub pick_list_number: String,
    pub purpose: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub items: Vec<PickListItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PickListItem {
    pub id: Uuid,
    pub pick_list_id: Uuid,
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub picked_qty: Decimal,
}

// 3. Delivery Trips
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryTrip {
    pub id: Uuid,
    pub company_id: Uuid,
    pub trip_number: String,
    pub driver_id: Option<Uuid>,
    pub vehicle_id: Option<Uuid>,
    pub status: String,
    pub departure_time: Option<DateTime<Utc>>,
    pub arrival_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub stops: Vec<DeliveryTripStop>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryTripStop {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub delivery_note_id: Option<Uuid>,
    pub stop_order: i32,
    pub customer_address: Option<String>,
    pub estimated_arrival: Option<DateTime<Utc>>,
    pub status: Option<String>,
}

// 4. Installation Notes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallationNote {
    pub id: Uuid,
    pub company_id: Uuid,
    pub note_number: String,
    pub customer_id: Option<Uuid>,
    pub inst_date: NaiveDate,
    pub status: Option<String>,
    pub created_at: DateTime<Utc>,
}

// 5. Stock Reconciliations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockReconciliation {
    pub id: Uuid,
    pub company_id: Uuid,
    pub reconciliation_number: String,
    pub posting_date: NaiveDate,
    pub posting_time: NaiveTime,
    pub warehouse_id: Option<Uuid>,
    pub purpose: Option<String>,
    pub status: String,
    pub remarks: Option<String>,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_at: Option<DateTime<Utc>>,
    pub updated_by: Option<Uuid>,
    pub items: Vec<StockReconciliationItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockReconciliationItem {
    pub id: Uuid,
    pub reconciliation_id: Uuid,
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub valuation_rate: Decimal,
    pub amount: Decimal,
    pub current_qty: Option<Decimal>,
    pub current_valuation_rate: Option<Decimal>,
    pub difference_qty: Option<Decimal>,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
    pub created_at: DateTime<Utc>,
}
