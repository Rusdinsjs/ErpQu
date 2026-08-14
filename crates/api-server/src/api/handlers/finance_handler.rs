use axum::{
    extract::{Path, State},
    http::HeaderMap,
    Extension, Json,
};
use serde_json::{json, Value};
use uuid::Uuid;
use management_system_core::domain::entities::UserClaims as Claims;
use management_system_core::domain::tenant::TenantContext;

use crate::api::server::AppState;
use management_system_core::shared::errors::AppError;
use management_system_finance::domain::entities::finance::{
    CreateAccountRequest, CreateCashBankTransactionRequest, CreateExpenseRequest,
    CreatePurchaseBillRequest, CreatePurchaseOrderRequest, CreatePurchaseQuoteRequest,
    CreatePurchaseShipmentRequest, CreateSalesInvoiceRequest, CreateSalesOrderRequest,
    CreateSalesQuoteRequest, CreateSalesShipmentRequest, UpdateAccountRequest,
};
use management_system_finance::domain::entities::commercial_graph::{
    CreatePurchaseReceiptRequest,
};

/// Create a new account
pub async fn create_account(
    State(state): State<AppState>,
    Json(payload): Json<CreateAccountRequest>,
) -> Result<Json<Value>, AppError> {
    let account = state.finance_service.create_account(payload).await?;

    Ok(Json(json!({
        "success": true,
        "data": account
    })))
}

/// List all accounts
pub async fn list_accounts(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let accounts = state.finance_service.list_accounts().await?;

    Ok(Json(json!({
        "success": true,
        "data": accounts
    })))
}

/// List accounts tree
pub async fn list_accounts_tree(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let tree = state.finance_service.get_account_tree().await?;

    Ok(Json(json!({
        "success": true,
        "data": tree
    })))
}

/// Update account
pub async fn update_account(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateAccountRequest>,
) -> Result<Json<Value>, AppError> {
    let account = state.finance_service.update_account(id, payload).await?;

    Ok(Json(json!({
        "success": true,
        "data": account
    })))
}

// --- Operational Finance Handlers ---

pub async fn list_sales_invoices(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let invoices = state.finance_service.list_sales_invoices().await?;
    Ok(Json(json!({ "success": true, "data": invoices })))
}

pub async fn list_purchase_bills(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let bills = state.finance_service.list_purchase_bills().await?;
    Ok(Json(json!({ "success": true, "data": bills })))
}

pub async fn list_expenses(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let expenses = state.finance_service.list_expenses().await?;
    Ok(Json(json!({ "success": true, "data": expenses })))
}

pub async fn list_cash_bank_transactions(
    State(_state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let transactions: Vec<serde_json::Value> = vec![]; // TODO: implement list_cash_bank_transactions
    Ok(Json(json!({ "success": true, "data": transactions })))
}

pub async fn create_sales_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Extension(tenant_ctx): Extension<TenantContext>,
    headers: HeaderMap,
    Json(payload): Json<CreateSalesInvoiceRequest>,
) -> Result<Json<Value>, AppError> {
    let idempotency_key = headers
        .get("idempotency-key")
        .and_then(|value| value.to_str().ok())
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| AppError::BadRequest("Idempotency-Key header is required".to_string()))?
        .to_string();

    let company_id = tenant_ctx.company_id.or_else(|| {
        claims.org.as_deref().and_then(|id| Uuid::parse_str(id).ok())
    }).ok_or_else(|| AppError::BadRequest("Company ID / Tenant Context is required for sales invoice".to_string()))?;

    let actor_id = claims.user_id();

    let invoice = state
        .finance_service
        .create_sales_invoice(
            actor_id,
            company_id,
            idempotency_key,
            payload,
        )
        .await?;
    Ok(Json(json!({ "success": true, "data": invoice })))
}

pub async fn get_sales_invoice(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let invoice = state.finance_service.get_sales_invoice_detail(id).await?;
    Ok(Json(json!({ "success": true, "data": invoice })))
}

pub async fn update_sales_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(payload): Json<CreateSalesInvoiceRequest>,
) -> Result<Json<Value>, AppError> {
    let idempotency_key = headers
        .get("idempotency-key")
        .and_then(|value| value.to_str().ok())
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| AppError::BadRequest("Idempotency-Key header is required".to_string()))?
        .to_string();

    let company_id = tenant_ctx.company_id.or_else(|| {
        claims.org.as_deref().and_then(|id| Uuid::parse_str(id).ok())
    }).ok_or_else(|| AppError::BadRequest("Company ID / Tenant Context is required for sales invoice".to_string()))?;

    let actor_id = claims.user_id();

    let invoice = state
        .finance_service
        .update_sales_invoice(
            actor_id,
            company_id,
            idempotency_key,
            id,
            payload,
        )
        .await?;
    Ok(Json(json!({ "success": true, "data": invoice })))
}

pub async fn delete_sales_invoice(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    state.finance_service.delete_sales_invoice(id).await?;
    Ok(Json(
        json!({ "success": true, "message": "Sales invoice deleted successfully" }),
    ))
}

