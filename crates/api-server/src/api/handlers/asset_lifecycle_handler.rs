//! Asset Lifecycle HTTP Handler (QAST-004, QAST-005, L3, L4)
//!
//! Exposes API endpoints for Asset Capitalization, Asset Transfer (append-only custody log),
//! Asset Impairment (IAS 36), Asset Disposal (with Gain/Loss), and Custody History.

use axum::{
    extract::{Path, State},
    Extension, Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_assets::{
    AssetCapitalizationRequest, AssetCustodyHistory, AssetDisposalRequest, AssetEamEngine,
    AssetEamRepository, AssetImpairmentRequest,
};
use management_system_core::domain::errors::DomainError;
use management_system_core::domain::request_context::RequestContext;
use management_system_core::shared::errors::AppResult;
use management_system_finance::domain::entities::journal::{
    CreateJournalEntryRequest, CreateJournalLineRequest,
};

#[derive(Debug, Deserialize)]
pub struct TransferAssetApiRequest {
    pub to_location_id: Option<Uuid>,
    pub to_department_id: Option<Uuid>,
    pub to_custodian_id: Option<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LifecycleActionResponse {
    pub success: bool,
    pub message: String,
    pub record_id: Uuid,
    pub journal_entry_id: Option<Uuid>,
}

/// Capitalize CWIP to Fixed Asset (L3)
/// POST /api/v1/assets/:id/capitalize
pub async fn capitalize_asset(
    State(state): State<AppState>,
    Extension(_ctx): Extension<RequestContext>,
    Path(asset_id): Path<Uuid>,
    Json(req): Json<AssetCapitalizationRequest>,
) -> AppResult<Json<LifecycleActionResponse>> {
    let asset = state
        .asset_service
        .get_by_id(asset_id)
        .await?;

    if req.capitalization_amount <= rust_decimal::Decimal::ZERO {
        return Err(DomainError::business_rule(
            "invalid_capitalization_amount",
            "Capitalization amount must be greater than zero",
        ).into());
    }

    // Post GL Journal Entry: Debit Fixed Asset Account, Credit CWIP Account
    let journal_req = CreateJournalEntryRequest {
        company_id: asset.company_id,
        date: req.capitalization_date,
        description: format!("Capitalization: {} ({})", asset.name, asset.asset_code),
        reference: Some(asset.asset_code.clone()),
        lines: vec![
            CreateJournalLineRequest {
                account_id: req.fixed_asset_account_id,
                description: Some(format!("Fixed Asset Capitalization: {}", asset.name)),
                debit: req.capitalization_amount,
                credit: rust_decimal::Decimal::ZERO,
            },
            CreateJournalLineRequest {
                account_id: req.cwip_account_id,
                description: Some(format!("CWIP Clearance: {}", asset.name)),
                debit: rust_decimal::Decimal::ZERO,
                credit: req.capitalization_amount,
            },
        ],
    };

    let tx_num = format!("CAP-{}", Uuid::new_v4().to_string()[..8].to_uppercase());
    let journal = state
        .journal_service
        .create_journal_entry(tx_num, journal_req, None)
        .await?;

    // Update asset purchase price and status to 'in_use'
    sqlx::query(
        "UPDATE assets SET purchase_price = COALESCE(purchase_price, 0) + $1, status = 'in_use', updated_at = NOW() WHERE id = $2",
    )
    .bind(req.capitalization_amount)
    .bind(asset_id)
    .execute(&state.pool)
    .await
    .map_err(|e| DomainError::Database(e.to_string()))?;

    Ok(Json(LifecycleActionResponse {
        success: true,
        message: format!("Asset {} successfully capitalized", asset.asset_code),
        record_id: asset_id,
        journal_entry_id: Some(journal.header.id),
    }))
}

/// Transfer asset and record append-only custody history (L3, L4)
/// POST /api/v1/assets/:id/transfer
pub async fn transfer_asset(
    State(state): State<AppState>,
    Extension(ctx): Extension<RequestContext>,
    Path(asset_id): Path<Uuid>,
    Json(req): Json<TransferAssetApiRequest>,
) -> AppResult<Json<LifecycleActionResponse>> {
    let asset = state
        .asset_service
        .get_by_id(asset_id)
        .await?;

    let eam_repo = AssetEamRepository::new(state.pool.clone());
    let transfer_id = eam_repo
        .record_transfer(
            asset_id,
            asset.company_id,
            asset.location_id,
            req.to_location_id,
            asset.department_id,
            req.to_department_id,
            None,
            req.to_custodian_id,
            Some(ctx.user_id),
            req.notes,
        )
        .await?;

    Ok(Json(LifecycleActionResponse {
        success: true,
        message: format!("Asset {} transferred successfully", asset.asset_code),
        record_id: transfer_id,
        journal_entry_id: None,
    }))
}

/// Impair asset value (IAS 36 write-down) (L3)
/// POST /api/v1/assets/:id/impairment
pub async fn impair_asset(
    State(state): State<AppState>,
    Extension(ctx): Extension<RequestContext>,
    Path(asset_id): Path<Uuid>,
    Json(req): Json<AssetImpairmentRequest>,
) -> AppResult<Json<LifecycleActionResponse>> {
    let asset = state
        .asset_service
        .get_by_id(asset_id)
        .await?;

    if req.impairment_amount <= rust_decimal::Decimal::ZERO {
        return Err(DomainError::business_rule(
            "invalid_impairment_amount",
            "Impairment amount must be greater than zero",
        ).into());
    }

    // Post GL Journal Entry: Debit Impairment Expense Account, Credit Accumulated Impairment Account
    let journal_req = CreateJournalEntryRequest {
        company_id: asset.company_id,
        date: req.impairment_date,
        description: format!("Impairment IAS36: {} ({}) - {}", asset.name, asset.asset_code, req.reason),
        reference: Some(asset.asset_code.clone()),
        lines: vec![
            CreateJournalLineRequest {
                account_id: req.impairment_loss_account_id,
                description: Some(format!("Impairment Loss: {}", asset.name)),
                debit: req.impairment_amount,
                credit: rust_decimal::Decimal::ZERO,
            },
            CreateJournalLineRequest {
                account_id: req.accumulated_impairment_account_id,
                description: Some(format!("Accumulated Impairment: {}", asset.name)),
                debit: rust_decimal::Decimal::ZERO,
                credit: req.impairment_amount,
            },
        ],
    };

    let tx_num = format!("IMP-{}", Uuid::new_v4().to_string()[..8].to_uppercase());
    let journal = state
        .journal_service
        .create_journal_entry(tx_num, journal_req, None)
        .await?;

    let eam_repo = AssetEamRepository::new(state.pool.clone());
    let record_id = eam_repo
        .record_impairment(
            asset_id,
            asset.company_id,
            req.impairment_date,
            req.impairment_amount,
            Some(journal.header.id),
            &req.reason,
            Some(ctx.user_id),
        )
        .await?;

    Ok(Json(LifecycleActionResponse {
        success: true,
        message: format!("Asset {} impairment recorded", asset.asset_code),
        record_id,
        journal_entry_id: Some(journal.header.id),
    }))
}

/// Dispose or sell asset with Gain/Loss calculation (L3)
/// POST /api/v1/assets/:id/disposal
pub async fn dispose_asset(
    State(state): State<AppState>,
    Extension(ctx): Extension<RequestContext>,
    Path(asset_id): Path<Uuid>,
    Json(req): Json<AssetDisposalRequest>,
) -> AppResult<Json<LifecycleActionResponse>> {
    let asset = state
        .asset_service
        .get_by_id(asset_id)
        .await?;

    let cost = asset.purchase_price.unwrap_or(rust_decimal::Decimal::ZERO);
    let book_val = asset.calculate_book_value().unwrap_or(cost);
    let accum_depr = cost - book_val;

    let gain_loss = AssetEamEngine::calculate_disposal_gain_loss(cost, accum_depr, req.sale_amount);

    let category = state
        .category_service
        .get_by_id(asset.category_id)
        .await?;

    let fixed_asset_acc = category.asset_account_id.unwrap_or(req.destination_account_id);
    let accum_depr_acc = category.accumulated_depreciation_account_id.unwrap_or(req.destination_account_id);

    // Build GL Lines
    let mut lines = Vec::new();
    // 1. Debit Cash/Bank for sale proceeds
    if req.sale_amount > rust_decimal::Decimal::ZERO {
        lines.push(CreateJournalLineRequest {
            account_id: req.destination_account_id,
            description: Some(format!("Disposal Sale Proceeds: {}", asset.name)),
            debit: req.sale_amount,
            credit: rust_decimal::Decimal::ZERO,
        });
    }
    // 2. Debit Accumulated Depreciation to clear it out
    if accum_depr > rust_decimal::Decimal::ZERO {
        lines.push(CreateJournalLineRequest {
            account_id: accum_depr_acc,
            description: Some(format!("Clear Accumulated Depr: {}", asset.name)),
            debit: accum_depr,
            credit: rust_decimal::Decimal::ZERO,
        });
    }
    // 3. Credit Fixed Asset Account for original cost
    lines.push(CreateJournalLineRequest {
        account_id: fixed_asset_acc,
        description: Some(format!("Remove Asset Cost: {}", asset.name)),
        debit: rust_decimal::Decimal::ZERO,
        credit: cost,
    });

    let journal_req = CreateJournalEntryRequest {
        company_id: asset.company_id,
        date: req.disposal_date,
        description: format!("Disposal: {} ({}) - Gain/Loss: {}", asset.name, asset.asset_code, gain_loss),
        reference: Some(asset.asset_code.clone()),
        lines,
    };

    let tx_num = format!("DISP-{}", Uuid::new_v4().to_string()[..8].to_uppercase());
    let journal = state
        .journal_service
        .create_journal_entry(tx_num, journal_req, None)
        .await?;

    let eam_repo = AssetEamRepository::new(state.pool.clone());
    let record_id = eam_repo
        .record_disposal(
            asset_id,
            asset.company_id,
            req.disposal_date,
            "sale",
            req.sale_amount,
            book_val,
            gain_loss,
            Some(req.destination_account_id),
            Some(journal.header.id),
            req.reason,
            Some(ctx.user_id),
        )
        .await?;

    Ok(Json(LifecycleActionResponse {
        success: true,
        message: format!("Asset {} disposal processed (Gain/Loss: {})", asset.asset_code, gain_loss),
        record_id,
        journal_entry_id: Some(journal.header.id),
    }))
}

/// Get append-only custody and location history for an asset (L4)
/// GET /api/v1/assets/:id/custody-history
pub async fn get_custody_history(
    State(state): State<AppState>,
    Path(asset_id): Path<Uuid>,
) -> AppResult<Json<Vec<AssetCustodyHistory>>> {
    let eam_repo = AssetEamRepository::new(state.pool.clone());
    let history = eam_repo.get_custody_history(asset_id).await?;
    Ok(Json(history))
}
