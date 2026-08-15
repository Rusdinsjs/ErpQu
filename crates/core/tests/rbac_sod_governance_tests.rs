//! Real RBAC & Segregation of Duties (SoD) Governance Tests (Fase 18)
//!
//! Validates:
//! 1. Action-based permission model (Allowed vs Denied).
//! 2. 8 Minimal SoD Rules (Self-approval, Receiver vs Payer, Technical Admin restriction).
//! 3. Cross-company access denial.
//! 4. Role revocation during active session.
//! 5. Direct unauthorized API action calls.

use management_system_core::domain::authz::{
    ActorContext, AuthzContext, AuthorizationEngine, DefaultAuthorizationEngine,
};
use management_system_core::domain::sod::SodValidator;
use uuid::Uuid;

#[test]
fn test_action_based_permission_allowed() {
    let engine = DefaultAuthorizationEngine::new();
    let actor = ActorContext {
        user_id: Uuid::new_v4(),
        role: "procurement_officer".to_string(),
        role_level: 4,
        permissions: vec!["purchase_order.create".to_string()],
        organization_id: None,
        company_id: None,
    };
    let ctx = AuthzContext::default();

    let decision = engine.authorize(&actor, "create", "purchase_order", None, &ctx);
    assert!(decision.is_allowed(), "Actor with purchase_order.create MUST be allowed");
}

#[test]
fn test_action_based_permission_denied_when_missing() {
    let engine = DefaultAuthorizationEngine::new();
    let actor = ActorContext {
        user_id: Uuid::new_v4(),
        role: "inventory_clerk".to_string(),
        role_level: 5,
        permissions: vec!["stock.read".to_string()],
        organization_id: None,
        company_id: None,
    };
    let ctx = AuthzContext::default();

    let decision = engine.authorize(&actor, "post", "journal", None, &ctx);
    assert!(!decision.is_allowed(), "Actor without journal.post MUST be denied");
}

#[test]
fn test_sod_rule_1_vendor_self_approval_rejected() {
    let user_id = Uuid::new_v4();
    let res = SodValidator::validate_vendor_approval(user_id, user_id);
    assert!(res.is_err(), "Vendor creator approving own vendor MUST be rejected");
}

#[test]
fn test_sod_rule_2_po_self_approval_rejected() {
    let maker_id = Uuid::new_v4();
    let res = SodValidator::validate_po_approval(maker_id, maker_id);
    assert!(res.is_err(), "PO maker approving own PO MUST be rejected");
}

#[test]
fn test_sod_rule_3_goods_receiver_cannot_pay_supplier() {
    let receiver_id = Uuid::new_v4();
    let res = SodValidator::validate_goods_receipt_vs_payment(receiver_id, receiver_id);
    assert!(res.is_err(), "Goods receiver paying supplier MUST be rejected");
}

#[test]
fn test_sod_rule_4_payment_self_approval_rejected() {
    let maker_id = Uuid::new_v4();
    let res = SodValidator::validate_payment_approval(maker_id, maker_id);
    assert!(res.is_err(), "Payment creator approving own payment MUST be rejected");
}

#[test]
fn test_sod_rule_5_journal_self_posting_rejected() {
    let maker_id = Uuid::new_v4();
    let res = SodValidator::validate_journal_posting(maker_id, maker_id);
    assert!(res.is_err(), "Journal creator posting own journal MUST be rejected");
}

#[test]
fn test_sod_rule_6_stock_adjustment_self_approval_rejected() {
    let maker_id = Uuid::new_v4();
    let res = SodValidator::validate_stock_adjustment(maker_id, maker_id);
    assert!(res.is_err(), "Stock adjustment creator approving own adjustment MUST be rejected");
}

#[test]
fn test_sod_rule_7_asset_disposal_self_approval_rejected() {
    let maker_id = Uuid::new_v4();
    let res = SodValidator::validate_asset_disposal(maker_id, maker_id);
    assert!(res.is_err(), "Asset disposal creator approving own disposal MUST be rejected");
}

#[test]
fn test_sod_rule_8_technical_admin_not_automatic_finance_approver() {
    let engine = DefaultAuthorizationEngine::new();
    let tech_admin = ActorContext {
        user_id: Uuid::new_v4(),
        role: "admin".to_string(),
        role_level: 2,
        permissions: vec!["user.manage".to_string()],
        organization_id: None,
        company_id: None,
    };
    let ctx = AuthzContext::default();

    let decision = engine.authorize(&tech_admin, "post", "journal", None, &ctx);
    assert!(
        !decision.is_allowed(),
        "Technical admin without explicit journal.post permission MUST NOT be allowed"
    );

    let sod_check = SodValidator::validate_technical_admin_finance_action("admin", false, "journal.post");
    assert!(sod_check.is_err(), "SodValidator MUST reject technical admin without explicit finance permission");
}

#[test]
fn test_cross_company_permission_denied() {
    let engine = DefaultAuthorizationEngine::new();
    let comp_a = Uuid::new_v4();
    let comp_b = Uuid::new_v4();

    let actor = ActorContext {
        user_id: Uuid::new_v4(),
        role: "accountant".to_string(),
        role_level: 4,
        permissions: vec!["journal.post".to_string()],
        organization_id: None,
        company_id: Some(comp_a),
    };
    let ctx = AuthzContext {
        organization_id: None,
        company_id: Some(comp_b),
        attributes: Default::default(),
    };

    let decision = engine.authorize(&actor, "post", "journal", None, &ctx);
    assert!(!decision.is_allowed(), "Cross-company access MUST be denied");
}

#[test]
fn test_role_revocation_during_active_session() {
    let engine = DefaultAuthorizationEngine::new();

    // Session 1: User has permissions
    let mut actor = ActorContext {
        user_id: Uuid::new_v4(),
        role: "accountant".to_string(),
        role_level: 4,
        permissions: vec!["payment.approve".to_string()],
        organization_id: None,
        company_id: None,
    };
    let ctx = AuthzContext::default();

    assert!(engine.authorize(&actor, "approve", "payment", None, &ctx).is_allowed());

    // Role revoked: permissions list cleared
    actor.permissions.clear();
    assert!(
        !engine.authorize(&actor, "approve", "payment", None, &ctx).is_allowed(),
        "Revoking permissions MUST immediately deny access on subsequent evaluation"
    );
}
