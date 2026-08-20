use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::entities::user::UserClaims;
use management_system_core::domain::tenant::TenantContext;
use management_system_core::shared::errors::{AppError, AppResult};
use management_system_finance::domain::entities::journal::{
    CreateJournalEntryRequest, JournalEntry, JournalEntryDetail, ReverseJournalRequest,
};

#[derive(Deserialize)]
pub struct ListParams {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

pub async fn list_journals(
    State(state): State<AppState>,
    Query(params): Query<ListParams>,
) -> AppResult<Json<Vec<JournalEntry>>> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50);
    let _offset = (page - 1) * limit;

    let entries = state.journal_service.list_journal_entries().await?;
    Ok(Json(entries))
}

pub async fn get_journal_details(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<JournalEntryDetail>> {
    let entry = state
        .journal_service
        .get_journal_entry_detail(id)
        .await?
        .ok_or_else(|| AppError::NotFound("Journal entry not found".to_string()))?;
    Ok(Json(entry))
}

pub async fn create_journal(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Json(mut req): Json<CreateJournalEntryRequest>,
) -> AppResult<Json<JournalEntryDetail>> {
    let user_id = claims.user_id();
    if req.company_id.is_none() {
        req.company_id = tenant_ctx.company_id;
    }
    let tx_num = format!("JE-{}", Uuid::new_v4().to_string()[..8].to_uppercase());
    let entry = state
        .journal_service
        .create_journal_entry(tx_num, req, Some(user_id))
        .await?;
    Ok(Json(entry))
}

pub async fn submit_journal(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    state.journal_service.submit_journal_entry(id).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Journal entry submitted for approval"
    })))
}

pub async fn approve_journal(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let user_id = claims.user_id();
    state
        .journal_service
        .approve_journal_entry(id, user_id)
        .await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Journal entry approved successfully"
    })))
}

pub async fn post_journal(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let user_id = claims.user_id();
    let company_id = tenant_ctx.company_id.unwrap_or_else(|| {
        // Fallback default company if not set in header
        Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()
    });

    state
        .journal_service
        .post_journal_entry(id, company_id, Some(user_id))
        .await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Journal entry posted to general ledger successfully"
    })))
}

pub async fn reverse_journal(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Extension(tenant_ctx): Extension<TenantContext>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ReverseJournalRequest>,
) -> AppResult<Json<JournalEntryDetail>> {
    let user_id = claims.user_id();
    let company_id = tenant_ctx
        .company_id
        .unwrap_or_else(|| Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap());

    let reversal_detail = state
        .journal_service
        .reverse_journal_entry(id, company_id, payload.reason, Some(user_id))
        .await?;

    Ok(Json(reversal_detail))
}

pub async fn cancel_journal(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    state.journal_service.cancel_journal_entry(id).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Journal entry cancelled successfully"
    })))
}
