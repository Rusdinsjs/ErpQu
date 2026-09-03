use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use chrono::NaiveDate;
use management_system_core::domain::tenant::TenantContext;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::shared::errors::AppError;

#[derive(Deserialize, Default)]
pub struct LedgerQueryParams {
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Deserialize, Default)]
pub struct BalanceSheetQueryParams {
    pub as_of_date: Option<NaiveDate>,
}

pub async fn get_general_ledger(
    State(state): State<AppState>,
    Path(account_id): Path<Uuid>,
    Query(params): Query<LedgerQueryParams>,
) -> Result<Json<Value>, AppError> {
    let ledger = state
        .finance_service
        .get_general_ledger(account_id, params.start_date, params.end_date)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": ledger
    })))
}

pub async fn get_trial_balance(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Query(params): Query<LedgerQueryParams>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let tb = state
        .finance_service
        .get_trial_balance(company_id, params.start_date, params.end_date)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": tb
    })))
}

pub async fn get_balance_sheet(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Query(params): Query<BalanceSheetQueryParams>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let bs = state
        .finance_service
        .get_balance_sheet(company_id, params.as_of_date)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": bs
    })))
}

pub async fn get_income_statement(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Query(params): Query<LedgerQueryParams>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let i_s = state
        .finance_service
        .get_income_statement(company_id, params.start_date, params.end_date)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": i_s
    })))
}
