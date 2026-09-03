//! ABC Inventory Analysis Engine (Pareto 80/20 Rule)
//!
//! Categorizes inventory into three strategic classes:
//! - Class A: ~70% of total inventory valuation (Tight control, high frequency cycle counts)
//! - Class B: ~20% of total valuation (Moderate control, regular reviews)
//! - Class C: ~10% of total valuation (Bulk controls, simplified reordering)

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::entities::inventory::InventoryItem;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AbcClass {
    A,
    B,
    C,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbcItemEntry {
    pub item_id: Uuid,
    pub sku: String,
    pub name: String,
    pub current_quantity: Decimal,
    pub average_cost: Decimal,
    pub total_valuation: Decimal,
    pub cumulative_value: Decimal,
    pub cumulative_percentage: Decimal,
    pub class: AbcClass,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbcAnalysisReport {
    pub total_items: usize,
    pub total_inventory_valuation: Decimal,
    pub class_a_items_count: usize,
    pub class_a_valuation: Decimal,
    pub class_a_percentage_of_value: Decimal,
    pub class_b_items_count: usize,
    pub class_b_valuation: Decimal,
    pub class_b_percentage_of_value: Decimal,
    pub class_c_items_count: usize,
    pub class_c_valuation: Decimal,
    pub class_c_percentage_of_value: Decimal,
    pub items: Vec<AbcItemEntry>,
    pub generated_at: DateTime<Utc>,
}

pub struct AbcAnalysisEngine;

impl AbcAnalysisEngine {
    pub fn calculate(items: &[InventoryItem]) -> AbcAnalysisReport {
        if items.is_empty() {
            return AbcAnalysisReport {
                total_items: 0,
                total_inventory_valuation: Decimal::ZERO,
                class_a_items_count: 0,
                class_a_valuation: Decimal::ZERO,
                class_a_percentage_of_value: Decimal::ZERO,
                class_b_items_count: 0,
                class_b_valuation: Decimal::ZERO,
                class_b_percentage_of_value: Decimal::ZERO,
                class_c_items_count: 0,
                class_c_valuation: Decimal::ZERO,
                class_c_percentage_of_value: Decimal::ZERO,
                items: Vec::new(),
                generated_at: Utc::now(),
            };
        }

        // Calculate individual valuations
        let mut evaluated_items: Vec<(InventoryItem, Decimal)> = items
            .iter()
            .cloned()
            .map(|item| {
                let qty = item.current_quantity.max(Decimal::ZERO);
                let cost = item.average_cost.max(Decimal::ZERO);
                let val = (qty * cost).round_dp(2);
                (item, val)
            })
            .collect();

        // Sort descending by valuation
        evaluated_items.sort_by(|a, b| b.1.cmp(&a.1));

        let total_val: Decimal = evaluated_items.iter().map(|(_, val)| *val).sum();

        let mut cumulative = Decimal::ZERO;
        let mut class_a_count = 0;
        let mut class_a_val = Decimal::ZERO;
        let mut class_b_count = 0;
        let mut class_b_val = Decimal::ZERO;
        let mut class_c_count = 0;
        let mut class_c_val = Decimal::ZERO;

        let mut entries = Vec::with_capacity(evaluated_items.len());

        for (item, val) in evaluated_items {
            cumulative += val;
            let cum_pct = if total_val > Decimal::ZERO {
                ((cumulative / total_val) * dec!(100.0)).round_dp(2)
            } else {
                Decimal::ZERO
            };

            // Categorize into A (<= 70%), B (70% - 90%), C (> 90%)
            let class = if cum_pct <= dec!(70.0) || (class_a_count == 0 && total_val > Decimal::ZERO) {
                class_a_count += 1;
                class_a_val += val;
                AbcClass::A
            } else if cum_pct <= dec!(90.0) || (class_b_count == 0 && cum_pct <= dec!(95.0)) {
                class_b_count += 1;
                class_b_val += val;
                AbcClass::B
            } else {
                class_c_count += 1;
                class_c_val += val;
                AbcClass::C
            };

            entries.push(AbcItemEntry {
                item_id: item.id,
                sku: item.sku,
                name: item.name,
                current_quantity: item.current_quantity,
                average_cost: item.average_cost,
                total_valuation: val,
                cumulative_value: cumulative,
                cumulative_percentage: cum_pct,
                class,
            });
        }

        let a_pct = if total_val > Decimal::ZERO {
            ((class_a_val / total_val) * dec!(100.0)).round_dp(2)
        } else {
            Decimal::ZERO
        };
        let b_pct = if total_val > Decimal::ZERO {
            ((class_b_val / total_val) * dec!(100.0)).round_dp(2)
        } else {
            Decimal::ZERO
        };
        let c_pct = if total_val > Decimal::ZERO {
            ((class_c_val / total_val) * dec!(100.0)).round_dp(2)
        } else {
            Decimal::ZERO
        };

        AbcAnalysisReport {
            total_items: entries.len(),
            total_inventory_valuation: total_val,
            class_a_items_count: class_a_count,
            class_a_valuation: class_a_val,
            class_a_percentage_of_value: a_pct,
            class_b_items_count: class_b_count,
            class_b_valuation: class_b_val,
            class_b_percentage_of_value: b_pct,
            class_c_items_count: class_c_count,
            class_c_valuation: class_c_val,
            class_c_percentage_of_value: c_pct,
            items: entries,
            generated_at: Utc::now(),
        }
    }
}
