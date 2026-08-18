//! Pure Journal Entry Entities (Fase 23: Complete Lifecycle & Reversal Voucher Tracking)

use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum JournalStatus {
    Draft,
    Submitted,
    Approved,
    Posted,
    Reversed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntry {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub transaction_number: String,
    pub date: NaiveDate,
    pub description: String,
    pub reference: Option<String>,
    pub status: JournalStatus,
    pub created_by: Option<Uuid>,
    pub reversed_by: Option<Uuid>,
    pub reversed_at: Option<DateTime<Utc>>,
    pub reversal_reason: Option<String>,
    pub reversal_source_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalLine {
    pub id: Uuid,
    pub journal_entry_id: Uuid,
    pub account_id: Uuid,
    pub description: Option<String>,
    #[serde(with = "rust_decimal::serde::str")]
    pub debit: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub credit: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntryDetail {
    #[serde(flatten)]
    pub header: JournalEntry,
    pub lines: Vec<JournalLine>,
}

#[derive(Debug, Deserialize)]
pub struct CreateJournalLineRequest {
    pub account_id: Uuid,
    pub description: Option<String>,
    #[serde(with = "rust_decimal::serde::str")]
    pub debit: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub credit: Decimal,
}

#[derive(Debug, Deserialize)]
pub struct CreateJournalEntryRequest {
    pub company_id: Option<Uuid>,
    pub date: NaiveDate,
    pub description: String,
    pub reference: Option<String>,
    pub lines: Vec<CreateJournalLineRequest>,
}

#[derive(Debug, Deserialize)]
pub struct ReverseJournalRequest {
    pub reason: String,
}
