//! Tier Configuration for Tiered Pricing
//!
//! Defines tiered pricing structures where different rate multipliers
//! apply based on usage ranges (e.g., normal rate for first 8 hours,
//! overtime rate for hours 8-10, double time for 10+)

use management_system_macros::DocType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Configuration for tiered pricing
#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Rentals", description = "Entity TierConfig")]
pub struct TierConfig {
    /// Type of tier: "hourly", "daily", "monthly"
    #[serde(rename = "type")]
    pub tier_type: String,

    /// List of price tiers
    pub tiers: Vec<Tier>,
}

/// Individual pricing tier
#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Rentals", description = "Entity Tier")]
pub struct Tier {
    /// Starting value for this tier (inclusive)
    pub from: Decimal,

    /// Ending value for this tier (exclusive). None means infinity
    pub to: Option<Decimal>,

    /// Rate multiplier for this tier (e.g., 1.0 for normal, 1.5 for overtime)
    pub multiplier: Decimal,
}

impl TierConfig {
    pub fn calculate(&self, units: Decimal, base_rate: Decimal) -> Decimal {
        let mut total = Decimal::ZERO;
        let mut remaining = units;

        for tier in &self.tiers {
            if remaining <= Decimal::ZERO {
                break;
            }

            let tier_size = if let Some(to) = tier.to {
                let tier_capacity = to - tier.from;
                tier_capacity.min(remaining)
            } else {
                remaining
            };

            if tier_size <= Decimal::ZERO {
                continue;
            }

            let tier_cost = tier_size * base_rate * tier.multiplier;
            total += tier_cost;

            remaining -= tier_size;
        }

        total
    }

    pub fn calculate_breakdown(&self, units: Decimal, base_rate: Decimal) -> Vec<TierBreakdown> {
        let mut breakdown = Vec::new();
        let mut remaining = units;

        for tier in &self.tiers {
            if remaining <= Decimal::ZERO {
                break;
            }

            let tier_size = if let Some(to) = tier.to {
                let tier_capacity = to - tier.from;
                tier_capacity.min(remaining)
            } else {
                remaining
            };

            if tier_size <= Decimal::ZERO {
                continue;
            }

            let tier_cost = tier_size * base_rate * tier.multiplier;

            breakdown.push(TierBreakdown {
                units: tier_size,
                multiplier: tier.multiplier,
                cost: tier_cost,
                from: tier.from,
                to: tier.to,
            });

            remaining -= tier_size;
        }

        breakdown
    }
}

/// Breakdown of a single tier calculation for display
#[derive(Debug, Clone, Serialize, DocType)]
#[doctype(module = "Rentals", description = "Entity TierBreakdown")]
pub struct TierBreakdown {
    pub units: Decimal,
    pub multiplier: Decimal,
    pub cost: Decimal,
    pub from: Decimal,
    pub to: Option<Decimal>,
}
