use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use rust_decimal::Decimal;

use crate::api::server::AppState;
use crate::domain::entities::uom::{Uom, UomConversionFactor};

#[derive(Deserialize)]
pub struct CreateUomRequest {
    pub company_id: Uuid,
    pub uom_name: String,
    pub must_be_whole_number: Option<bool>,
}

#[derive(Deserialize)]
pub struct CreateConversionRequest {
    pub company_id: Uuid,
    pub from_uom_id: Uuid,
    pub to_uom_id: Uuid,
    pub value: Decimal,
}

// UOM Handlers
pub async fn create_uom(
    State(state): State<AppState>,
    Json(payload): Json<CreateUomRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let uom = Uom {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        uom_name: payload.uom_name,
        must_be_whole_number: payload.must_be_whole_number.unwrap_or(false),
        created_at: chrono::Utc::now(),
    };

    match state.uom_service.create_uom(uom).await {
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

pub async fn list_uoms(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.uom_service.list_uoms(company_id).await {
        Ok(uoms) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": uoms
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

pub async fn delete_uom(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.uom_service.delete_uom(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "UOM deleted"
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

// UOM Conversion Factor Handlers
pub async fn create_conversion(
    State(state): State<AppState>,
    Json(payload): Json<CreateConversionRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let conversion = UomConversionFactor {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        from_uom_id: payload.from_uom_id,
        to_uom_id: payload.to_uom_id,
        value: payload.value,
        created_at: chrono::Utc::now(),
        from_uom_name: None,
        to_uom_name: None,
    };

    match state.uom_service.create_conversion(conversion).await {
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

pub async fn list_conversions(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.uom_service.list_conversions(company_id).await {
        Ok(conversions) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": conversions
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

pub async fn delete_conversion(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.uom_service.delete_conversion(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Conversion deleted"
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
