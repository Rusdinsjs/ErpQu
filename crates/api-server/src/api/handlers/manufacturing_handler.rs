//! Manufacturing & Production Order API Handlers (QMFG-001, QMFG-003)

use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use management_system_core::domain::tenant::TenantContext;
use management_system_core::shared::errors::AppError;
use management_system_ops::domain::manufacturing_pos::{
    CreateBomRequest, CreateProductionOrderRequest,
};
use rust_decimal::Decimal;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::api::server::AppState;

// --- BOM ---

pub async fn list_boms(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let boms = state.bom_service.list_boms(company_id).await?;

    Ok(Json(json!({
        "success": true,
        "data": boms
    })))
}

pub async fn create_bom(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(payload): Json<CreateBomRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let bom = state.bom_service.create_bom(company_id, payload).await?;

    Ok(Json(json!({
        "success": true,
        "data": bom
    })))
}

pub async fn get_bom(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let (bom, items) = state
        .bom_service
        .get_bom(id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("BOM {} not found", id)))?;

    Ok(Json(json!({
        "success": true,
        "data": {
            "bom": bom,
            "items": items
        }
    })))
}

#[derive(Deserialize)]
pub struct RequirementsQuery {
    pub target_qty: Decimal,
}

pub async fn calculate_material_requirements(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(query): Query<RequirementsQuery>,
) -> Result<Json<Value>, AppError> {
    let requirements = state
        .bom_service
        .calculate_material_requirements(id, query.target_qty)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": requirements
    })))
}

// --- Production Orders ---

pub async fn list_production_orders(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let orders = state
        .bom_service
        .list_production_orders(company_id)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": orders
    })))
}

pub async fn create_production_order(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(payload): Json<CreateProductionOrderRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let order = state
        .bom_service
        .create_production_order(company_id, payload)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": order
    })))
}

pub async fn get_production_order(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let order = state
        .bom_service
        .get_production_order(id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Production order {} not found", id)))?;

    Ok(Json(json!({
        "success": true,
        "data": order
    })))
}

#[derive(Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
}

pub async fn update_production_order_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<Value>, AppError> {
    let order = state
        .bom_service
        .update_production_order_status(id, &payload.status)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Production order {} not found", id)))?;

    Ok(Json(json!({
        "success": true,
        "data": order
    })))
}
