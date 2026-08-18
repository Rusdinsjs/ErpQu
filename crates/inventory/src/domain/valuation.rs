use chrono::{DateTime, Utc};
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

/// Physical Stock FIFO Layer (Fase 10 / Perbaikan 3)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FifoLayer {
    pub id: Uuid,
    pub company_id: Uuid,
    pub warehouse_id: Uuid,
    pub item_id: Uuid,
    pub voucher_type: String,
    pub voucher_no: String,
    pub layer_date: DateTime<Utc>,
    pub initial_qty: Decimal,
    pub remaining_qty: Decimal,
    pub unit_cost: Decimal,
}

/// Result of a FIFO stock issue consumption
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FifoConsumptionResult {
    pub total_cost: Decimal,
    pub effective_rate: Decimal,
    pub consumed_qty: Decimal,
    pub consumed_layers: Vec<(Uuid, Decimal, Decimal)>, // (layer_id, consumed_qty, unit_cost)
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
    /// Consumes FIFO stock layers in strict chronological order (QSTK-007 / Perbaikan 3)
    pub fn consume_fifo_layers(
        layers: &mut [FifoLayer],
        requested_qty: Decimal,
    ) -> DomainResult<FifoConsumptionResult> {
        if requested_qty <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_fifo_qty",
                "FIFO issue quantity must be strictly positive",
            ));
        }

        let total_available: Decimal = layers.iter().map(|l| l.remaining_qty).sum();
        if total_available < requested_qty {
            return Err(DomainError::business_rule(
                "insufficient_fifo_layers",
                &format!(
                    "Available FIFO layer quantity ({}) is insufficient for requested issue ({})",
                    total_available, requested_qty
                ),
            ));
        }

        // Sort by layer date ascending (First-In, First-Out)
        layers.sort_by_key(|l| l.layer_date);

        let mut remaining_needed = requested_qty;
        let mut total_cost = Decimal::ZERO;
        let mut consumed_layers = Vec::new();

        for layer in layers.iter_mut() {
            if remaining_needed <= Decimal::ZERO {
                break;
            }
            if layer.remaining_qty <= Decimal::ZERO {
                continue;
            }

            let take = remaining_needed.min(layer.remaining_qty);
            let layer_cost = take * layer.unit_cost;
            total_cost += layer_cost;
            layer.remaining_qty -= take;
            remaining_needed -= take;

            consumed_layers.push((layer.id, take, layer.unit_cost));
        }

        let effective_rate = total_cost / requested_qty;

        Ok(FifoConsumptionResult {
            total_cost,
            effective_rate,
            consumed_qty: requested_qty,
            consumed_layers,
        })
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
                    &format!(
                        "Serial number '{}' is already registered in the system",
                        trimmed
                    ),
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
    pub fn calculate_grir_balance(received_accrual: Decimal, invoiced_amount: Decimal) -> Decimal {
        received_accrual - invoiced_amount
    }
}
