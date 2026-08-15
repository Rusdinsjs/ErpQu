use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

/// Valuation Method (QSTK-007)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ValuationMethod {
    MovingAverage,
    FIFO,
}

pub struct InventoryValuationEngine;

impl InventoryValuationEngine {
    /// Calculates new Moving Average valuation rate after an incoming receipt
    pub fn calculate_moving_average_receipt(
        current_qty: Decimal,
        current_valuation_rate: Decimal,
        incoming_qty: Decimal,
        incoming_rate: Decimal,
    ) -> DomainResult<Decimal> {
        if incoming_qty <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_incoming_qty",
                "Incoming quantity must be strictly positive",
            ));
        }

        let current_value = (current_qty * current_valuation_rate).max(Decimal::ZERO);
        let incoming_value = incoming_qty * incoming_rate;
        let total_qty = current_qty + incoming_qty;

        if total_qty <= Decimal::ZERO {
            return Ok(incoming_rate);
        }

        let new_rate = (current_value + incoming_value) / total_qty;
        Ok(new_rate)
    }

    /// Distributes landed cost across receipt items proportionally by value
    pub fn distribute_landed_cost(
        items: &mut [(Decimal, Decimal)], // (qty, unit_cost)
        total_landed_cost: Decimal,
    ) -> DomainResult<()> {
        let total_base_value: Decimal = items.iter().map(|(qty, cost)| *qty * *cost).sum();
        if total_base_value <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "zero_base_value",
                "Total receipt value must be positive to allocate landed cost",
            ));
        }

        for (qty, cost) in items.iter_mut() {
            let item_value = *qty * *cost;
            let ratio = item_value / total_base_value;
            let allocated_cost = total_landed_cost * ratio;
            let added_unit_cost = allocated_cost / *qty;
            *cost += added_unit_cost;
        }

        Ok(())
    }

    /// Checks negative stock violation
    pub fn validate_stock_issue(
        current_balance: Decimal,
        requested_issue_qty: Decimal,
        allow_negative_stock: bool,
    ) -> DomainResult<()> {
        if requested_issue_qty <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_issue_qty",
                "Issue quantity must be strictly positive",
            ));
        }

        if !allow_negative_stock && (current_balance < requested_issue_qty) {
            return Err(DomainError::business_rule(
                "negative_stock_prohibited",
                &format!(
                    "Cannot issue quantity ({}) exceeding available balance ({})",
                    requested_issue_qty, current_balance
                ),
            ));
        }

        Ok(())
    }
}

/// Serial Number Unique Tracking Validator
pub struct SerialTrackingValidator;

impl SerialTrackingValidator {
    /// Validates that a list of serial numbers contains no duplicates and no collision with existing serials
    pub fn validate_unique_serials(
        new_serials: &[String],
        existing_serials: &HashSet<String>,
    ) -> DomainResult<()> {
        let mut seen = HashSet::new();
        for sn in new_serials {
            let trimmed = sn.trim();
            if trimmed.is_empty() {
                return Err(DomainError::business_rule(
                    "empty_serial_number",
                    "Serial number cannot be blank",
                ));
            }
            if !seen.insert(trimmed.to_string()) {
                return Err(DomainError::business_rule(
                    "duplicate_serial_in_batch",
                    &format!("Duplicate serial number '{}' in submission batch", trimmed),
                ));
            }
            if existing_serials.contains(trimmed) {
                return Err(DomainError::business_rule(
                    "serial_number_already_exists",
                    &format!("Serial number '{}' is already registered in the system", trimmed),
                ));
            }
        }
        Ok(())
    }
}

/// GRIR (Goods Receipt Invoice Received) Clearing Reconciler
pub struct GrirReconciler;

impl GrirReconciler {
    /// Reconciles GRIR clearing account: Receipt accrual vs Invoice bill
    pub fn calculate_grir_balance(
        received_accrual: Decimal,
        invoiced_amount: Decimal,
    ) -> Decimal {
        received_accrual - invoiced_amount
    }
}
