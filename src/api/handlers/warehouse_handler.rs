use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::server::AppState;
use crate::domain::entities::warehouse::Warehouse;

#[derive(Deserialize)]
pub struct CreateWarehouseRequest {
    pub company_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub code: String,
    pub name: String,
    pub is_active: Option<bool>,
    pub is_group: Option<bool>,
    pub warehouse_type: Option<String>,
}

pub async fn create_warehouse(
    State(state): State<AppState>,
    Json(payload): Json<CreateWarehouseRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now();
    let warehouse = Warehouse {
        id: Uuid::new_v4(), // Service will set if nil, but we can set here
        company_id: payload.company_id,
        parent_id: payload.parent_id,
        code: payload.code,
        name: payload.name,
        is_active: payload.is_active.unwrap_or(true),
        is_group: payload.is_group.unwrap_or(false),
        is_frozen: false,
        warehouse_type: payload.warehouse_type.unwrap_or_else(|| "DEFAULT".to_string()),
        created_at: now,
        updated_at: now,
    };

    match state.warehouse_service.create_warehouse(warehouse).await {
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

pub async fn list_warehouses(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.warehouse_service.list_warehouses().await {
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

pub async fn get_stock_dashboard_kpi(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.warehouse_service.get_kpis(company_id).await {
        Ok(kpi) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": kpi
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

pub async fn delete_warehouse(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.warehouse_service.delete_warehouse(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Warehouse deleted"
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

pub async fn list_bin_balances(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    Ok(Json(serde_json::json!({
        "status": "success",
        "data": []
    })))
}
