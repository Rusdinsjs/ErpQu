//! Gate 2: Trusted ERP Kernel Vertical Slice Invariant Suite
//! Tests: Purchase Order -> Goods Receipt -> Purchase Bill -> Approval -> Payment -> GL -> Bank Reconciliation

use chrono::NaiveDate;
use management_system_finance::domain::p2p_vertical_slice::*;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use uuid::Uuid;

#[test]
fn test_gate2_p2p_full_slice_golden_path() {
    let company_id = Uuid::new_v4();
    let vendor_id = Uuid::new_v4();
    let item_id = Uuid::new_v4();
    let warehouse_id = Uuid::new_v4();
    let maker_user = Uuid::new_v4();
    let checker_user = Uuid::new_v4();
    let grir_acc = Uuid::new_v4();
    let ap_acc = Uuid::new_v4();
    let bank_acc = Uuid::new_v4();
    let bank_gl_acc = Uuid::new_v4();

    // 1. Purchase Order: 10 units @ 50,000 = 500,000
    let po = P2pVerticalSliceEngine::create_purchase_order(CreatePurchaseOrderParams {
        id: Uuid::new_v4(),
        company_id,
        po_number: "PO-2026-001".to_string(),
        vendor_id,
        item_id,
        quantity: dec!(10.00),
        unit_price: dec!(50000.00),
        created_by: maker_user,
    })
    .expect("PO creation should succeed");

    assert_eq!(po.total_amount, dec!(500000.00));
    assert_eq!(po.status, P2pDocumentStatus::Submitted);

    // 2. Goods Receipt: 10 units received into warehouse
    let gr = P2pVerticalSliceEngine::create_goods_receipt(
        Uuid::new_v4(),
        company_id,
        "GR-2026-001".to_string(),
        &po,
        dec!(10.00),
        warehouse_id,
        maker_user,
    )
    .expect("GR creation should succeed");

    assert_eq!(gr.received_quantity, dec!(10.00));

    // 3. Purchase Bill: 10 units @ 50,000 with 3-Way Match Validation
    let mut bill = P2pVerticalSliceEngine::create_purchase_bill(CreatePurchaseBillParams {
        id: Uuid::new_v4(),
        company_id,
        bill_number: "BILL-2026-001".to_string(),
        po: &po,
        gr: &gr,
        billed_quantity: dec!(10.00),
        billed_unit_price: dec!(50000.00),
        maker_id: maker_user,
        price_tolerance: dec!(0.00), // Zero price tolerance
        qty_tolerance: dec!(0.00),   // Zero qty tolerance
    })
    .expect("Bill creation within 3-way match should succeed");

    assert_eq!(bill.status, P2pDocumentStatus::Draft);
    assert_eq!(bill.outstanding_amount, dec!(500000.00));

    // 4. Approval by Checker (Maker != Checker) & Non-Optional GL Posting
    let bill_gl = P2pVerticalSliceEngine::approve_and_post_purchase_bill(
        &mut bill,
        checker_user,
        grir_acc,
        ap_acc,
    )
    .expect("Approval and posting should succeed");

    assert_eq!(bill.status, P2pDocumentStatus::Posted);
    assert_eq!(bill_gl.len(), 2);
    // Verify zero discrepancy double-entry (Debit GRIR, Credit AP)
    let total_debit: Decimal = bill_gl.iter().map(|e| e.debit).sum();
    let total_credit: Decimal = bill_gl.iter().map(|e| e.credit).sum();
    assert_eq!(total_debit, total_credit);
    assert_eq!(total_debit, dec!(500000.00));

    // 5. Payment Entry: Pay full 500,000 with Maker-Checker SoD
    let pay_maker = Uuid::new_v4();
    let pay_checker = Uuid::new_v4();
    let (payment, payment_gl) = P2pVerticalSliceEngine::create_and_post_payment(
        &mut bill,
        PostPaymentParams {
            payment_id: Uuid::new_v4(),
            bank_account_id: bank_acc,
            payment_number: "PAY-2026-001".to_string(),
            payment_amount: dec!(500000.00),
            maker_id: pay_maker,
            checker_id: pay_checker,
            ap_account_id: ap_acc,
            bank_gl_account_id: bank_gl_acc,
        },
    )
    .expect("Payment posting and allocation should succeed");

    assert_eq!(payment.status, P2pDocumentStatus::Posted);
    assert_eq!(bill.outstanding_amount, dec!(0.00)); // Outstanding settled!
    assert_eq!(payment_gl.len(), 2);
    let pay_debit: Decimal = payment_gl.iter().map(|e| e.debit).sum();
    let pay_credit: Decimal = payment_gl.iter().map(|e| e.credit).sum();
    assert_eq!(pay_debit, pay_credit);
    assert_eq!(pay_debit, dec!(500000.00));

    // 6. Bank Reconciliation: Match against bank statement
    let recon = P2pVerticalSliceEngine::reconcile_bank_payment(
        Uuid::new_v4(),
        &payment,
        NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        dec!(500000.00),
        checker_user,
    )
    .expect("Bank reconciliation should succeed");

    assert!(recon.is_reconciled);
}

