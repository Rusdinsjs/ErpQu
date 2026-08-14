use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::api::server::AppState;
use crate::domain::entities::stock_entry::{StockEntry, StockEntryItem};

#[derive(Deserialize)]
pub struct CreateStockEntryRequest {
    pub company_id: Uuid,
    pub posting_date: String, // format YYYY-MM-DD
    pub posting_time: Option<String>,
    pub stock_entry_type: String,
    pub voucher_no: String,
    pub purpose: Option<String>,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub remarks: Option<String>,
    pub items: Vec<CreateStockEntryItemRequest>,
}

#[derive(Deserialize)]
pub struct CreateStockEntryItemRequest {
    pub item_id: Uuid,
    pub source_warehouse_id: Option<Uuid>,
    pub target_warehouse_id: Option<Uuid>,
    pub qty: Decimal,
    pub basic_rate: Decimal,
    pub amount: Option<Decimal>,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
}

pub async fn create_stock_entry(
    State(state): State<AppState>,
    Json(payload): Json<CreateStockEntryRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let posting_date = NaiveDate::parse_from_str(&payload.posting_date, "%Y-%m-%d").unwrap_or_else(|_| chrono::Utc::now().naive_utc().date());
    let posting_time = if let Some(t) = &payload.posting_time {
        chrono::NaiveTime::parse_from_str(t, "%H:%M:%S").unwrap_or_else(|_| chrono::Utc::now().naive_utc().time())
    } else {
        chrono::Utc::now().naive_utc().time()
    };

    let entry = StockEntry {
        id: Uuid::nil(),
        company_id: payload.company_id,
        posting_date,
        posting_time,
        stock_entry_type: payload.stock_entry_type,
        voucher_no: payload.voucher_no,
        purpose: payload.purpose,
        source_warehouse_id: payload.source_warehouse_id,
        target_warehouse_id: payload.target_warehouse_id,
        status: "DRAFT".to_string(),
        remarks: payload.remarks,
        created_at: chrono::Utc::now(),
        created_by: None,
        updated_at: chrono::Utc::now(),
        updated_by: None,
    };

    let items: Vec<StockEntryItem> = payload.items.into_iter().map(|i| StockEntryItem {
        id: Uuid::nil(),
        stock_entry_id: Uuid::nil(),
        item_id: i.item_id,
        source_warehouse_id: i.source_warehouse_id,
        target_warehouse_id: i.target_warehouse_id,
        qty: i.qty,
        basic_rate: i.basic_rate,
        amount: i.amount.unwrap_or(Decimal::ZERO),
        batch_no: i.batch_no,
        serial_no: i.serial_no,
        created_at: chrono::Utc::now(),
    }).collect();

    match state.stock_entry_service.create_entry(entry, items).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_stock_entries(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_entry_service.list_entries(company_id).await {
        Ok(list) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": list
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn get_stock_entry(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_entry_service.get_entry(id).await {
        Ok(Some(entry)) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": entry
        }))),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "status": "error",
                "message": "Not found"
            })),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn submit_stock_entry(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_entry_service.submit_entry(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Stock Entry submitted successfully"
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}