pub async fn create_purchase_bill(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreatePurchaseBillRequest>,
) -> Result<Json<Value>, AppError> {
    let bill = state.finance_service.create_purchase_bill(Some(claims.user_id()), payload).await?;
    Ok(Json(json!({ "success": true, "data": bill })))
}

pub async fn create_expense(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateExpenseRequest>,
) -> Result<Json<Value>, AppError> {
    let expense = state.finance_service.create_expense(Some(claims.user_id()), payload).await?;
    Ok(Json(json!({ "success": true, "data": expense })))
}

pub async fn create_cash_bank_transaction(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateCashBankTransactionRequest>,
) -> Result<Json<Value>, AppError> {
    let tx = state
        .finance_service
        .create_cash_bank_transaction(Some(claims.user_id()), payload)
        .await?;
    Ok(Json(json!({ "success": true, "data": tx })))
}

pub async fn list_sales_quotes(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let quotes = state.finance_service.list_sales_quotes().await?;
    Ok(Json(json!({ "success": true, "data": quotes })))
}

pub async fn create_sales_quote(
    State(state): State<AppState>,
    Json(payload): Json<CreateSalesQuoteRequest>,
) -> Result<Json<Value>, AppError> {
    let quote = state.finance_service.create_sales_quote(payload).await?;
    Ok(Json(json!({ "success": true, "data": quote })))
}

pub async fn list_sales_orders(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let orders = state.finance_service.list_sales_orders().await?;
    Ok(Json(json!({ "success": true, "data": orders })))
}

pub async fn create_sales_order(
    State(state): State<AppState>,
    Json(payload): Json<CreateSalesOrderRequest>,
) -> Result<Json<Value>, AppError> {
    let order = state.finance_service.create_sales_order(payload).await?;
    Ok(Json(json!({ "success": true, "data": order })))
}

pub async fn list_sales_shipments(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let shipments = state.finance_service.list_sales_shipments().await?;
    Ok(Json(json!({ "success": true, "data": shipments })))
}

pub async fn create_sales_shipment(
    State(state): State<AppState>,
    Json(payload): Json<CreateSalesShipmentRequest>,
) -> Result<Json<Value>, AppError> {
    let shipment = state.finance_service.create_sales_shipment(payload).await?;
    Ok(Json(json!({ "success": true, "data": shipment })))
}

// --- Purchase Handlers ---

pub async fn list_purchase_quotes(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let quotes = state.finance_service.list_purchase_quotes().await?;
    Ok(Json(json!({ "success": true, "data": quotes })))
}

pub async fn create_purchase_quote(
    State(state): State<AppState>,
    Json(payload): Json<CreatePurchaseQuoteRequest>,
) -> Result<Json<Value>, AppError> {
    let quote = state.finance_service.create_purchase_quote(payload).await?;
    Ok(Json(json!({ "success": true, "data": quote })))
}

pub async fn list_purchase_orders(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let orders = state.finance_service.list_purchase_orders().await?;
    Ok(Json(json!({ "success": true, "data": orders })))
}

pub async fn create_purchase_order(
    State(state): State<AppState>,
    Json(payload): Json<CreatePurchaseOrderRequest>,
) -> Result<Json<Value>, AppError> {
    let order = state.finance_service.create_purchase_order(payload).await?;
    Ok(Json(json!({ "success": true, "data": order })))
}

pub async fn list_purchase_shipments(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let shipments = state.finance_service.list_purchase_shipments().await?;
    Ok(Json(json!({ "success": true, "data": shipments })))
}

pub async fn create_purchase_shipment(
    State(state): State<AppState>,
    Json(payload): Json<CreatePurchaseShipmentRequest>,
) -> Result<Json<Value>, AppError> {
    let shipment = state
        .finance_service
        .create_purchase_shipment(payload)
        .await?;
    Ok(Json(json!({ "success": true, "data": shipment })))
}

pub async fn list_purchase_receipts(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let receipts = state.finance_service.list_purchase_receipts(company_id).await?;
    Ok(Json(json!({ "success": true, "data": receipts })))
}

pub async fn get_purchase_receipt(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let receipt = state.finance_service.get_purchase_receipt(id).await?;
    Ok(Json(json!({ "success": true, "data": receipt })))
}

pub async fn create_purchase_receipt(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreatePurchaseReceiptRequest>,
) -> Result<Json<Value>, AppError> {
    let receipt = state.finance_service.create_purchase_receipt(payload, Some(claims.user_id())).await?;
    Ok(Json(json!({ "success": true, "data": receipt })))
}

pub async fn submit_purchase_receipt(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    state.stock_document_service.submit_purchase_receipt(id, Some(claims.user_id())).await?;
    Ok(Json(json!({ "success": true })))
}

pub async fn submit_sales_shipment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    state.stock_document_service.submit_sales_shipment(id, Some(claims.user_id())).await?;
    Ok(Json(json!({ "success": true })))
}
