//! Budget API Handlers (QACC-010)

use axum::{
    extract::{Query, State},
    Extension, Json,
};
use management_system_core::domain::tenant::TenantContext;
use management_system_core::shared::errors::AppError;
use management_system_finance::domain::entities::budget::CreateBudgetRequest;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::api::server::AppState;

#[derive(Deserialize, Default)]
pub struct BudgetQueryParams {
    pub fiscal_year: Option<String>,
}

pub async fn list_budgets(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let budgets = state.finance_service.list_budgets(company_id).await?;

    Ok(Json(json!({
        "success": true,
        "data": budgets
    })))
}

pub async fn create_budget(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(payload): Json<CreateBudgetRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let budget = state
        .finance_service
        .create_budget(company_id, payload)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": budget
    })))
}

pub async fn get_budget_variance(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Query(params): Query<BudgetQueryParams>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let variance = state
        .finance_service
        .get_budget_variance(company_id, params.fiscal_year.as_deref())
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": variance
    })))
}
