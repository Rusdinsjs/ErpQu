use chrono::{DateTime, NaiveDate, Utc};
use management_system_macros::DocType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Immutable General Ledger Entry Entity (QACC-003)
#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity GLEntry")]
pub struct GLEntry {
    pub id: Uuid,
    pub company_id: Uuid,
    pub posting_date: NaiveDate,
    pub posting_datetime: DateTime<Utc>,
    pub account_id: Uuid,
    pub party_type: Option<String>,
    pub party_id: Option<Uuid>,
    pub cost_center_id: Option<Uuid>,
    pub project_id: Option<Uuid>,
    pub currency: String,
    pub exchange_rate: Decimal,
    pub debit: Decimal,
    pub credit: Decimal,
    pub debit_in_account_currency: Decimal,
    pub credit_in_account_currency: Decimal,
    pub voucher_type: String,
    pub voucher_no: String,
    pub voucher_id: Uuid,
    pub is_reversal: bool,
    pub reversal_source_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
}

impl GLEntry {
    /// Creates an exact mirrored reversal entry for this GL entry (QACC-003)
    pub fn create_reversal(&self, reversal_date: NaiveDate) -> Self {
        Self {
            id: Uuid::new_v4(),
            company_id: self.company_id,
            posting_date: reversal_date,
            posting_datetime: Utc::now(),
            account_id: self.account_id,
            party_type: self.party_type.clone(),
            party_id: self.party_id,
            cost_center_id: self.cost_center_id,
            project_id: self.project_id,
            currency: self.currency.clone(),
            exchange_rate: self.exchange_rate,
            debit: self.credit,
            credit: self.debit,
            debit_in_account_currency: self.credit_in_account_currency,
            credit_in_account_currency: self.debit_in_account_currency,
            voucher_type: self.voucher_type.clone(),
            voucher_no: format!("{}-REV", self.voucher_no),
            voucher_id: self.voucher_id,
            is_reversal: true,
            reversal_source_id: Some(self.id),
            created_at: Utc::now(),
            created_by: self.created_by,
        }
    }
}

/// A line item inside a posting instruction sent to AccountingPostingEngine (QACC-004)
#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity PostingLineItem")]
pub struct PostingLineItem {
    pub account_id: Uuid,
    pub debit: Decimal,
    pub credit: Decimal,
    pub party_type: Option<String>,
    pub party_id: Option<Uuid>,
    pub cost_center_id: Option<Uuid>,
    pub project_id: Option<Uuid>,
    pub currency: Option<String>,
    pub exchange_rate: Option<Decimal>,
}

/// Structured posting instruction passed to AccountingPostingEngine (QACC-004)
#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity PostingInstruction")]
pub struct PostingInstruction {
    pub company_id: Uuid,
    pub posting_date: NaiveDate,
    pub voucher_type: String,
    pub voucher_no: String,
    pub voucher_id: Uuid,
    pub lines: Vec<PostingLineItem>,
    pub created_by: Option<Uuid>,
}
