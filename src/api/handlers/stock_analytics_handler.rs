use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::server::AppState;

#[derive(Deserialize)]
pub struct AnalyticsQuery {
    pub days: Option<i32>,
}

pub async fn get_warehouse_valuations(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_analytics_service.get_warehouse_valuations(company_id).await {
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

pub async fn get_item_group_valuations(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_analytics_service.get_item_group_valuations(company_id).await {
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

pub async fn get_movement_trends(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
    Query(query): Query<AnalyticsQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let days = query.days.unwrap_or(30); // Default to last 30 days
    match state.stock_analytics_service.get_movement_trends(company_id, days).await {
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
