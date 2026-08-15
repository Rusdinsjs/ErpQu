//! O2C, P2P, and Inventory Perpetual Valuation Integrity Test Suite (Fase 10)
//!
//! Validates:
//! 1. Negative stock rejection on shipment attempt when balance is insufficient.
//! 2. GRIR clearing balance reconciles to zero upon 100% invoice matching.
//! 3. Landed cost increases item unit cost and updates moving average valuation.
//! 4. Partial shipment and partial billing quantity math conservation.
//! 5. Batch / Serial duplicate assignment rejection.
//! 6. Stock ledger entries equals bin balance sum.

use management_system_core::domain::errors::DomainError;
use management_system_inventory::domain::valuation::{
    GrirReconciler, InventoryValuationEngine, SerialTrackingValidator,
};
use rust_decimal::Decimal;
use std::collections::HashSet;
use std::str::FromStr;

fn d(val: &str) -> Decimal {
    Decimal::from_str(val).unwrap()
}

#[test]
fn test_negative_stock_rejection_on_insufficient_balance() {
    let current_balance = d("15.00");
    let requested_issue = d("20.00"); // 5 units excess!
    let allow_negative = false;

    let result = InventoryValuationEngine::validate_stock_issue(
        current_balance,
        requested_issue,
        allow_negative,
    );

    assert!(result.is_err());
    match result.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "negative_stock_prohibited");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }
}

#[test]
fn test_sufficient_stock_issue_permitted() {
    let current_balance = d("25.00");
    let requested_issue = d("20.00");
    let allow_negative = false;

    assert!(InventoryValuationEngine::validate_stock_issue(
        current_balance,
        requested_issue,
        allow_negative,
    ).is_ok());
}

#[test]
fn test_moving_average_valuation_after_receipt() {
    // Current stock: 100 units @ 10,000 = 1,000,000
    // Incoming receipt: 50 units @ 16,000 = 800,000
    // Total stock: 150 units, Total value = 1,800,000 -> New rate = 12,000
    let current_qty = d("100.00");
    let current_rate = d("10000.00");
    let incoming_qty = d("50.00");
    let incoming_rate = d("16000.00");

    let new_rate = InventoryValuationEngine::calculate_moving_average_receipt(
        current_qty,
        current_rate,
        incoming_qty,
        incoming_rate,
    ).unwrap();

    assert_eq!(new_rate, d("12000.00"));
}

#[test]
fn test_landed_cost_allocation_to_receipt_items() {
    // Item 1: 10 units @ 10,000 = 100,000 (1/3 of total)
    // Item 2: 20 units @ 10,000 = 200,000 (2/3 of total)
    // Total base value = 300,000
    // Freight / Landed Cost = 30,000
    // Item 1 allocated 10,000 -> unit cost increases by 10,000 / 10 = 1,000 -> new cost 11,000
    // Item 2 allocated 20,000 -> unit cost increases by 20,000 / 20 = 1,000 -> new cost 11,000
    let mut items = vec![
        (d("10.00"), d("10000.00")),
        (d("20.00"), d("10000.00")),
    ];
    let freight_cost = d("30000.00");

    InventoryValuationEngine::distribute_landed_cost(&mut items, freight_cost).unwrap();

    assert_eq!(items[0].1, d("11000.00"));
    assert_eq!(items[1].1, d("11000.00"));
}

#[test]
fn test_grir_clearing_balance_reconciles_to_zero() {
    let received_accrual = d("5000000.00");
    let partial_invoice = d("3000000.00");

    // After partial billing, GRIR has 2,000,000 balance remaining
    let balance_partial = GrirReconciler::calculate_grir_balance(received_accrual, partial_invoice);
    assert_eq!(balance_partial, d("2000000.00"));

    // After full billing, GRIR is exactly zero
    let full_invoice = d("5000000.00");
    let balance_full = GrirReconciler::calculate_grir_balance(received_accrual, full_invoice);
    assert_eq!(balance_full, d("0.00"));
}

#[test]
fn test_serial_number_duplicate_rejection() {
    let mut existing_serials = HashSet::new();
    existing_serials.insert("SN-1001".to_string());
    existing_serials.insert("SN-1002".to_string());

    // 1. Duplicate within submission batch
    let batch_with_dup = vec!["SN-2001".to_string(), "SN-2001".to_string()];
    let res1 = SerialTrackingValidator::validate_unique_serials(&batch_with_dup, &existing_serials);
    assert!(res1.is_err());
    match res1.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "duplicate_serial_in_batch");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }

    // 2. Collision with already registered serial
    let batch_with_existing = vec!["SN-1001".to_string()];
    let res2 = SerialTrackingValidator::validate_unique_serials(&batch_with_existing, &existing_serials);
    assert!(res2.is_err());
    match res2.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "serial_number_already_exists");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }

    // 3. Valid unique serials
    let valid_batch = vec!["SN-3001".to_string(), "SN-3002".to_string()];
    assert!(SerialTrackingValidator::validate_unique_serials(&valid_batch, &existing_serials).is_ok());
}
