//! CRM Advanced Analytics & Win/Loss Funnel Domain

use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrmWinLossReport {
    pub total_closed_deals: i64,
    pub total_won_deals: i64,
    pub total_lost_deals: i64,
    pub win_rate_percentage: Decimal,
    pub total_won_value: Decimal,
    pub total_lost_value: Decimal,
    pub average_won_deal_size: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesVelocityMetrics {
    pub average_cycle_days: Decimal,
    pub fastest_won_days: Option<i64>,
    pub longest_won_days: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrmPerformanceAnalytics {
    pub win_loss: CrmWinLossReport,
    pub velocity: SalesVelocityMetrics,
}

pub struct CrmAnalyticsEngine;

impl CrmAnalyticsEngine {
    pub fn calculate_win_loss(
        won_deals: i64,
        won_value: Decimal,
        lost_deals: i64,
        lost_value: Decimal,
    ) -> CrmWinLossReport {
        let total_closed = won_deals + lost_deals;
        let win_rate = if total_closed > 0 {
            ((Decimal::from(won_deals) / Decimal::from(total_closed)) * dec!(100.0)).round_dp(2)
        } else {
            Decimal::ZERO
        };

        let avg_won_size = if won_deals > 0 {
            (won_value / Decimal::from(won_deals)).round_dp(2)
        } else {
            Decimal::ZERO
        };

        CrmWinLossReport {
            total_closed_deals: total_closed,
            total_won_deals: won_deals,
            total_lost_deals: lost_deals,
            win_rate_percentage: win_rate,
            total_won_value: won_value,
            total_lost_value: lost_value,
            average_won_deal_size: avg_won_size,
        }
    }
}
