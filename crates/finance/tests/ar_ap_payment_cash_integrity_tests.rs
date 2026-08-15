//! AR, AP, Payment Allocation, and Cash/Bank Integrity Invariant Test Suite (Fase 9)
//!
//! Validates:
//! 1. Over-allocation rejection (payment > invoice outstanding balance).
//! 2. Three-way match mismatch rejection (quantity and price variance exceeding tolerance).
//! 3. Aging bucket classification accuracy across 5 aging tiers.
//! 4. Partial payment leaves exact remaining balance.
//! 5. Inter-bank transfer balance conservation (Source == Dest + Fee).
//! 6. Multi-invoice FIFO payment allocation.

use chrono::NaiveDate;
use management_system_core::domain::errors::DomainError;
use rust_decimal_macros::dec;
use uuid::Uuid;

use management_system_finance::domain::settlement::{
    AgingBucket, AgingCalculator, BankTransferValidator, InvoiceAllocationItem,
    PaymentAllocationEngine, ThreeWayMatchValidator,
};

#[test]
fn test_over_allocation_strictly_rejected() {
    let outstanding = dec!(5000000.00);
    let requested = dec!(6000000.00); // 1.000.000 over-allocation!

    let result = PaymentAllocationEngine::validate_explicit_allocation(outstanding, requested);
    assert!(result.is_err());
    match result.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "over_allocation_denied");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }
}

#[test]
fn test_exact_and_partial_allocation_permitted() {
    let outstanding = dec!(5000000.00);

    // Exact allocation
    assert!(
        PaymentAllocationEngine::validate_explicit_allocation(outstanding, dec!(5000000.00))
            .is_ok()
    );

    // Partial allocation
    assert!(
        PaymentAllocationEngine::validate_explicit_allocation(outstanding, dec!(2500000.00))
            .is_ok()
    );
}

#[test]
fn test_three_way_matching_quantity_variance_rejection() {
    let po_qty = dec!(100.00);
    let po_price = dec!(50000.00);
    let gr_qty = dec!(100.00);
    let inv_qty = dec!(110.00); // 10 units excess!
    let inv_price = dec!(50000.00);
    let price_tolerance = dec!(0.00);
    let qty_tolerance = dec!(5.00); // Only 5 units allowed

    let result = ThreeWayMatchValidator::validate(
        po_qty,
        po_price,
        gr_qty,
        inv_qty,
        inv_price,
        price_tolerance,
        qty_tolerance,
    );

    assert!(result.is_err());
    match result.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "three_way_match_quantity_variance_exceeded");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }
}

#[test]
fn test_three_way_matching_price_variance_rejection() {
    let po_qty = dec!(100.00);
    let po_price = dec!(50000.00);
    let gr_qty = dec!(100.00);
    let inv_qty = dec!(100.00);
    let inv_price = dec!(55000.00); // 5000 price excess!
    let price_tolerance = dec!(1000.00); // Only 1000 allowed
    let qty_tolerance = dec!(0.00);

    let result = ThreeWayMatchValidator::validate(
        po_qty,
        po_price,
        gr_qty,
        inv_qty,
        inv_price,
        price_tolerance,
        qty_tolerance,
    );

    assert!(result.is_err());
    match result.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "three_way_match_price_variance_exceeded");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }
}

#[test]
fn test_three_way_matching_within_tolerance_permitted() {
    let po_qty = dec!(100.00);
    let po_price = dec!(50000.00);
    let gr_qty = dec!(100.00);
    let inv_qty = dec!(102.00); // 2 units excess (within tolerance 5)
    let inv_price = dec!(50500.00); // 500 price excess (within tolerance 1000)
    let price_tolerance = dec!(1000.00);
    let qty_tolerance = dec!(5.00);

    assert!(ThreeWayMatchValidator::validate(
        po_qty,
        po_price,
        gr_qty,
        inv_qty,
        inv_price,
        price_tolerance,
        qty_tolerance,
    )
    .is_ok());
}

