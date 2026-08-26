use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use rust_decimal::Decimal;

use crate::api::server::AppState;
use crate::domain::entities::landed_cost_voucher::{LandedCostVoucher, LandedCostItem};

#[derive(Deserialize)]
pub struct CreateLandedCostVoucherRequest {
    pub company_id: Uuid,
    pub voucher_number: String,
    pub posting_date: String,
    pub total_freight_charge: Option<Decimal>,
    pub items: Vec<CreateLandedCostItemRequest>,
}

#[derive(Deserialize)]
pub struct CreateLandedCostItemRequest {
    pub receipt_document_type: String,
    pub receipt_document_id: Uuid,
    pub item_id: Uuid,
    pub qty: Decimal,
    pub applicable_charges: Option<Decimal>,
}

pub async fn create_voucher(
    State(state): State<AppState>,
    Json(payload): Json<CreateLandedCostVoucherRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let posting_date = match chrono::NaiveDate::parse_from_str(&payload.posting_date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": "Invalid posting_date format, expected YYYY-MM-DD"
            })),
        )),
    };

    let voucher_id = Uuid::new_v4();

    let items = payload.items.into_iter().map(|i| LandedCostItem {
        id: Uuid::new_v4(),
        voucher_id,
        receipt_document_type: i.receipt_document_type,
        receipt_document_id: i.receipt_document_id,
        item_id: i.item_id,
        qty: i.qty,
        applicable_charges: i.applicable_charges,
        item_name: None,
    }).collect();

    let voucher = LandedCostVoucher {
        id: voucher_id,
        company_id: payload.company_id,
        voucher_number: payload.voucher_number,
        posting_date,
        total_freight_charge: payload.total_freight_charge,
        status: "Draft".to_string(),
        created_at: chrono::Utc::now(),
        items,
    };

    match state.landed_cost_voucher_service.create_voucher(voucher).await {
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

pub async fn list_vouchers(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.landed_cost_voucher_service.list_vouchers(company_id).await {
        Ok(vouchers) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": vouchers
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

pub async fn delete_voucher(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.landed_cost_voucher_service.delete_voucher(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Voucher deleted"
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
