use chrono::NaiveDate;
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// AR / AP Aging Bucket Classification (QFAS-009)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgingBucket {
    Current,
    Days1To30,
    Days31To60,
    Days61To90,
    Over90,
}

pub struct AgingCalculator;

impl AgingCalculator {
    /// Classifies an invoice into an aging bucket based on due date and as-of date
    pub fn classify(due_date: NaiveDate, as_of_date: NaiveDate) -> AgingBucket {
        if as_of_date <= due_date {
            AgingBucket::Current
        } else {
            let overdue_days = (as_of_date - due_date).num_days();
            match overdue_days {
                1..=30 => AgingBucket::Days1To30,
                31..=60 => AgingBucket::Days31To60,
                61..=90 => AgingBucket::Days61To90,
                _ => AgingBucket::Over90,
            }
        }
    }
}

/// Three-Way Matching Validator for Accounts Payable (QBUY-005)
pub struct ThreeWayMatchValidator;

impl ThreeWayMatchValidator {
    /// Validates Purchase Order vs Goods Receipt vs Purchase Bill
    pub fn validate(
        po_qty: Decimal,
        po_unit_price: Decimal,
        gr_qty: Decimal,
        invoice_qty: Decimal,
        invoice_unit_price: Decimal,
        price_tolerance: Decimal,
        qty_tolerance: Decimal,
    ) -> DomainResult<()> {
        // 1. Quantity matching: Invoice qty must not exceed received qty + tolerance
        let max_allowed_qty = gr_qty + qty_tolerance;
        if invoice_qty > max_allowed_qty {
            return Err(DomainError::business_rule(
                "three_way_match_quantity_variance_exceeded",
                &format!(
                    "Invoiced quantity ({}) exceeds received quantity ({}) plus tolerance ({})",
                    invoice_qty, gr_qty, qty_tolerance
                ),
            ));
        }

        // 2. Unit price matching: Invoice price must not exceed PO price + tolerance
        let price_diff = (invoice_unit_price - po_unit_price).max(Decimal::ZERO);
        if price_diff > price_tolerance {
            return Err(DomainError::business_rule(
                "three_way_match_price_variance_exceeded",
                &format!(
                    "Invoiced unit price ({}) exceeds PO unit price ({}) by {} (tolerance: {})",
                    invoice_unit_price, po_unit_price, price_diff, price_tolerance
                ),
            ));
        }

        Ok(())
    }
}

/// Invoice item for payment allocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceAllocationItem {
    pub invoice_id: Uuid,
    pub invoice_no: String,
    pub total_amount: Decimal,
    pub outstanding_amount: Decimal,
    pub allocated_amount: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentAllocationSummary {
    pub total_payment: Decimal,
    pub total_allocated: Decimal,
    pub unallocated_advance: Decimal,
    pub allocations: Vec<InvoiceAllocationItem>,
}

pub struct PaymentAllocationEngine;

impl PaymentAllocationEngine {
    /// Allocates payment to a list of invoices using FIFO order (QACC-009)
    pub fn allocate_fifo(
        payment_amount: Decimal,
        invoices: &[InvoiceAllocationItem],
    ) -> DomainResult<PaymentAllocationSummary> {
        if payment_amount <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_payment_amount",
                "Payment amount must be strictly greater than zero",
            ));
        }

        let mut remaining_payment = payment_amount;
        let mut allocated_invoices = Vec::new();
        let mut total_allocated = Decimal::ZERO;

        for inv in invoices {
            if inv.outstanding_amount <= Decimal::ZERO {
                continue;
            }

            if remaining_payment <= Decimal::ZERO {
                allocated_invoices.push(inv.clone());
                continue;
            }

            let allocation = remaining_payment.min(inv.outstanding_amount);
            remaining_payment -= allocation;
            total_allocated += allocation;

            let mut updated_inv = inv.clone();
            updated_inv.allocated_amount += allocation;
            updated_inv.outstanding_amount -= allocation;
            allocated_invoices.push(updated_inv);
        }

        Ok(PaymentAllocationSummary {
            total_payment: payment_amount,
            total_allocated,
            unallocated_advance: remaining_payment,
            allocations: allocated_invoices,
        })
    }

    /// Validates explicit allocation to ensure no over-allocation
    pub fn validate_explicit_allocation(
        outstanding_amount: Decimal,
        requested_allocation: Decimal,
    ) -> DomainResult<()> {
        if requested_allocation <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_allocation_amount",
                "Allocation amount must be strictly positive",
            ));
        }

        if requested_allocation > outstanding_amount {
            return Err(DomainError::business_rule(
                "over_allocation_denied",
                &format!(
                    "Requested allocation ({}) exceeds invoice outstanding balance ({})",
                    requested_allocation, outstanding_amount
                ),
            ));
        }

        Ok(())
    }
}

/// Bank Transfer Balance Conservation Validator
pub struct BankTransferValidator;

impl BankTransferValidator {
    /// Verifies that transfer from Bank A to Bank B via Clearing Account conserves exact balance
    pub fn validate_transfer(
        source_debit: Decimal,
        transit_clearing: Decimal,
        dest_credit: Decimal,
        fee_amount: Decimal,
    ) -> DomainResult<()> {
        if source_debit <= Decimal::ZERO || dest_credit <= Decimal::ZERO {
            return Err(DomainError::business_rule(
                "invalid_transfer_amount",
                "Transfer amounts must be strictly positive",
            ));
        }

        if source_debit != (dest_credit + fee_amount) {
            return Err(DomainError::business_rule(
                "transfer_balance_mismatch",
                &format!(
                    "Source withdrawal ({}) must equal destination deposit ({}) + fees ({})",
                    source_debit, dest_credit, fee_amount
                ),
            ));
        }

        if transit_clearing != (source_debit - fee_amount) {
            return Err(DomainError::business_rule(
                "clearing_transit_mismatch",
                "Transit clearing amount must equal net transfer amount",
            ));
        }

        Ok(())
    }
}
