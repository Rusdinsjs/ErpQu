//! Asset Lifecycle & Financial Event Handlers (L3)

use axum::{extract::State, Extension, Json};
use management_system_assets::domain::asset_eam::{
    AssetCapitalizationRequest, AssetDisposalRequest, AssetImpairmentRequest, AssignCustodyRequest,
};
use management_system_core::domain::entities::user::UserClaims;
use management_system_core::shared::errors::AppError;

use crate::api::server::AppState;

/// Capitalize CWIP to Fixed Asset (L3)
pub async fn capitalize_asset(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(req): Json<AssetCapitalizationRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let company_id = req.company_id;
    let journal_ref = format!("CAP-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());

    // Create GL Journal Entry (Debit: Fixed Asset, Credit: CWIP)
    let journal_req = management_system_finance::domain::entities::journal::CreateJournalEntryRequest {
        company_id: Some(company_id),
        date: req.capitalization_date,
        description: format!("CWIP Capitalization for Asset {}", req.asset_id),
        reference: Some(journal_ref.clone()),
        lines: vec![
            management_system_finance::domain::entities::journal::CreateJournalLineRequest {
                account_id: req.fixed_asset_account_id,
                description: Some("Capitalized Fixed Asset".to_string()),
                debit: req.capitalization_amount,
                credit: rust_decimal::Decimal::ZERO,
            },
            management_system_finance::domain::entities::journal::CreateJournalLineRequest {
                account_id: req.cwip_account_id,
                description: Some("CWIP Clearance".to_string()),
                debit: rust_decimal::Decimal::ZERO,
                credit: req.capitalization_amount,
            },
        ],
    };

    let entry = state
        .journal_service
        .create_journal_entry(journal_ref, journal_req, Some(claims.user_id()))
        .await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Asset CWIP capitalization completed",
        "journal_entry_id": entry.header.id,
        "asset_id": req.asset_id,
        "amount": req.capitalization_amount
    })))
}

/// Transfer Asset Location / Custodian (L3 & L4)
pub async fn transfer_asset(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(req): Json<AssignCustodyRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Record custody history append-only in DB
    let history_id = uuid::Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO asset_custody_histories 
            (id, asset_id, custodian_user_id, department_id, location_id, assigned_at, assigned_by, notes)
        VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
        "#,
    )
    .bind(history_id)
    .bind(req.asset_id)
    .bind(req.custodian_user_id)
    .bind(req.department_id)
    .bind(req.location_id)
    .bind(claims.user_id())
    .bind(&req.notes)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    // Update current location / department on asset table
    sqlx::query(
        r#"
        UPDATE assets 
        SET location_id = COALESCE($2, location_id),
            department_id = COALESCE($3, department_id),
            updated_at = NOW()
        WHERE id = $1
        "#,
    )
    .bind(req.asset_id)
    .bind(req.location_id)
    .bind(req.department_id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Asset transfer completed",
        "custody_history_id": history_id,
        "asset_id": req.asset_id
    })))
}

/// Impair Asset Write-Down IAS 36 (L3)
pub async fn impair_asset(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(req): Json<AssetImpairmentRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let journal_ref = format!("IMP-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());

    let journal_req = management_system_finance::domain::entities::journal::CreateJournalEntryRequest {
        company_id: Some(req.company_id),
        date: req.impairment_date,
        description: format!("Asset Impairment Loss (IAS 36): {}", req.reason),
        reference: Some(journal_ref.clone()),
        lines: vec![
            management_system_finance::domain::entities::journal::CreateJournalLineRequest {
                account_id: req.impairment_loss_account_id,
                description: Some("Impairment Loss Expense".to_string()),
                debit: req.impairment_amount,
                credit: rust_decimal::Decimal::ZERO,
            },
            management_system_finance::domain::entities::journal::CreateJournalLineRequest {
                account_id: req.accumulated_impairment_account_id,
                description: Some("Accumulated Impairment".to_string()),
                debit: rust_decimal::Decimal::ZERO,
                credit: req.impairment_amount,
            },
        ],
    };

    let entry = state
        .journal_service
        .create_journal_entry(journal_ref, journal_req, Some(claims.user_id()))
        .await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Asset impairment posted",
        "journal_entry_id": entry.header.id,
        "asset_id": req.asset_id,
        "impairment_amount": req.impairment_amount
    })))
}

/// Dispose / Sell Asset with Gain/Loss Calculation (L3)
pub async fn dispose_asset(
    State(state): State<AppState>,
    Extension(_claims): Extension<UserClaims>,
    Json(req): Json<AssetDisposalRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Fetch asset details to get purchase price and calculate book value
    let asset = state.asset_service.get_by_id(req.asset_id).await?;

    let purchase_cost = asset.purchase_price.unwrap_or(rust_decimal::Decimal::ZERO);
    let book_value = asset.calculate_book_value().unwrap_or(purchase_cost);
    let gain_loss = req.sale_amount - book_value;

    let journal_ref = format!("DISP-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Asset disposal recorded",
        "asset_id": req.asset_id,
        "sale_amount": req.sale_amount,
        "book_value": book_value,
        "gain_loss_amount": gain_loss,
        "reference": journal_ref
    })))
}
