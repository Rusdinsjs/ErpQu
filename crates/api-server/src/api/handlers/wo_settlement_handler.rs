//! Work Order Settlement HTTP Handler (L5, L6)
//!
//! Handles Work Order cost settlement (accumulating spare parts, labor, external costs)
//! and posting settlement GL journal entries (capitalized to Asset value or charged to Maintenance Expense).

use axum::{
    extract::{Path, State},
    Extension, Json,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::errors::DomainError;
use management_system_core::domain::request_context::RequestContext;
use management_system_core::shared::errors::AppResult;
use management_system_finance::domain::entities::journal::{
    CreateJournalEntryRequest, CreateJournalLineRequest,
};
use management_system_ops::{WorkOrderSettlementEngine, WorkOrderSettlementRequest};

#[derive(Debug, Deserialize, ToSchema)]
pub struct SettleWorkOrderApiRequest {
    pub settlement_date: chrono::NaiveDate,
    pub settlement_type: String, // "capital" or "expense"
    pub target_account_id: Uuid, // Debit: Fixed Asset Account or Maintenance Expense Account
    pub offset_account_id: Uuid, // Credit: Work Order WIP Clearance Account
    pub parts_cost: Option<rust_decimal::Decimal>,
    pub labor_cost: Option<rust_decimal::Decimal>,
    pub external_cost: Option<rust_decimal::Decimal>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct WorkOrderSettlementResponse {
    pub success: bool,
    pub work_order_id: Uuid,
    pub total_settled_amount: rust_decimal::Decimal,
    pub settlement_type: String,
    pub journal_entry_id: Uuid,
    pub journal_reference: String,
}

/// Settle Work Order costs to Asset Capitalization or Maintenance Expense (L5, L6)
/// POST /api/v1/work-orders/:id/settle
#[utoipa::path(
    post,
    path = "/api/v1/work-orders/{id}/settle",
    params(
        ("id" = Uuid, Path, description = "Work Order ID")
    ),
    request_body = SettleWorkOrderApiRequest,
    responses(
        (status = 200, description = "Work Order costs successfully settled to GL", body = WorkOrderSettlementResponse),
        (status = 400, description = "Bad Request"),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "work-orders"
)]
pub async fn settle_work_order(
    State(state): State<AppState>,
    Extension(ctx): Extension<RequestContext>,
    Path(wo_id): Path<Uuid>,
    Json(req): Json<SettleWorkOrderApiRequest>,
) -> AppResult<Json<WorkOrderSettlementResponse>> {
    // 1. Fetch Work Order
    let wo = state
        .work_order_service
        .get_by_id(wo_id)
        .await?;

    // 2. Fetch actual parts cost from work_order_parts if not explicitly overridden
    let parts_cost = match req.parts_cost {
        Some(p) => p,
        None => {
            let sum_parts: Option<rust_decimal::Decimal> = sqlx::query_scalar(
                "SELECT COALESCE(SUM(total_price), 0) FROM work_order_parts WHERE work_order_id = $1",
            )
            .bind(wo_id)
            .fetch_one(&state.pool)
            .await
            .unwrap_or(Some(rust_decimal::Decimal::ZERO));
            sum_parts.unwrap_or(rust_decimal::Decimal::ZERO)
        }
    };

    let labor_cost = req.labor_cost.unwrap_or(rust_decimal::Decimal::ZERO);
    let external_cost = req.external_cost.unwrap_or(rust_decimal::Decimal::ZERO);

    let company_id = ctx.tenant_context.company_id.unwrap_or_default();

    let settlement_req = WorkOrderSettlementRequest {
        work_order_id: wo_id,
        company_id,
        settlement_date: req.settlement_date,
        settlement_type: req.settlement_type.clone(),
        asset_id: Some(wo.asset_id),
        target_account_id: req.target_account_id,
        offset_account_id: req.offset_account_id,
        parts_cost,
        labor_cost,
        external_cost,
        notes: req.notes,
    };

    // 3. Validate Settlement via Engine
    let total_cost = WorkOrderSettlementEngine::validate_settlement(&settlement_req)?;

    // 4. Create GL Journal Entry for Settlement
    let desc = format!(
        "Work Order Settlement ({}) - WO #: {}",
        req.settlement_type, wo.wo_number
    );

    let journal_req = CreateJournalEntryRequest {
        company_id: ctx.tenant_context.company_id,
        date: req.settlement_date,
        description: desc.clone(),
        reference: Some(wo.wo_number.clone()),
        lines: vec![
            CreateJournalLineRequest {
                account_id: req.target_account_id,
                description: Some(format!("WO Settlement Debit ({}): {}", req.settlement_type, wo.wo_number)),
                debit: total_cost,
                credit: rust_decimal::Decimal::ZERO,
            },
            CreateJournalLineRequest {
                account_id: req.offset_account_id,
                description: Some(format!("WO WIP Clearance Credit: {}", wo.wo_number)),
                debit: rust_decimal::Decimal::ZERO,
                credit: total_cost,
            },
        ],
    };

    let tx_num = format!("WOSET-{}", Uuid::new_v4().to_string()[..8].to_uppercase());
    let journal = state
        .journal_service
        .create_journal_entry(tx_num.clone(), journal_req, None)
        .await?;

    // If capital settlement, also increase the fixed asset purchase_price / book value
    if req.settlement_type == "capital" {
        sqlx::query(
            "UPDATE assets SET purchase_price = COALESCE(purchase_price, 0) + $1, updated_at = NOW() WHERE id = $2",
        )
        .bind(total_cost)
        .bind(wo.asset_id)
        .execute(&state.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
    }

    // Update Work Order status to 'completed' / 'settled'
    sqlx::query(
        "UPDATE work_orders SET status = 'completed', updated_at = NOW() WHERE id = $1",
    )
    .bind(wo_id)
    .execute(&state.pool)
    .await
    .map_err(|e| DomainError::Database(e.to_string()))?;

    Ok(Json(WorkOrderSettlementResponse {
        success: true,
        work_order_id: wo_id,
        total_settled_amount: total_cost,
        settlement_type: req.settlement_type,
        journal_entry_id: journal.header.id,
        journal_reference: tx_num,
    }))
}
