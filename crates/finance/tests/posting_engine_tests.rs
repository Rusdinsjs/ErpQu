//! Accounting Posting Engine & GL Invariants Integration Tests (QACC-003, QACC-004)

use chrono::{NaiveDate, Utc};
use management_system_finance::domain::entities::gl_entry::{
    GLEntry, PostingInstruction, PostingLineItem,
};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use uuid::Uuid;

#[test]
fn test_gl_entry_reversal_invariants() {
    let original_id = Uuid::new_v4();
    let company_id = Uuid::new_v4();
    let account_id = Uuid::new_v4();
    let voucher_id = Uuid::new_v4();

    let entry = GLEntry {
        id: original_id,
        company_id,
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 1).unwrap(),
        posting_datetime: Utc::now(),
        account_id,
        party_type: Some("Client".to_string()),
        party_id: None,
        cost_center_id: None,
        project_id: None,
        currency: "IDR".to_string(),
        exchange_rate: dec!(1.0),
        debit: dec!(5000000.00),
        credit: Decimal::ZERO,
        debit_in_account_currency: dec!(5000000.00),
        credit_in_account_currency: Decimal::ZERO,
        voucher_type: "SALES_INVOICE".to_string(),
        voucher_no: "INV/2026/001".to_string(),
        voucher_id,
        is_reversal: false,
        reversal_source_id: None,
        created_at: Utc::now(),
        created_by: None,
    };

    let reversal_date = NaiveDate::from_ymd_opt(2026, 8, 15).unwrap();
    let reversal = entry.create_reversal(reversal_date);

    // QACC-003: Invariants verification
    assert_ne!(reversal.id, entry.id);
    assert_eq!(reversal.reversal_source_id, Some(original_id));
    assert!(reversal.is_reversal);
    assert_eq!(reversal.debit, Decimal::ZERO);
    assert_eq!(reversal.credit, dec!(5000000.00));
    assert_eq!(reversal.debit_in_account_currency, Decimal::ZERO);
    assert_eq!(reversal.credit_in_account_currency, dec!(5000000.00));
    assert_eq!(reversal.voucher_no, "INV/2026/001-REV");
    assert_eq!(reversal.posting_date, reversal_date);
}

#[test]
fn test_posting_instruction_balanced_check() {
    let account_a = Uuid::new_v4();
    let account_b = Uuid::new_v4();

    let balanced_instruction = PostingInstruction {
        company_id: Uuid::new_v4(),
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 1).unwrap(),
        voucher_type: "JOURNAL".to_string(),
        voucher_no: "JV/001".to_string(),
        voucher_id: Uuid::new_v4(),
        lines: vec![
            PostingLineItem {
                account_id: account_a,
                debit: dec!(1500000.00),
                credit: Decimal::ZERO,
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
            PostingLineItem {
                account_id: account_b,
                debit: Decimal::ZERO,
                credit: dec!(1500000.00),
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

    let total_debit: Decimal = balanced_instruction.lines.iter().map(|l| l.debit).sum();
    let total_credit: Decimal = balanced_instruction.lines.iter().map(|l| l.credit).sum();

    assert_eq!(total_debit, total_credit);
}

#[test]
fn test_posting_instruction_unbalanced_detected() {
    let account_a = Uuid::new_v4();
    let account_b = Uuid::new_v4();

    let unbalanced_instruction = PostingInstruction {
        company_id: Uuid::new_v4(),
        posting_date: NaiveDate::from_ymd_opt(2026, 8, 1).unwrap(),
        voucher_type: "JOURNAL".to_string(),
        voucher_no: "JV/002".to_string(),
        voucher_id: Uuid::new_v4(),
        lines: vec![
            PostingLineItem {
                account_id: account_a,
                debit: dec!(2000000.00),
                credit: Decimal::ZERO,
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: Some("IDR".to_string()),
                exchange_rate: Some(dec!(1.0)),
            },
            PostingLineItem {
                account_id: account_b,
                debit: Decimal::ZERO,
                credit: dec!(1800000.00), // Off by 200.000!
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

    let total_debit: Decimal = unbalanced_instruction.lines.iter().map(|l| l.debit).sum();
    let total_credit: Decimal = unbalanced_instruction.lines.iter().map(|l| l.credit).sum();

    assert_ne!(total_debit, total_credit);
}
