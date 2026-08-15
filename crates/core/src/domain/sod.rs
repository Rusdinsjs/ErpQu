//! Segregation of Duties (SoD) & Maker-Checker Kernel (Fase 18 Governance)
//!
//! Enforces 8 Minimal SoD Rules:
//! 1. Vendor Creator vs Vendor Approver (vendor.create != vendor.approve)
//! 2. PO Creator vs PO Approver (purchase_order.create != purchase_order.approve)
//! 3. Goods Receiver vs Supplier Payer (goods_receipt.post != payment.create / payment.approve)
//! 4. Payment Creator vs Payment Approver (payment.create != payment.approve)
//! 5. Journal Creator vs Journal Poster (journal.create != journal.post)
//! 6. Stock Adjustment Creator vs Stock Adjustment Approver (stock.adjust)
//! 7. Asset Disposal Creator vs Asset Disposal Approver (asset.dispose)
//! 8. Technical Administrator IS NOT automatically a Finance Approver without explicit permission.

use crate::domain::errors::{DomainError, DomainResult};
use uuid::Uuid;

/// Core SoD Conflict Checker
pub struct SodValidator;

impl SodValidator {
    /// Validate that the approving/posting user (checker) is different from the document creator (maker)
    pub fn validate_maker_checker(
        maker_id: Uuid,
        checker_id: Uuid,
        action_name: &str,
    ) -> DomainResult<()> {
        if maker_id == checker_id {
            return Err(DomainError::business_rule(
                "sod_conflict_violation",
                &format!(
                    "Self-approval rejected: Document maker ({}) cannot perform '{}' on their own document. A separate checker is required (Four-Eyes Principle).",
                    maker_id, action_name
                ),
            ));
        }
        Ok(())
    }

    /// Rule 1: Validate Vendor Approval SoD
    pub fn validate_vendor_approval(created_by: Uuid, approver_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, approver_id, "Vendor Approval")
    }

    /// Rule 2: Validate Purchase Order Approval SoD
    pub fn validate_po_approval(created_by: Uuid, approver_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, approver_id, "Purchase Order Approval")
    }

    /// Rule 3: Validate Goods Receiver vs Supplier Payer Conflict
    pub fn validate_goods_receipt_vs_payment(receiver_id: Uuid, payer_id: Uuid) -> DomainResult<()> {
        if receiver_id == payer_id {
            return Err(DomainError::business_rule(
                "sod_role_conflict",
                &format!(
                    "Role Conflict Violation: User ({}) who posted Goods Receipt cannot execute or approve Supplier Payment for the same transaction.",
                    receiver_id
                ),
            ));
        }
        Ok(())
    }

    /// Rule 4: Validate Payment Approval SoD
    pub fn validate_payment_approval(created_by: Uuid, approver_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, approver_id, "Payment Disbursement Approval")
    }

    /// Rule 5: Validate Journal Entry Posting SoD
    pub fn validate_journal_posting(created_by: Uuid, poster_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, poster_id, "General Ledger Journal Posting")
    }

    /// Rule 6: Validate Stock Adjustment Approval SoD
    pub fn validate_stock_adjustment(created_by: Uuid, approver_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, approver_id, "Stock Inventory Adjustment Approval")
    }

    /// Rule 7: Validate Asset Disposal Approval SoD
    pub fn validate_asset_disposal(created_by: Uuid, approver_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, approver_id, "Asset Disposal Approval")
    }

    /// Rule 8: Validate Technical Admin vs Finance Action Boundary
    pub fn validate_technical_admin_finance_action(
        user_role: &str,
        has_explicit_permission: bool,
        finance_action: &str,
    ) -> DomainResult<()> {
        if (user_role == "admin" || user_role == "sysadmin") && !has_explicit_permission {
            return Err(DomainError::business_rule(
                "sod_admin_finance_boundary",
                &format!(
                    "Technical Administrator role ('{}') is strictly prohibited from executing finance action '{}' without explicit action permission.",
                    user_role, finance_action
                ),
            ));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_maker_cannot_approve_own_po() {
        let user_id = Uuid::new_v4();
        let res = SodValidator::validate_po_approval(user_id, user_id);
        assert!(res.is_err(), "Maker approving own PO must be rejected");
    }

    #[test]
    fn test_goods_receiver_cannot_pay_supplier() {
        let user_id = Uuid::new_v4();
        let res = SodValidator::validate_goods_receipt_vs_payment(user_id, user_id);
        assert!(res.is_err(), "Goods receiver paying supplier must be rejected");
    }

    #[test]
    fn test_technical_admin_denied_finance_action_without_explicit_perm() {
        let res = SodValidator::validate_technical_admin_finance_action("admin", false, "journal.post");
        assert!(res.is_err(), "Technical admin without explicit perm must be denied journal.post");
    }
}
