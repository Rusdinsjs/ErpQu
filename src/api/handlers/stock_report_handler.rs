use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::server::AppState;

#[derive(Deserialize)]
pub struct StockLedgerQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub item_id: Option<Uuid>,
    pub warehouse_id: Option<Uuid>,
}

#[derive(Deserialize)]
pub struct StockBalanceQuery {
    pub as_on: Option<String>,
    pub item_id: Option<Uuid>,
    pub warehouse_id: Option<Uuid>,
}

pub async fn get_stock_ledger(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
    Query(params): Query<StockLedgerQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let start_date = params.start_date.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok());
    let end_date = params.end_date.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok());

    match state.stock_report_service.get_stock_ledger(company_id, start_date, end_date, params.item_id, params.warehouse_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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

pub async fn get_stock_balance(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
    Query(params): Query<StockBalanceQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let as_on = params.as_on.and_then(|d| chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok());

    match state.stock_report_service.get_stock_balance(company_id, as_on, params.item_id, params.warehouse_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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

pub async fn get_stock_ageing(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_report_service.get_stock_ageing(company_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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

pub async fn get_stock_projected_qty(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_report_service.get_stock_projected_qty(company_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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

pub async fn get_stock_summary(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_report_service.get_stock_summary(company_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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

pub async fn get_batch_balance(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_report_service.get_batch_balance(company_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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

pub async fn get_serial_no_status(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_report_service.get_serial_no_status(company_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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

pub async fn get_item_shortage(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_report_service.get_item_shortage(company_id).await {
        Ok(data) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": data
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
