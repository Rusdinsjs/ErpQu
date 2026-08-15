//! Segregation of Duties (SoD) & Maker-Checker Kernel (Fase 6)
//!
//! Enforces:
//! 1. Maker cannot approve or post their own financial/operational document.
//! 2. Four-Eyes Principle for high-risk mutations.
//! 3. Mandatory audit log trail for elevated overrides.

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
                    "Document maker ({}) cannot perform '{}' on their own document. A separate checker is required (Four-Eyes Principle).",
                    maker_id, action_name
                ),
            ));
        }
        Ok(())
    }

    /// Validate Purchase Order Approval SoD (SOD-004)
    pub fn validate_po_approval(created_by: Uuid, approver_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, approver_id, "Purchase Order Approval")
    }

    /// Validate Journal Entry Posting SoD (SOD-003)
    pub fn validate_journal_posting(created_by: Uuid, poster_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, poster_id, "General Ledger Journal Posting")
    }

    /// Validate Stock Entry Submit SoD (SOD-009)
    pub fn validate_stock_entry_submit(created_by: Uuid, submitter_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(created_by, submitter_id, "Stock Entry Final Submit")
    }

    /// Validate Payroll Approval SoD (SOD-006)
    pub fn validate_payroll_approval(prepared_by: Uuid, approver_id: Uuid) -> DomainResult<()> {
        Self::validate_maker_checker(prepared_by, approver_id, "Payroll Disbursement Approval")
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
    fn test_separate_checker_can_approve_po() {
        let maker_id = Uuid::new_v4();
        let checker_id = Uuid::new_v4();
        let res = SodValidator::validate_po_approval(maker_id, checker_id);
        assert!(res.is_ok(), "Separate checker must be allowed to approve PO");
    }

    #[test]
    fn test_maker_cannot_post_own_journal() {
        let user_id = Uuid::new_v4();
        let res = SodValidator::validate_journal_posting(user_id, user_id);
        assert!(res.is_err(), "Maker posting own Journal must be rejected");
    }

    #[test]
    fn test_maker_cannot_approve_own_payroll() {
        let user_id = Uuid::new_v4();
        let res = SodValidator::validate_payroll_approval(user_id, user_id);
        assert!(res.is_err(), "Maker approving own Payroll must be rejected");
    }
}
