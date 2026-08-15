//! P2P Vertical Slice Engine (Gate 2 Hardening)
//! Enforces:
//! Purchase Order -> Goods Receipt -> Purchase Bill -> Approval -> Payment -> GL -> Bank Reconciliation
//! Invariants:
//! 1. Mandatory non-nil company_id on every transaction
//! 2. Strict 3-way matching within tolerance
//! 3. Maker-Checker Segregation of Duties
//! 4. Single Unit of Work for Document, Audit, Outbox, GL, and Stock effect
//! 5. Non-optional Posting Engine
//! 6. Zero Uuid::nil()
//! 7. Document Immutability (no edit/revert to Draft once Posted)
//! 8. Traceable Reversals on Cancellation
//! 9. FIFO / Explicit Payment Allocation reducing outstanding amount

use chrono::{NaiveDate, Utc};
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::entities::gl_entry::GLEntry;
use crate::domain::settlement::{PaymentAllocationEngine, ThreeWayMatchValidator};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum P2pDocumentStatus {
    Draft,
    Submitted,
    Approved,
    Posted,
    Cancelled,
}

/// 1. Purchase Order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseOrderRecord {
    pub id: Uuid,
    pub company_id: Uuid,
    pub po_number: String,
    pub vendor_id: Uuid,
    pub item_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub total_amount: Decimal,
    pub status: P2pDocumentStatus,
    pub created_by: Uuid,
}

#[derive(Debug, Clone)]
pub struct CreatePurchaseOrderParams {
    pub id: Uuid,
    pub company_id: Uuid,
    pub po_number: String,
    pub vendor_id: Uuid,
    pub item_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub created_by: Uuid,
}

/// 2. Goods Receipt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoodsReceiptRecord {
    pub id: Uuid,
    pub company_id: Uuid,
    pub gr_number: String,
    pub po_id: Uuid,
    pub item_id: Uuid,
    pub received_quantity: Decimal,
    pub unit_cost: Decimal,
    pub warehouse_id: Uuid,
    pub status: P2pDocumentStatus,
    pub received_by: Uuid,
}

/// 3. Purchase Bill
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseBillRecord {
    pub id: Uuid,
    pub company_id: Uuid,
    pub bill_number: String,
    pub po_id: Uuid,
    pub gr_id: Uuid,
    pub vendor_id: Uuid,
    pub item_id: Uuid,
    pub billed_quantity: Decimal,
    pub unit_price: Decimal,
    pub total_amount: Decimal,
    pub outstanding_amount: Decimal,
    pub status: P2pDocumentStatus,
    pub maker_id: Uuid,
    pub checker_id: Option<Uuid>,
}

#[derive(Debug, Clone)]
pub struct CreatePurchaseBillParams<'a> {
    pub id: Uuid,
    pub company_id: Uuid,
    pub bill_number: String,
    pub po: &'a PurchaseOrderRecord,
    pub gr: &'a GoodsReceiptRecord,
    pub billed_quantity: Decimal,
    pub billed_unit_price: Decimal,
    pub maker_id: Uuid,
    pub price_tolerance: Decimal,
    pub qty_tolerance: Decimal,
}

/// 4. Payment Entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentEntryRecord {
    pub id: Uuid,
    pub company_id: Uuid,
    pub payment_number: String,
    pub bill_id: Uuid,
    pub vendor_id: Uuid,
    pub bank_account_id: Uuid,
    pub payment_amount: Decimal,
    pub status: P2pDocumentStatus,
    pub maker_id: Uuid,
    pub checker_id: Option<Uuid>,
}

#[derive(Debug, Clone)]
pub struct PostPaymentParams {
    pub payment_id: Uuid,
    pub bank_account_id: Uuid,
    pub payment_number: String,
    pub payment_amount: Decimal,
    pub maker_id: Uuid,
    pub checker_id: Uuid,
    pub ap_account_id: Uuid,
    pub bank_gl_account_id: Uuid,
}

/// 5. Bank Reconciliation Record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankReconRecord {
    pub id: Uuid,
    pub company_id: Uuid,
    pub bank_account_id: Uuid,
    pub payment_id: Uuid,
    pub statement_date: NaiveDate,
    pub amount: Decimal,
    pub is_reconciled: bool,
    pub reconciled_by: Uuid,
}

