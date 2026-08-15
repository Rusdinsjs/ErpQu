use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Warehouse Entity (QSTK-002)
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Warehouse {
    pub id: Uuid,
    pub company_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub code: String,
    pub name: String,
    pub is_active: bool,
    pub is_group: bool,
    pub is_frozen: bool,
    pub warehouse_type: String,
}

/// Bin Projection Entity (QSTK-003)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bin {
    pub id: Uuid,
    pub company_id: Uuid,
    pub warehouse_id: Uuid,
    pub item_id: Uuid,
    pub actual_qty: Decimal,
    pub reserved_qty: Decimal,
    pub ordered_qty: Decimal,
    pub stock_value: Decimal,
    pub updated_at: DateTime<Utc>,
}

/// Immutable Stock Ledger Entry Entity (QSTK-004)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockLedgerEntry {
    pub id: Uuid,
    pub company_id: Uuid,
    pub warehouse_id: Uuid,
    pub item_id: Uuid,
    pub posting_date: NaiveDate,
    pub posting_datetime: DateTime<Utc>,
    pub actual_qty_delta: Decimal,
    pub qty_after: Decimal,
    pub valuation_rate: Decimal,
    pub stock_value_delta: Decimal,
    pub stock_value_after: Decimal,
    pub voucher_type: String,
    pub voucher_no: String,
    pub voucher_id: Uuid,
    pub voucher_line_id: Option<Uuid>,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
    pub is_cancelled: bool,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub warehouse_bin_id: Option<Uuid>,
}

/// A line item inside a stock posting instruction passed to StockPostingEngine (QSTK-005)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockPostingLineItem {
    pub warehouse_id: Uuid,
    pub item_id: Uuid,
    pub actual_qty_delta: Decimal,
    pub unit_cost: Option<Decimal>,
    pub voucher_line_id: Option<Uuid>,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
    pub allow_negative_stock: Option<bool>,
    pub warehouse_bin_id: Option<Uuid>,
}

/// Structured stock posting instruction passed to StockPostingEngine (QSTK-005)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockPostingInstruction {
    pub company_id: Uuid,
    pub posting_date: NaiveDate,
    pub voucher_type: String,
    pub voucher_no: String,
    pub voucher_id: Uuid,
    pub lines: Vec<StockPostingLineItem>,
    pub created_by: Option<Uuid>,
}

/// Stock Entry document representing manual stock movements (QSTK-018)
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StockEntry {
    pub id: Uuid,
    pub company_id: Uuid,
    pub posting_date: chrono::NaiveDate,
    pub posting_time: chrono::NaiveTime,
    pub stock_entry_type: String, // 'MATERIAL_RECEIPT', 'MATERIAL_ISSUE', 'MATERIAL_TRANSFER', 'REPACK'
    pub voucher_no: String,
    pub purpose: Option<String>,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub status: String, // 'DRAFT', 'SUBMITTED', 'CANCELLED'
    pub remarks: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub created_by: Option<Uuid>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub updated_by: Option<Uuid>,
}

/// A line item inside a Stock Entry document (QSTK-018)
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StockEntryItem {
    pub id: Uuid,
    pub stock_entry_id: Uuid,
    pub item_id: Uuid,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub basic_rate: Decimal,
    pub amount: Decimal,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub source_bin_id: Option<Uuid>,
    pub target_bin_id: Option<Uuid>,
}

/// Material Request document for internal requisitions (QSTK-019)
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MaterialRequest {
    pub id: Uuid,
    pub company_id: Uuid,
    pub transaction_date: chrono::NaiveDate,
    pub material_request_type: String, // 'PURCHASE', 'MATERIAL_TRANSFER', 'MATERIAL_ISSUE'
    pub voucher_no: String,
    pub required_by_date: Option<chrono::NaiveDate>,
    pub status: String, // 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PARTIALLY_ORDERED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
    pub remarks: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub created_by: Option<Uuid>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub updated_by: Option<Uuid>,
}

/// A line item inside a Material Request document (QSTK-019)
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MaterialRequestItem {
    pub id: Uuid,
    pub material_request_id: Uuid,
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub ordered_qty: Decimal,
    pub received_qty: Decimal,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Warehouse Bin Entity for location tracking (e.g. rack/shelf/bin)
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WarehouseBin {
    pub id: Uuid,
    pub warehouse_id: Uuid,
    pub bin_code: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Item Bin Balance Entity
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ItemBinBalance {
    pub id: Uuid,
    pub company_id: Uuid,
    pub warehouse_bin_id: Uuid,
    pub item_id: Uuid,
    pub actual_qty: Decimal,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub bin_code: Option<String>,
    #[sqlx(default)]
    pub warehouse_id: Option<Uuid>,
}
