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
use crate::domain::entities::item_tracking::{SerialNumber, Batch};

#[derive(Deserialize)]
pub struct CreateSerialNumberRequest {
    pub company_id: Uuid,
    pub serial_no: String,
    pub item_id: Uuid,
    pub warehouse_id: Option<Uuid>,
    pub status: Option<String>,
    pub warranty_expiry_date: Option<NaiveDate>,
}

#[derive(Deserialize)]
pub struct CreateBatchRequest {
    pub company_id: Uuid,
    pub batch_no: String,
    pub item_id: Uuid,
    pub manufacturing_date: Option<NaiveDate>,
    pub expiry_date: Option<NaiveDate>,
    pub qty: Option<Decimal>,
    pub status: Option<String>,
}

// Serial Number Handlers
pub async fn create_serial_number(
    State(state): State<AppState>,
    Json(payload): Json<CreateSerialNumberRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let sn = SerialNumber {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        serial_no: payload.serial_no,
        item_id: payload.item_id,
        warehouse_id: payload.warehouse_id,
        status: payload.status.or(Some("Active".to_string())),
        warranty_expiry_date: payload.warranty_expiry_date,
        created_at: chrono::Utc::now(),
        item_name: None,
        warehouse_name: None,
    };

    match state.item_tracking_service.create_serial_number(sn).await {
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

pub async fn list_serial_numbers(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.item_tracking_service.list_serial_numbers(company_id).await {
        Ok(sns) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": sns
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

pub async fn delete_serial_number(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.item_tracking_service.delete_serial_number(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Serial Number deleted"
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

// Batch Handlers
pub async fn create_batch(
    State(state): State<AppState>,
    Json(payload): Json<CreateBatchRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let batch = Batch {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        batch_no: payload.batch_no,
        item_id: payload.item_id,
        manufacturing_date: payload.manufacturing_date,
        expiry_date: payload.expiry_date,
        qty: payload.qty,
        status: payload.status.or(Some("Active".to_string())),
        created_at: chrono::Utc::now(),
        item_name: None,
    };

    match state.item_tracking_service.create_batch(batch).await {
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

pub async fn list_batches(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.item_tracking_service.list_batches(company_id).await {
        Ok(batches) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": batches
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

pub async fn delete_batch(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.item_tracking_service.delete_batch(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Batch deleted"
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