#[test]
fn test_aging_bucket_classification_tiers() {
    let due_date = NaiveDate::from_ymd_opt(2026, 8, 1).unwrap();

    // 1. Current (on or before due date)
    assert_eq!(
        AgingCalculator::classify(due_date, NaiveDate::from_ymd_opt(2026, 8, 1).unwrap()),
        AgingBucket::Current
    );
    assert_eq!(
        AgingCalculator::classify(due_date, NaiveDate::from_ymd_opt(2026, 7, 25).unwrap()),
        AgingBucket::Current
    );

    // 2. 1-30 Days Overdue (e.g., Aug 15 = 14 days overdue)
    assert_eq!(
        AgingCalculator::classify(due_date, NaiveDate::from_ymd_opt(2026, 8, 15).unwrap()),
        AgingBucket::Days1To30
    );

    // 3. 31-60 Days Overdue (e.g., Sep 15 = 45 days overdue)
    assert_eq!(
        AgingCalculator::classify(due_date, NaiveDate::from_ymd_opt(2026, 9, 15).unwrap()),
        AgingBucket::Days31To60
    );

    // 4. 61-90 Days Overdue (e.g., Oct 15 = 75 days overdue)
    assert_eq!(
        AgingCalculator::classify(due_date, NaiveDate::from_ymd_opt(2026, 10, 15).unwrap()),
        AgingBucket::Days61To90
    );

    // 5. Over 90 Days (e.g., Dec 1 = 122 days overdue)
    assert_eq!(
        AgingCalculator::classify(due_date, NaiveDate::from_ymd_opt(2026, 12, 1).unwrap()),
        AgingBucket::Over90
    );
}

#[test]
fn test_fifo_multi_invoice_allocation_and_advance() {
    let invoices = vec![
        InvoiceAllocationItem {
            invoice_id: Uuid::new_v4(),
            invoice_no: "SINV-001".to_string(),
            total_amount: dec!(3000000.00),
            outstanding_amount: dec!(3000000.00),
            allocated_amount: dec!(0.00),
        },
        InvoiceAllocationItem {
            invoice_id: Uuid::new_v4(),
            invoice_no: "SINV-002".to_string(),
            total_amount: dec!(5000000.00),
            outstanding_amount: dec!(5000000.00),
            allocated_amount: dec!(0.00),
        },
    ];

    // Payment of 4.000.000 should fully pay SINV-001 (3M) and partially pay SINV-002 (1M, leaving 4M)
    let summary = PaymentAllocationEngine::allocate_fifo(dec!(4000000.00), &invoices).unwrap();

    assert_eq!(summary.total_payment, dec!(4000000.00));
    assert_eq!(summary.total_allocated, dec!(4000000.00));
    assert_eq!(summary.unallocated_advance, dec!(0.00));

    // First invoice fully paid
    assert_eq!(summary.allocations[0].allocated_amount, dec!(3000000.00));
    assert_eq!(summary.allocations[0].outstanding_amount, dec!(0.00));

    // Second invoice partially paid
    assert_eq!(summary.allocations[1].allocated_amount, dec!(1000000.00));
    assert_eq!(summary.allocations[1].outstanding_amount, dec!(4000000.00));
}

#[test]
fn test_fifo_overpayment_creates_unallocated_advance() {
    let invoices = vec![InvoiceAllocationItem {
        invoice_id: Uuid::new_v4(),
        invoice_no: "SINV-001".to_string(),
        total_amount: dec!(2000000.00),
        outstanding_amount: dec!(2000000.00),
        allocated_amount: dec!(0.00),
    }];

    // Payment of 3.000.000 pays SINV-001 (2M) with 1M remaining as unallocated advance
    let summary = PaymentAllocationEngine::allocate_fifo(dec!(3000000.00), &invoices).unwrap();

    assert_eq!(summary.total_payment, dec!(3000000.00));
    assert_eq!(summary.total_allocated, dec!(2000000.00));
    assert_eq!(summary.unallocated_advance, dec!(1000000.00));
    assert_eq!(summary.allocations[0].outstanding_amount, dec!(0.00));
}

#[test]
fn test_bank_transfer_balance_conservation() {
    let source_debit = dec!(10005000.00); // 10.000.000 transfer + 5.000 fee
    let fee_amount = dec!(5000.00);
    let dest_credit = dec!(10000000.00);
    let transit_clearing = dec!(10000000.00);

    // Valid transfer
    assert!(BankTransferValidator::validate_transfer(
        source_debit,
        transit_clearing,
        dest_credit,
        fee_amount,
    )
    .is_ok());

    // Mismatched transfer (e.g. money created from nowhere)
    let corrupt_credit = dec!(10500000.00);
    let result = BankTransferValidator::validate_transfer(
        source_debit,
        transit_clearing,
        corrupt_credit,
        fee_amount,
    );
    assert!(result.is_err());
    match result.unwrap_err() {
        DomainError::BusinessRuleViolation { rule, .. } => {
            assert_eq!(rule, "transfer_balance_mismatch");
        }
        err => panic!("Expected BusinessRuleViolation, got {:?}", err),
    }
}
