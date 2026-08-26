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
use crate::domain::entities::purchase_receipt::{PurchaseReceipt, PurchaseReceiptItem};

#[derive(Deserialize)]
pub struct CreatePurchaseReceiptPayload {
    pub company_id: Uuid,
    pub receipt_number: String,
    pub purchase_order_id: Option<Uuid>,
    pub vendor_id: Uuid,
    pub warehouse_id: Uuid,
    pub posting_date: String,
    pub notes: Option<String>,
    pub items: Vec<CreatePurchaseReceiptItemPayload>,
}

#[derive(Deserialize)]
pub struct CreatePurchaseReceiptItemPayload {
    pub item_id: Uuid,
    pub qty_received: Decimal,
    pub unit_cost: Decimal,
    pub po_line_id: Option<Uuid>,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
}

pub async fn create_purchase_receipt(
    State(state): State<AppState>,
    Json(payload): Json<CreatePurchaseReceiptPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let posting_date = NaiveDate::parse_from_str(&payload.posting_date, "%Y-%m-%d").unwrap_or_else(|_| chrono::Utc::now().naive_utc().date());

    let receipt = PurchaseReceipt {
        id: Uuid::nil(),
        company_id: payload.company_id,
        receipt_number: payload.receipt_number,
        purchase_order_id: payload.purchase_order_id,
        vendor_id: payload.vendor_id,
        warehouse_id: payload.warehouse_id,
        posting_date,
        status: "DRAFT".to_string(),
        notes: payload.notes,
        created_at: chrono::Utc::now(),
        created_by: None,
    };

    let items: Vec<PurchaseReceiptItem> = payload.items.into_iter().map(|i| PurchaseReceiptItem {
        id: Uuid::nil(),
        receipt_id: Uuid::nil(),
        item_id: i.item_id,
        qty_received: i.qty_received,
        unit_cost: i.unit_cost,
        total_amount: Decimal::ZERO,
        po_line_id: i.po_line_id,
        batch_no: i.batch_no,
        serial_no: i.serial_no,
    }).collect();

    match state.purchase_receipt_service.create_receipt(receipt, items).await {
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

pub async fn list_purchase_receipts(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.purchase_receipt_service.list_receipts(company_id).await {
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

pub async fn get_purchase_receipt(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.purchase_receipt_service.get_receipt(id).await {
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

pub async fn submit_purchase_receipt(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.purchase_receipt_service.submit_receipt(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Purchase Receipt submitted successfully"
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
