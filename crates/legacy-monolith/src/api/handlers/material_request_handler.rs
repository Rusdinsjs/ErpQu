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
use crate::domain::entities::material_request::{MaterialRequest, MaterialRequestItem};

#[derive(Deserialize)]
pub struct CreateMaterialRequestPayload {
    pub company_id: Uuid,
    pub transaction_date: String, // format YYYY-MM-DD
    pub material_request_type: String,
    pub voucher_no: String,
    pub required_by_date: Option<String>,
    pub remarks: Option<String>,
    pub items: Vec<CreateMaterialRequestItemPayload>,
}

#[derive(Deserialize)]
pub struct CreateMaterialRequestItemPayload {
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub qty: Decimal,
}

pub async fn create_material_request(
    State(state): State<AppState>,
    Json(payload): Json<CreateMaterialRequestPayload>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let transaction_date = NaiveDate::parse_from_str(&payload.transaction_date, "%Y-%m-%d").unwrap_or_else(|_| chrono::Utc::now().naive_utc().date());
    let required_by_date = payload.required_by_date.and_then(|d| NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok());

    let request = MaterialRequest {
        id: Uuid::nil(),
        company_id: payload.company_id,
        transaction_date,
        material_request_type: payload.material_request_type,
        voucher_no: payload.voucher_no,
        required_by_date,
        status: "DRAFT".to_string(),
        remarks: payload.remarks,
        created_at: chrono::Utc::now(),
        created_by: None,
        updated_at: chrono::Utc::now(),
        updated_by: None,
    };

    let items: Vec<MaterialRequestItem> = payload.items.into_iter().map(|i| MaterialRequestItem {
        id: Uuid::nil(),
        material_request_id: Uuid::nil(),
        item_id: i.item_id,
        warehouse_id: i.warehouse_id,
        qty: i.qty,
        ordered_qty: Decimal::ZERO,
        received_qty: Decimal::ZERO,
        created_at: chrono::Utc::now(),
    }).collect();

    match state.material_request_service.create_request(request, items).await {
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

pub async fn list_material_requests(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.material_request_service.list_requests(company_id).await {
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

pub async fn get_material_request(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.material_request_service.get_request(id).await {
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

pub async fn approve_material_request(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.material_request_service.approve_request(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Material Request approved successfully"
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