#[test]
fn test_gate2_nil_company_and_uuid_rejected() {
    let err = P2pVerticalSliceEngine::create_purchase_order(CreatePurchaseOrderParams {
        id: Uuid::nil(),
        company_id: Uuid::new_v4(),
        po_number: "PO-001".to_string(),
        vendor_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        quantity: dec!(10.00),
        unit_price: dec!(1000.00),
        created_by: Uuid::new_v4(),
    });
    assert!(err.is_err());

    let err_comp = P2pVerticalSliceEngine::create_purchase_order(CreatePurchaseOrderParams {
        id: Uuid::new_v4(),
        company_id: Uuid::nil(),
        po_number: "PO-001".to_string(),
        vendor_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        quantity: dec!(10.00),
        unit_price: dec!(1000.00),
        created_by: Uuid::new_v4(),
    });
    assert!(err_comp.is_err());
}

#[test]
fn test_gate2_three_way_matching_variance_rejected() {
    let company_id = Uuid::new_v4();
    let maker = Uuid::new_v4();

    let po = P2pVerticalSliceEngine::create_purchase_order(CreatePurchaseOrderParams {
        id: Uuid::new_v4(),
        company_id,
        po_number: "PO-002".to_string(),
        vendor_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        quantity: dec!(10.00),
        unit_price: dec!(10000.00),
        created_by: maker,
    })
    .unwrap();

    let gr = P2pVerticalSliceEngine::create_goods_receipt(
        Uuid::new_v4(),
        company_id,
        "GR-002".to_string(),
        &po,
        dec!(10.00),
        Uuid::new_v4(),
        maker,
    )
    .unwrap();

    // 1. Qty exceeds received qty without tolerance -> Rejected
    let err_qty = P2pVerticalSliceEngine::create_purchase_bill(CreatePurchaseBillParams {
        id: Uuid::new_v4(),
        company_id,
        bill_number: "BILL-002".to_string(),
        po: &po,
        gr: &gr,
        billed_quantity: dec!(12.00), // Exceeds 10
        billed_unit_price: dec!(10000.00),
        maker_id: maker,
        price_tolerance: dec!(0.00),
        qty_tolerance: dec!(0.00),
    });
    assert!(err_qty.is_err());

    // 2. Price exceeds PO price without tolerance -> Rejected
    let err_price = P2pVerticalSliceEngine::create_purchase_bill(CreatePurchaseBillParams {
        id: Uuid::new_v4(),
        company_id,
        bill_number: "BILL-003".to_string(),
        po: &po,
        gr: &gr,
        billed_quantity: dec!(10.00),
        billed_unit_price: dec!(12000.00), // Exceeds 10,000
        maker_id: maker,
        price_tolerance: dec!(0.00),
        qty_tolerance: dec!(0.00),
    });
    assert!(err_price.is_err());
}

