use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Extension, Json,
};
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::tenant::TenantContext;
use management_system_core::shared::errors::AppError;
use management_system_finance::domain::entities::efaktur::TaxInvoiceRecord;

#[derive(Debug, Deserialize, Default)]
pub struct DateFilterParams {
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaxInvoiceRequest {
    pub sales_invoice_id: Option<Uuid>,
    pub tax_invoice_number: String,
    pub npwp_buyer: String,
    pub name_buyer: String,
    pub tax_base: Decimal,
    pub vat_rate: Option<Decimal>,
    pub effective_date: NaiveDate,
}

pub async fn list_tax_invoices(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Query(params): Query<DateFilterParams>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let invoices = state
        .finance_service
        .list_tax_invoices(company_id, params.start_date, params.end_date)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": invoices
    })))
}

pub async fn create_tax_invoice(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(payload): Json<CreateTaxInvoiceRequest>,
) -> Result<Json<Value>, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let rate = payload.vat_rate.unwrap_or_else(|| Decimal::from(11));
    let vat_amount = (payload.tax_base * (rate / Decimal::from(100))).round_dp(0);

    let record = TaxInvoiceRecord {
        id: Uuid::new_v4(),
        company_id,
        sales_invoice_id: payload.sales_invoice_id,
        tax_invoice_number: payload.tax_invoice_number,
        npwp_buyer: payload.npwp_buyer,
        name_buyer: payload.name_buyer,
        tax_base: payload.tax_base,
        vat_amount,
        vat_rate: rate,
        effective_date: payload.effective_date,
        status: "POSTED".to_string(),
        created_at: chrono::Utc::now(),
    };

    let created = state.finance_service.create_tax_invoice(&record).await?;

    Ok(Json(json!({
        "success": true,
        "data": created
    })))
}

pub async fn export_djp_csv(
    State(state): State<AppState>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Query(params): Query<DateFilterParams>,
) -> Result<Response, AppError> {
    let company_id = tenant_ctx.company_id.unwrap_or(tenant_ctx.tenant_id);
    let csv_content = state
        .finance_service
        .export_djp_csv(company_id, params.start_date, params.end_date)
        .await?;

    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/csv; charset=utf-8"),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_static("attachment; filename=\"efaktur_djp_export.csv\""),
    );

    Ok((StatusCode::OK, headers, csv_content).into_response())
}
