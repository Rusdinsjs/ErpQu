//! Bank Statement & Reconciliation Domain Entities
use chrono::{DateTime, NaiveDate, Utc};
use management_system_macros::DocType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity BankStatement")]
pub struct BankStatement {
    pub id: Uuid,
    pub company_id: Uuid,
    pub account_id: Uuid,
    pub statement_date: NaiveDate,
    pub reference_number: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub opening_balance: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub closing_balance: Decimal,
    pub status: String,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity BankStatementLine")]
pub struct BankStatementLine {
    pub id: Uuid,
    pub statement_id: Uuid,
    pub company_id: Uuid,
    pub transaction_date: NaiveDate,
    pub description: String,
    pub reference_number: Option<String>,
    #[serde(with = "rust_decimal::serde::str")]
    pub amount: Decimal,
    pub is_reconciled: bool,
    pub matched_gl_entry_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity BankReconciliation")]
pub struct BankReconciliation {
    pub id: Uuid,
    pub company_id: Uuid,
    pub account_id: Uuid,
    pub statement_id: Uuid,
    pub as_of_date: NaiveDate,
    #[serde(with = "rust_decimal::serde::str")]
    pub statement_ending_balance: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub gl_ending_balance: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub unreconciled_difference: Decimal,
    pub status: String,
    pub reconciled_by: Uuid,
    pub reconciled_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity ImportBankStatementRequest")]
pub struct ImportBankStatementRequest {
    pub account_id: Uuid,
    pub statement_date: NaiveDate,
    pub reference_number: String,
    pub opening_balance: Option<Decimal>,
    pub closing_balance: Option<Decimal>,
    pub lines: Vec<ImportBankStatementLineRequest>,
}

#[derive(Debug, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity ImportBankStatementLineRequest")]
pub struct ImportBankStatementLineRequest {
    pub transaction_date: NaiveDate,
    pub description: String,
    pub reference_number: Option<String>,
    pub amount: Decimal,
}

#[derive(Debug, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity BankStatementDetailResponse")]
pub struct BankStatementDetailResponse {
    pub statement: BankStatement,
    pub lines: Vec<BankStatementLine>,
}

#[derive(Debug, Serialize, Deserialize, DocType)]
#[doctype(module = "Finance", description = "Entity AutoMatchResult")]
pub struct AutoMatchResult {
    pub matched_count: usize,
    pub total_lines: usize,
}