#[test]
fn test_gate2_maker_checker_sod_enforcement() {
    let company_id = Uuid::new_v4();
    let maker = Uuid::new_v4();

    let po = P2pVerticalSliceEngine::create_purchase_order(CreatePurchaseOrderParams {
        id: Uuid::new_v4(),
        company_id,
        po_number: "PO-004".to_string(),
        vendor_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        quantity: dec!(5.00),
        unit_price: dec!(20000.00),
        created_by: maker,
    })
    .unwrap();

    let gr = P2pVerticalSliceEngine::create_goods_receipt(
        Uuid::new_v4(),
        company_id,
        "GR-004".to_string(),
        &po,
        dec!(5.00),
        Uuid::new_v4(),
        maker,
    )
    .unwrap();

    let mut bill = P2pVerticalSliceEngine::create_purchase_bill(CreatePurchaseBillParams {
        id: Uuid::new_v4(),
        company_id,
        bill_number: "BILL-004".to_string(),
        po: &po,
        gr: &gr,
        billed_quantity: dec!(5.00),
        billed_unit_price: dec!(20000.00),
        maker_id: maker,
        price_tolerance: dec!(0.00),
        qty_tolerance: dec!(0.00),
    })
    .unwrap();

    // Maker tries to approve own bill -> MUST FAIL
    let sod_err = P2pVerticalSliceEngine::approve_and_post_purchase_bill(
        &mut bill,
        maker, // Same user!
        Uuid::new_v4(),
        Uuid::new_v4(),
    );
    assert!(sod_err.is_err());
}

#[test]
fn test_gate2_posted_document_immutability_and_exact_reversal() {
    let company_id = Uuid::new_v4();
    let maker = Uuid::new_v4();
    let checker = Uuid::new_v4();
    let grir_acc = Uuid::new_v4();
    let ap_acc = Uuid::new_v4();

    let po = P2pVerticalSliceEngine::create_purchase_order(CreatePurchaseOrderParams {
        id: Uuid::new_v4(),
        company_id,
        po_number: "PO-005".to_string(),
        vendor_id: Uuid::new_v4(),
        item_id: Uuid::new_v4(),
        quantity: dec!(2.00),
        unit_price: dec!(100000.00),
        created_by: maker,
    })
    .unwrap();

    let gr = P2pVerticalSliceEngine::create_goods_receipt(
        Uuid::new_v4(),
        company_id,
        "GR-005".to_string(),
        &po,
        dec!(2.00),
        Uuid::new_v4(),
        maker,
    )
    .unwrap();

    let mut bill = P2pVerticalSliceEngine::create_purchase_bill(CreatePurchaseBillParams {
        id: Uuid::new_v4(),
        company_id,
        bill_number: "BILL-005".to_string(),
        po: &po,
        gr: &gr,
        billed_quantity: dec!(2.00),
        billed_unit_price: dec!(100000.00),
        maker_id: maker,
        price_tolerance: dec!(0.00),
        qty_tolerance: dec!(0.00),
    })
    .unwrap();

    let original_gl = P2pVerticalSliceEngine::approve_and_post_purchase_bill(
        &mut bill, checker, grir_acc, ap_acc,
    )
    .unwrap();

    assert_eq!(bill.status, P2pDocumentStatus::Posted);

    // Cannot re-approve or edit posted bill
    let reapprove_err = P2pVerticalSliceEngine::approve_and_post_purchase_bill(
        &mut bill, checker, grir_acc, ap_acc,
    );
    assert!(reapprove_err.is_err());

    // Cancellation creates exact reversal
    let reversals = P2pVerticalSliceEngine::cancel_posted_bill(
        &mut bill,
        &original_gl,
        checker,
        "Goods returned due to defect",
    )
    .expect("Cancellation reversal must succeed");

    assert_eq!(bill.status, P2pDocumentStatus::Cancelled);
    assert_eq!(reversals.len(), original_gl.len());
    for rev in reversals {
        assert!(rev.is_reversal);
    }
}
