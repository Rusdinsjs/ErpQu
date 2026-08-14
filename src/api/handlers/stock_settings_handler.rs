use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::api::server::AppState;
use crate::infrastructure::repositories::stock_settings_repository::UpsertStockSettingsDto;

pub async fn get_stock_settings(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_settings_repo.get_settings(company_id).await {
        Ok(settings) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": settings
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e.to_string()
            })),
        )),
    }
}

pub async fn upsert_stock_settings(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
    Json(payload): Json<UpsertStockSettingsDto>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.stock_settings_repo.upsert_settings(company_id, payload).await {
        Ok(settings) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": settings
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e.to_string()
            })),
        )),
    }
}
