use chrono::{DateTime, NaiveDate, Utc};
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Append-Only Asset Custody & Location History Entity (QAST-005)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetCustodyHistory {
    pub id: Uuid,
    pub asset_id: Uuid,
    pub custodian_user_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub location_id: Option<Uuid>,
    pub assigned_at: DateTime<Utc>,
    pub assigned_by: Option<Uuid>,
    pub notes: Option<String>,
}

/// Request to assign new custody/location to an asset (QAST-005)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignCustodyRequest {
    pub asset_id: Uuid,
    pub custodian_user_id: Option<Uuid>,
    pub department_id: Option<Uuid>,
    pub location_id: Option<Uuid>,
    pub notes: Option<String>,
}

/// Request for atomic Asset Sale / Disposal (QAST-004)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetDisposalRequest {
    pub asset_id: Uuid,
    pub company_id: Uuid,
    pub disposal_date: NaiveDate,
    pub sale_amount: Decimal,
    pub destination_account_id: Uuid, // Cash/Bank Account for sale proceeds
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepreciationScheduleItem {
    pub schedule_date: NaiveDate,
    pub depreciation_amount: Decimal,
    pub accumulated_depreciation: Decimal,
    pub remaining_book_value: Decimal,
}

pub struct AssetEamEngine;

impl AssetEamEngine {
    /// Generates straight-line depreciation schedule
    pub fn generate_straight_line_schedule(
        purchase_cost: Decimal,
        residual_value: Decimal,
        start_date: NaiveDate,
        total_months: usize,
    ) -> DomainResult<Vec<DepreciationScheduleItem>> {
        if total_months == 0 {
            return Err(DomainError::business_rule(
                "invalid_depreciation_period",
                "Depreciation period must be greater than zero months",
            ));
        }
        if purchase_cost < residual_value {
            return Err(DomainError::business_rule(
                "invalid_residual_value",
                "Residual value cannot exceed purchase cost",
            ));
        }

        let depreciable_amount = purchase_cost - residual_value;
        let months_dec = Decimal::from(total_months);
        let monthly_depr = (depreciable_amount / months_dec).round_dp(2);

        let mut schedule = Vec::with_capacity(total_months);
        let mut accum_depr = Decimal::ZERO;

        for m in 1..=total_months {
            let item_depr = if m == total_months {
                // Adjust rounding difference on final month so sum exactly equals depreciable amount
                depreciable_amount - accum_depr
            } else {
                monthly_depr
            };

            accum_depr += item_depr;
            let book_value = purchase_cost - accum_depr;

            let schedule_date = start_date
                .checked_add_months(chrono::Months::new((m - 1) as u32))
                .unwrap_or(start_date);

            schedule.push(DepreciationScheduleItem {
                schedule_date,
                depreciation_amount: item_depr,
                accumulated_depreciation: accum_depr,
                remaining_book_value: book_value,
            });
        }

        Ok(schedule)
    }

    /// Calculates gain/loss on asset disposal
    pub fn calculate_disposal_gain_loss(
        purchase_cost: Decimal,
        accumulated_depreciation: Decimal,
        sale_proceeds: Decimal,
    ) -> Decimal {
        let book_value = purchase_cost - accumulated_depreciation;
        sale_proceeds - book_value
    }
}
