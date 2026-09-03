//! Multi-Currency Exchange Rate API Handlers (QACC-008)

use axum::{
    extract::{Query, State},
    Extension, Json,
};
use chrono::NaiveDate;
use management_system_core::domain::tenant::TenantContext;
use management_system_core::shared::errors::AppError;
use management_system_finance::{ConversionResult, ExchangeRate, SetExchangeRateRequest};
use rust_decimal::Decimal;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::api::server::AppState;

#[derive(Deserialize)]
pub struct LatestRateQuery {
    pub from: String,
    pub to: String,
    pub date: Option<NaiveDate>,
}

#[derive(Deserialize)]
pub struct ConvertCurrencyRequest {
    pub from_currency: String,
    pub to_currency: String,
    pub amount: Decimal,
    pub date: Option<NaiveDate>,
}

pub async fn set_exchange_rate(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(mut payload): Json<SetExchangeRateRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    payload.company_id = company_id;

    let rate = state.multi_currency_service.set_rate(&payload).await?;

    Ok(Json(json!({
        "success": true,
        "data": rate
    })))
}

pub async fn get_latest_rate(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Query(query): Query<LatestRateQuery>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let target_date = query.date.unwrap_or_else(|| chrono::Utc::now().date_naive());

    let rate = state
        .multi_currency_service
        .get_rate(company_id, &query.from, &query.to, target_date)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": {
            "from_currency": query.from,
            "to_currency": query.to,
            "effective_date": target_date,
            "exchange_rate": rate
        }
    })))
}

pub async fn convert_currency(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(payload): Json<ConvertCurrencyRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let target_date = payload.date.unwrap_or_else(|| chrono::Utc::now().date_naive());

    let result = state
        .multi_currency_service
        .convert(
            company_id,
            payload.amount,
            &payload.from_currency,
            &payload.to_currency,
            target_date,
        )
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": result
    })))
}