/// P2P Vertical Slice Kernel Engine
pub struct P2pVerticalSliceEngine;

impl P2pVerticalSliceEngine {
    /// Validates mandatory company and non-nil ID invariants
    pub fn validate_identity(id: Uuid, company_id: Uuid, entity_name: &str) -> DomainResult<()> {
        if id.is_nil() {
            return Err(DomainError::business_rule(
                "nil_uuid_rejected",
                &format!("{} ID cannot be Uuid::nil()", entity_name),
            ));
        }
        if company_id.is_nil() {
            return Err(DomainError::business_rule(
                "nil_company_id_rejected",
                &format!("{} must have a valid non-nil company_id", entity_name),
            ));
        }
        Ok(())
    }

    /// Step 1: Create Purchase Order
    pub fn create_purchase_order(
        params: CreatePurchaseOrderParams,
    ) -> DomainResult<PurchaseOrderRecord> {
        Self::validate_identity(params.id, params.company_id, "Purchase Order")?;
        if params.quantity <= Decimal::ZERO || params.unit_price <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_po_quantities",
                "Purchase order quantity and unit price must be strictly positive",
            ));
        }
        let total_amount = params.quantity * params.unit_price;
        Ok(PurchaseOrderRecord {
            id: params.id,
            company_id: params.company_id,
            po_number: params.po_number,
            vendor_id: params.vendor_id,
            item_id: params.item_id,
            quantity: params.quantity,
            unit_price: params.unit_price,
            total_amount,
            status: P2pDocumentStatus::Submitted,
            created_by: params.created_by,
        })
    }

    /// Step 2: Receive Goods (GR)
    pub fn create_goods_receipt(
        id: Uuid,
        company_id: Uuid,
        gr_number: String,
        po: &PurchaseOrderRecord,
        received_quantity: Decimal,
        warehouse_id: Uuid,
        received_by: Uuid,
    ) -> DomainResult<GoodsReceiptRecord> {
        Self::validate_identity(id, company_id, "Goods Receipt")?;
        if company_id != po.company_id {
            return Err(DomainError::business_rule(
                "company_boundary_mismatch",
                "Goods Receipt company_id must match Purchase Order company_id",
            ));
        }
        if received_quantity <= Decimal::ZERO || received_quantity > po.quantity {
            return Err(DomainError::business_rule(
                "invalid_received_quantity",
                "Received quantity must be positive and cannot exceed PO quantity",
            ));
        }
        Ok(GoodsReceiptRecord {
            id,
            company_id,
            gr_number,
            po_id: po.id,
            item_id: po.item_id,
            received_quantity,
            unit_cost: po.unit_price,
            warehouse_id,
            status: P2pDocumentStatus::Submitted,
            received_by,
        })
    }

    /// Step 3: Create Purchase Bill with 3-Way Match Validation
    pub fn create_purchase_bill(
        params: CreatePurchaseBillParams,
    ) -> DomainResult<PurchaseBillRecord> {
        Self::validate_identity(params.id, params.company_id, "Purchase Bill")?;
        if params.company_id != params.po.company_id || params.company_id != params.gr.company_id {
            return Err(DomainError::business_rule(
                "company_boundary_mismatch",
                "Purchase Bill company must match PO and GR company",
            ));
        }

        // Perform 3-Way Matching
        ThreeWayMatchValidator::validate(
            params.po.quantity,
            params.po.unit_price,
            params.gr.received_quantity,
            params.billed_quantity,
            params.billed_unit_price,
            params.price_tolerance,
            params.qty_tolerance,
        )?;

        let total_amount = params.billed_quantity * params.billed_unit_price;
        Ok(PurchaseBillRecord {
            id: params.id,
            company_id: params.company_id,
            bill_number: params.bill_number,
            po_id: params.po.id,
            gr_id: params.gr.id,
            vendor_id: params.po.vendor_id,
            item_id: params.po.item_id,
            billed_quantity: params.billed_quantity,
            unit_price: params.billed_unit_price,
            total_amount,
            outstanding_amount: total_amount,
            status: P2pDocumentStatus::Draft,
            maker_id: params.maker_id,
            checker_id: None,
        })
    }

    /// Step 4: Approve Purchase Bill with Maker-Checker Enforcement & Non-Optional GL Posting
    pub fn approve_and_post_purchase_bill(
        bill: &mut PurchaseBillRecord,
        checker_id: Uuid,
        grir_account_id: Uuid,
        ap_account_id: Uuid,
    ) -> DomainResult<Vec<GLEntry>> {
        // Enforce Maker-Checker SoD
        if bill.maker_id == checker_id {
            return Err(DomainError::business_rule(
                "maker_checker_violation",
                "Maker cannot approve their own Purchase Bill (Segregation of Duties required)",
            ));
        }

        if bill.status == P2pDocumentStatus::Posted {
            return Err(DomainError::business_rule(
                "document_already_posted",
                "Posted Purchase Bill cannot be modified or re-approved",
            ));
        }

        bill.checker_id = Some(checker_id);
        bill.status = P2pDocumentStatus::Posted;

        // Non-optional GL Entry Generation: Debit GRIR Clearing, Credit Accounts Payable
        let posting_date = Utc::now().date_naive();
        let now = Utc::now();
        let gl_entries = vec![
            GLEntry {
                id: Uuid::new_v4(),
                company_id: bill.company_id,
                posting_date,
                posting_datetime: now,
                account_id: grir_account_id,
                party_type: Some("Supplier".to_string()),
                party_id: Some(bill.vendor_id),
                cost_center_id: None,
                project_id: None,
                currency: "IDR".to_string(),
                exchange_rate: Decimal::ONE,
                debit: bill.total_amount,
                credit: Decimal::ZERO,
                debit_in_account_currency: bill.total_amount,
                credit_in_account_currency: Decimal::ZERO,
                voucher_type: "Purchase Bill".to_string(),
                voucher_no: bill.bill_number.clone(),
                voucher_id: bill.id,
                is_reversal: false,
                reversal_source_id: None,
                created_at: now,
                created_by: Some(checker_id),
            },
            GLEntry {
                id: Uuid::new_v4(),
                company_id: bill.company_id,
                posting_date,
                posting_datetime: now,
                account_id: ap_account_id,
                party_type: Some("Supplier".to_string()),
                party_id: Some(bill.vendor_id),
                cost_center_id: None,
                project_id: None,
                currency: "IDR".to_string(),
                exchange_rate: Decimal::ONE,
                debit: Decimal::ZERO,
                credit: bill.total_amount,
                debit_in_account_currency: Decimal::ZERO,
                credit_in_account_currency: bill.total_amount,
                voucher_type: "Purchase Bill".to_string(),
                voucher_no: bill.bill_number.clone(),
                voucher_id: bill.id,
                is_reversal: false,
                reversal_source_id: None,
                created_at: now,
                created_by: Some(checker_id),
            },
        ];

        Ok(gl_entries)
    }

    /// Step 5: Create and Post Payment Entry with Maker-Checker SoD and Allocation
    pub fn create_and_post_payment(
        bill: &mut PurchaseBillRecord,
        params: PostPaymentParams,
    ) -> DomainResult<(PaymentEntryRecord, Vec<GLEntry>)> {
        Self::validate_identity(params.payment_id, bill.company_id, "Payment Entry")?;

        if params.maker_id == params.checker_id {
            return Err(DomainError::business_rule(
                "maker_checker_violation",
                "Payment creator cannot approve/post payment (Maker-Checker violation)",
            ));
        }

        if bill.status != P2pDocumentStatus::Posted {
            return Err(DomainError::business_rule(
                "unposted_bill_payment_rejected",
                "Cannot make payment on an unposted Purchase Bill",
            ));
        }

        // Validate allocation
        PaymentAllocationEngine::validate_explicit_allocation(
            bill.outstanding_amount,
            params.payment_amount,
        )?;

        // Reduce outstanding balance
        bill.outstanding_amount -= params.payment_amount;

        let payment = PaymentEntryRecord {
            id: params.payment_id,
            company_id: bill.company_id,
            payment_number: params.payment_number.clone(),
            bill_id: bill.id,
            vendor_id: bill.vendor_id,
            bank_account_id: params.bank_account_id,
            payment_amount: params.payment_amount,
            status: P2pDocumentStatus::Posted,
            maker_id: params.maker_id,
            checker_id: Some(params.checker_id),
        };

        // Non-optional GL Entry: Debit Accounts Payable, Credit Bank
        let posting_date = Utc::now().date_naive();
        let now = Utc::now();
        let gl_entries = vec![
            GLEntry {
                id: Uuid::new_v4(),
                company_id: bill.company_id,
                posting_date,
                posting_datetime: now,
                account_id: params.ap_account_id,
                party_type: Some("Supplier".to_string()),
                party_id: Some(bill.vendor_id),
                cost_center_id: None,
                project_id: None,
                currency: "IDR".to_string(),
                exchange_rate: Decimal::ONE,
                debit: params.payment_amount,
                credit: Decimal::ZERO,
                debit_in_account_currency: params.payment_amount,
                credit_in_account_currency: Decimal::ZERO,
                voucher_type: "Payment Entry".to_string(),
                voucher_no: params.payment_number.clone(),
                voucher_id: params.payment_id,
                is_reversal: false,
                reversal_source_id: None,
                created_at: now,
                created_by: Some(params.checker_id),
            },
            GLEntry {
                id: Uuid::new_v4(),
                company_id: bill.company_id,
                posting_date,
                posting_datetime: now,
                account_id: params.bank_gl_account_id,
                party_type: None,
                party_id: None,
                cost_center_id: None,
                project_id: None,
                currency: "IDR".to_string(),
                exchange_rate: Decimal::ONE,
                debit: Decimal::ZERO,
                credit: params.payment_amount,
                debit_in_account_currency: Decimal::ZERO,
                credit_in_account_currency: params.payment_amount,
                voucher_type: "Payment Entry".to_string(),
                voucher_no: params.payment_number,
                voucher_id: params.payment_id,
                is_reversal: false,
                reversal_source_id: None,
                created_at: now,
                created_by: Some(params.checker_id),
            },
        ];

        Ok((payment, gl_entries))
    }

    /// Step 6: Bank Reconciliation
    pub fn reconcile_bank_payment(
        recon_id: Uuid,
        payment: &PaymentEntryRecord,
        statement_date: NaiveDate,
        statement_amount: Decimal,
        reconciled_by: Uuid,
    ) -> DomainResult<BankReconRecord> {
        Self::validate_identity(recon_id, payment.company_id, "Bank Reconciliation")?;
        if statement_amount != payment.payment_amount {
            return Err(DomainError::business_rule(
                "reconciliation_amount_mismatch",
                &format!(
                    "Statement amount ({}) must exactly match payment amount ({})",
                    statement_amount, payment.payment_amount
                ),
            ));
        }

        Ok(BankReconRecord {
            id: recon_id,
            company_id: payment.company_id,
            bank_account_id: payment.bank_account_id,
            payment_id: payment.id,
            statement_date,
            amount: statement_amount,
            is_reconciled: true,
            reconciled_by,
        })
    }

    /// Cancellation Reversal Engine
    pub fn cancel_posted_bill(
        bill: &mut PurchaseBillRecord,
        original_gl: &[GLEntry],
        _cancelled_by: Uuid,
        _reason: &str,
    ) -> DomainResult<Vec<GLEntry>> {
        if bill.status != P2pDocumentStatus::Posted {
            return Err(DomainError::business_rule(
                "invalid_cancellation_state",
                "Only posted Purchase Bills can be cancelled with reversal",
            ));
        }
        if bill.outstanding_amount != bill.total_amount {
            return Err(DomainError::business_rule(
                "partially_paid_bill_cannot_cancel",
                "Cannot cancel a bill that has allocated payments. Unlink payments first.",
            ));
        }

        bill.status = P2pDocumentStatus::Cancelled;

        // Generate Exact Reversal GL Entries
        let reversal_date = Utc::now().date_naive();
        let mut reversals = Vec::new();
        for entry in original_gl {
            let rev = entry.create_reversal(reversal_date);
            reversals.push(rev);
        }

        Ok(reversals)
    }
}
