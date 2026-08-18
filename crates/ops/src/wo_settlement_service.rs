//! Work Order Cost Settlement Engine (L6)
//!
//! Accumulates total costs (spare parts + labor + external services) for a Work Order
//! and posts a settlement GL journal entry to capitalize to Asset Value or charge to Maintenance Expense.

use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use management_system_core::domain::errors::{DomainError, DomainResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkOrderSettlementRequest {
    pub work_order_id: Uuid,
    pub company_id: Uuid,
    pub settlement_date: NaiveDate,
    pub settlement_type: String, // "capital" or "expense"
    pub asset_id: Option<Uuid>,
    pub target_account_id: Uuid, // Fixed Asset Account or Maintenance Expense Account
    pub offset_account_id: Uuid, // WO WIP Clearance / Applied Expenses Account
    pub parts_cost: Decimal,
    pub labor_cost: Decimal,
    pub external_cost: Decimal,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkOrderSettlementResult {
    pub work_order_id: Uuid,
    pub total_settled_amount: Decimal,
    pub settlement_type: String,
    pub journal_reference: String,
}

pub struct WorkOrderSettlementEngine;

impl WorkOrderSettlementEngine {
    /// Calculate total cost for Work Order settlement
    pub fn calculate_total_cost(
        parts_cost: Decimal,
        labor_cost: Decimal,
        external_cost: Decimal,
    ) -> Decimal {
        parts_cost + labor_cost + external_cost
    }

    /// Validate settlement request eligibility
    pub fn validate_settlement(req: &WorkOrderSettlementRequest) -> DomainResult<Decimal> {
        let total = Self::calculate_total_cost(req.parts_cost, req.labor_cost, req.external_cost);
        if total <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "wo_settlement_zero",
                "Work order settlement amount must be greater than zero",
            ));
        }

        if req.settlement_type != "capital" && req.settlement_type != "expense" {
            return Err(DomainError::business_rule(
                "invalid_settlement_type",
                "Settlement type must be either 'capital' or 'expense'",
            ));
        }

        if req.settlement_type == "capital" && req.asset_id.is_none() {
            return Err(DomainError::business_rule(
                "missing_asset_id",
                "Asset ID is required for capital work order settlement",
            ));
        }

        Ok(total)
    }
}
