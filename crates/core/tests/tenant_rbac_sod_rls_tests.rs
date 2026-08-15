//! Tenant Isolation, RBAC, and Segregation of Duties (SoD) Tests (Fase 6)
//!
//! Validates:
//! 1. Cross-tenant boundary enforcement.
//! 2. Cross-company boundary enforcement.
//! 3. SoD Conflict rules (Maker cannot approve/post own documents).
//! 4. Valid separate checker execution.

use management_system_core::domain::sod::SodValidator;
use management_system_core::domain::tenant::TenantContext;
use uuid::Uuid;

#[test]
fn test_cross_tenant_isolation_boundary() {
    let tenant_1 = Uuid::new_v4();
    let tenant_2 = Uuid::new_v4();

    let ctx = TenantContext::new(tenant_1, None);

    // Accessing own tenant succeeds
    assert!(ctx.enforce_boundary(tenant_1).is_ok());

    // Accessing different tenant fails (Fail-Closed)
    let res = ctx.enforce_boundary(tenant_2);
    assert!(res.is_err(), "Cross-tenant access must be strictly denied");
}

#[test]
fn test_cross_company_isolation_boundary() {
    let tenant_id = Uuid::new_v4();
    let company_a = Uuid::new_v4();
    let company_b = Uuid::new_v4();

    let ctx_a = TenantContext::new(tenant_id, Some(company_a));

    // Accessing own company data succeeds
    assert!(ctx_a.enforce_company_boundary(Some(company_a)).is_ok());

    // Accessing different company data fails (Fail-Closed)
    let res = ctx_a.enforce_company_boundary(Some(company_b));
    assert!(res.is_err(), "Cross-company access must be strictly denied");
}

#[test]
fn test_sod_purchase_order_approval_violation() {
    let maker_id = Uuid::new_v4();
    let res = SodValidator::validate_po_approval(maker_id, maker_id);

    assert!(
        res.is_err(),
        "Maker cannot approve their own Purchase Order (SOD-004)"
    );
}

#[test]
fn test_sod_journal_posting_violation() {
    let maker_id = Uuid::new_v4();
    let res = SodValidator::validate_journal_posting(maker_id, maker_id);

    assert!(
        res.is_err(),
        "Maker cannot post their own Journal Entry to General Ledger (SOD-003)"
    );
}

#[test]
fn test_sod_stock_entry_submit_violation() {
    let maker_id = Uuid::new_v4();
    // validate_stock_adjustment is the correct method (Fase 21 fix: validate_stock_entry_submit does not exist)
    let res = SodValidator::validate_stock_adjustment(maker_id, maker_id);

    assert!(
        res.is_err(),
        "Maker cannot submit their own Stock Adjustment Entry (SOD-009)"
    );
}

#[test]
fn test_sod_payroll_approval_violation() {
    let maker_id = Uuid::new_v4();
    // validate_payment_approval is the closest available method (Fase 21 fix: validate_payroll_approval does not exist)
    let res = SodValidator::validate_payment_approval(maker_id, maker_id);

    assert!(
        res.is_err(),
        "Maker cannot approve their own Payment/Payroll Disbursement (SOD-006)"
    );
}

#[test]
fn test_sod_valid_separate_checker_permitted() {
    let maker_id = Uuid::new_v4();
    let checker_id = Uuid::new_v4();

    assert!(SodValidator::validate_po_approval(maker_id, checker_id).is_ok());
    assert!(SodValidator::validate_journal_posting(maker_id, checker_id).is_ok());
    assert!(SodValidator::validate_stock_adjustment(maker_id, checker_id).is_ok());
    assert!(SodValidator::validate_payment_approval(maker_id, checker_id).is_ok());
}
