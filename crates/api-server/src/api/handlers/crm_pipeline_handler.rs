//! CRM Pipeline API Handlers (QCRM-001, QCRM-002)

use axum::{
    extract::{Path, State},
    Extension, Json,
};
use management_system_core::domain::tenant::TenantContext;
use management_system_core::shared::errors::AppError;
use management_system_crm::domain::entities::lead::{CreateLeadRequest, UpdateLeadRequest};
use management_system_crm::domain::entities::opportunity::{
    CreateOpportunityRequest, UpdateOpportunityRequest,
};
use rust_decimal::Decimal;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::api::server::AppState;

// --- Leads ---

pub async fn list_leads(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let leads = state.crm_pipeline_service.list_leads(company_id).await?;

    Ok(Json(json!({
        "success": true,
        "data": leads
    })))
}

pub async fn create_lead(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(payload): Json<CreateLeadRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let lead = state.crm_pipeline_service.create_lead(company_id, payload).await?;

    Ok(Json(json!({
        "success": true,
        "data": lead
    })))
}

pub async fn get_lead(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let lead = state
        .crm_pipeline_service
        .get_lead(id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Lead {} not found", id)))?;

    Ok(Json(json!({
        "success": true,
        "data": lead
    })))
}

pub async fn update_lead(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateLeadRequest>,
) -> Result<Json<Value>, AppError> {
    let lead = state
        .crm_pipeline_service
        .update_lead(id, payload)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Lead {} not found", id)))?;

    Ok(Json(json!({
        "success": true,
        "data": lead
    })))
}

pub async fn delete_lead(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let deleted = state.crm_pipeline_service.delete_lead(id).await?;

    Ok(Json(json!({
        "success": true,
        "deleted": deleted
    })))
}

#[derive(Deserialize)]
pub struct ConvertLeadRequest {
    pub title: String,
    pub estimated_value: Decimal,
}

pub async fn convert_lead(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ConvertLeadRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let opportunity = state
        .crm_pipeline_service
        .convert_lead_to_opportunity(id, company_id, payload.title, payload.estimated_value)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": opportunity
    })))
}

// --- Opportunities & Pipeline ---

pub async fn list_opportunities(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let opportunities = state
        .crm_pipeline_service
        .list_opportunities(company_id)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": opportunities
    })))
}

pub async fn create_opportunity(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(payload): Json<CreateOpportunityRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let opp = state
        .crm_pipeline_service
        .create_opportunity(company_id, payload)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": opp
    })))
}

pub async fn get_opportunity(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let opp = state
        .crm_pipeline_service
        .get_opportunity(id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Opportunity {} not found", id)))?;

    Ok(Json(json!({
        "success": true,
        "data": opp
    })))
}

pub async fn update_opportunity(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateOpportunityRequest>,
) -> Result<Json<Value>, AppError> {
    let opp = state
        .crm_pipeline_service
        .update_opportunity(id, payload)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Opportunity {} not found", id)))?;

    Ok(Json(json!({
        "success": true,
        "data": opp
    })))
}

pub async fn delete_opportunity(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let deleted = state.crm_pipeline_service.delete_opportunity(id).await?;

    Ok(Json(json!({
        "success": true,
        "deleted": deleted
    })))
}

pub async fn get_pipeline_summary(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let summary = state
        .crm_pipeline_service
        .get_pipeline_summary(company_id)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": summary
    })))
}

pub async fn get_win_loss_analytics(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let report = state
        .crm_pipeline_service
        .get_win_loss_analytics(company_id)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": report
    })))
}
