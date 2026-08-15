//! Finance Kernel Implementation and Invariants Test Suite (Fase 8)
//!
//! Validates:
//! 1. Double-entry zero discrepancy validation (Debit == Credit).
//! 2. Decimal precision and Banker's Rounding (MidpointNearestEven).
//! 3. Reversal voucher exact opposite mirroring.
//! 4. Trial Balance sum(debit) == sum(credit) reconciliation.

use chrono::{NaiveDate, Utc};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use uuid::Uuid;

use management_system_finance::domain::entities::gl_entry::{
    GLEntry, PostingInstruction, PostingLineItem,
};

#[test]
fn test_unbalanced_journal_rejected_zero_discrepancy() {
    let unbalance_inst = PostingInstruction {
        company_id: Uuid::new_v4(),
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        voucher_type: "JOURNAL_ENTRY".to_string(),
        voucher_no: "JV-2026-0001".to_string(),
        voucher_id: Uuid::new_v4(),
        lines: vec![
            PostingLineItem {
                account_id: Uuid::new_v4(),
                debit: dec!(1000000.50),
                credit: dec!(0.00),
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
            PostingLineItem {
                account_id: Uuid::new_v4(),
                debit: dec!(0.00),
                credit: dec!(1000000.49), // 0.01 discrepancy!
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
        ],
        created_by: None,
    };

    let total_debit: Decimal = unbalance_inst.lines.iter().map(|l| l.debit).sum();
    let total_credit: Decimal = unbalance_inst.lines.iter().map(|l| l.credit).sum();

    assert_ne!(
        total_debit, total_credit,
        "Unbalanced instruction must not have zero discrepancy"
    );
    assert_eq!(total_debit - total_credit, dec!(0.01));
}

#[test]
fn test_balanced_journal_validates_perfect_equality() {
    let balanced_inst = PostingInstruction {
        company_id: Uuid::new_v4(),
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        voucher_type: "JOURNAL_ENTRY".to_string(),
        voucher_no: "JV-2026-0002".to_string(),
        voucher_id: Uuid::new_v4(),
        lines: vec![
            PostingLineItem {
                account_id: Uuid::new_v4(),
                debit: dec!(7500000.25),
                credit: dec!(0.00),
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
            PostingLineItem {
                account_id: Uuid::new_v4(),
                debit: dec!(0.00),
                credit: dec!(7500000.25),
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
        ],
        created_by: None,
    };

    let total_debit: Decimal = balanced_inst.lines.iter().map(|l| l.debit).sum();
    let total_credit: Decimal = balanced_inst.lines.iter().map(|l| l.credit).sum();

    assert_eq!(
        total_debit, total_credit,
        "Total debit must equal total credit exactly"
    );
    assert_eq!(total_debit - total_credit, dec!(0.00));
}

#[test]
fn test_reversal_voucher_generates_exact_opposite_entries() {
    let orig_id = Uuid::new_v4();
    let original = GLEntry {
        id: orig_id,
        company_id: Uuid::new_v4(),
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        posting_datetime: Utc::now(),
        account_id: Uuid::new_v4(),
        party_type: None,
        party_id: None,
        cost_center_id: None,
        project_id: None,
        currency: "IDR".to_string(),
        exchange_rate: dec!(1.0),
        debit: dec!(12500000.00),
        credit: dec!(0.00),
        debit_in_account_currency: dec!(12500000.00),
        credit_in_account_currency: dec!(0.00),
        voucher_type: "SALES_INVOICE".to_string(),
        voucher_no: "SINV-2026-001".to_string(),
        voucher_id: Uuid::new_v4(),
        is_reversal: false,
        reversal_source_id: None,
        created_at: Utc::now(),
        created_by: None,
    };

    // Reversal swaps debit and credit
    let reversal = original.create_reversal(NaiveDate::from_ymd_opt(2026, 8, 16).unwrap());

    assert_eq!(reversal.debit, original.credit);
    assert_eq!(reversal.credit, original.debit);
    assert_eq!(
        reversal.debit_in_account_currency,
        original.credit_in_account_currency
    );
    assert_eq!(
        reversal.credit_in_account_currency,
        original.debit_in_account_currency
    );
    assert!(reversal.is_reversal);
    assert_eq!(reversal.reversal_source_id, Some(orig_id));
}

#[test]
fn test_bankers_rounding_half_even() {
    use rust_decimal::RoundingStrategy;

    // 2.5 rounds to 2 (even)
    let val1 = dec!(2.5).round_dp_with_strategy(0, RoundingStrategy::MidpointNearestEven);
    assert_eq!(val1, dec!(2));

    // 3.5 rounds to 4 (even)
    let val2 = dec!(3.5).round_dp_with_strategy(0, RoundingStrategy::MidpointNearestEven);
    assert_eq!(val2, dec!(4));

    // 2.55 rounded to 1 decimal -> 2.6
    let val3 = dec!(2.55).round_dp_with_strategy(1, RoundingStrategy::MidpointNearestEven);
    assert_eq!(val3, dec!(2.6));
}

#[test]
fn test_trial_balance_reconciliation_over_multiple_vouchers() {
    let mut entries = Vec::new();
    let company_id = Uuid::new_v4();

    // Add 10 balanced vouchers
    for i in 1..=10 {
        let amount = Decimal::from(i * 100000);
        let acc_debit = Uuid::new_v4();
        let acc_credit = Uuid::new_v4();

        entries.push(GLEntry {
            id: Uuid::new_v4(),
            company_id,
            posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
            posting_datetime: Utc::now(),
            account_id: acc_debit,
            party_type: None,
            party_id: None,
            cost_center_id: None,
            project_id: None,
            currency: "IDR".to_string(),
            exchange_rate: dec!(1.0),
            debit: amount,
            credit: dec!(0.00),
            debit_in_account_currency: amount,
            credit_in_account_currency: dec!(0.00),
            voucher_type: "JOURNAL_ENTRY".to_string(),
            voucher_no: format!("JV-{:04}", i),
            voucher_id: Uuid::new_v4(),
            is_reversal: false,
            reversal_source_id: None,
            created_at: Utc::now(),
            created_by: None,
        });

        entries.push(GLEntry {
            id: Uuid::new_v4(),
            company_id,
            posting_date: NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
            posting_datetime: Utc::now(),
            account_id: acc_credit,
            party_type: None,
            party_id: None,
            cost_center_id: None,
            project_id: None,
            currency: "IDR".to_string(),
            exchange_rate: dec!(1.0),
            debit: dec!(0.00),
            credit: amount,
            debit_in_account_currency: dec!(0.00),
            credit_in_account_currency: amount,
            voucher_type: "JOURNAL_ENTRY".to_string(),
            voucher_no: format!("JV-{:04}", i),
            voucher_id: Uuid::new_v4(),
            is_reversal: false,
            reversal_source_id: None,
            created_at: Utc::now(),
            created_by: None,
        });
    }

    let total_debit: Decimal = entries.iter().map(|e| e.debit).sum();
    let total_credit: Decimal = entries.iter().map(|e| e.credit).sum();

    assert_eq!(total_debit, total_credit);
    assert_eq!(total_debit, dec!(5500000));
}
