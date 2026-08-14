//! Finance Entities
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::Type;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[sqlx(type_name = "account_type", rename_all = "lowercase")]
pub enum AccountType {
    Asset,
    Liability,
    Equity,
    Revenue,
    Expense,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[sqlx(type_name = "normal_balance", rename_all = "lowercase")]
pub enum NormalBalance {
    Debit,
    Credit,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ChartOfAccount {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub account_type: AccountType,
    pub normal_balance: NormalBalance,
    pub parent_id: Option<Uuid>,
    pub is_active: bool,
    pub description: Option<String>,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAccountRequest {
    pub code: String,
    pub name: String,
    pub account_type: AccountType,
    pub normal_balance: NormalBalance,
    pub parent_id: Option<Uuid>,
    pub description: Option<String>,
    pub currency: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAccountRequest {
    pub name: Option<String>,
    pub parent_id: Option<Uuid>,
    pub is_active: Option<bool>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AccountTreeNode {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub account_type: AccountType,
    pub normal_balance: NormalBalance,
    pub is_active: bool,
    pub currency: String,
    pub children: Vec<AccountTreeNode>,
}
#[derive(Debug, Serialize)]
pub struct GeneralLedgerEntry {
    pub date: chrono::NaiveDate,
    pub transaction_number: String,
    pub header_description: String,
    pub line_description: Option<String>,
    pub debit: f64,
    pub credit: f64,
    pub balance: f64,
}

#[derive(Debug, Serialize)]
pub struct TrialBalanceEntry {
    pub account_id: Uuid,
    pub account_code: String,
    pub account_name: String,
    pub account_type: AccountType,
    pub debit: f64,
    pub credit: f64,
}

#[derive(Debug, Serialize)]
pub struct FinancialReportEntry {
    pub account_code: String,
    pub account_name: String,
    pub balance: f64,
}

// --- Operational Finance Entities ---

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesInvoice {
    pub id: Uuid,
    pub invoice_number: String,
    pub client_id: Uuid,
    pub date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub subtotal: f64,
    pub tax: f64,
    pub total_amount: f64,
    pub amount_paid: f64,
    pub status: String,
    pub journal_entry_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesInvoiceItem {
    pub id: Uuid,
    pub invoice_id: Uuid,
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total_price: f64,
    pub account_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseBill {
    pub id: Uuid,
    pub bill_number: String,
    pub vendor_id: Uuid,
    pub date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub total_amount: f64,
    pub amount_paid: f64,
    pub status: String,
    pub budget_type: String,
    pub journal_entry_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Expense {
    pub id: Uuid,
    pub expense_number: String,
    pub date: chrono::NaiveDate,
    pub pay_from_account_id: Uuid,
    pub recipient: Option<String>,
    pub total_amount: f64,
    pub status: String,
    pub expense_type: String, // OPEX or CAPEX
    pub journal_entry_id: Option<Uuid>,
    pub attachment_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CashBankTransaction {
    pub id: Uuid,
    pub transaction_number: String,
    pub transaction_type: String, // transfer, receive, send
    pub date: chrono::NaiveDate,
    pub amount: f64,
    pub from_account_id: Option<Uuid>,
    pub to_account_id: Option<Uuid>,
    pub account_id: Option<Uuid>,
    pub contact_name: Option<String>,
    pub description: Option<String>,
    pub journal_entry_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesQuote {
    pub id: Uuid,
    pub quote_number: String,
    pub client_id: Uuid,
    pub date: chrono::NaiveDate,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub subtotal: f64,
    pub tax: f64,
    pub total_amount: f64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesOrder {
    pub id: Uuid,
    pub order_number: String,
    pub quote_id: Option<Uuid>,
    pub client_id: Uuid,
    pub date: chrono::NaiveDate,
    pub delivery_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub subtotal: f64,
    pub tax: f64,
    pub total_amount: f64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SalesShipment {
    pub id: Uuid,
    pub shipment_number: String,
    pub sales_order_id: Option<Uuid>,
    pub client_id: Option<Uuid>,
    pub date: chrono::NaiveDate,
    pub courier_name: Option<String>,
    pub tracking_number: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

// --- Purchase Module ---

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseQuote {
    pub id: Uuid,
    pub quote_number: String,
    pub vendor_id: Uuid,
    pub date: chrono::NaiveDate,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub subtotal: f64,
    pub tax: f64,
    pub total_amount: f64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePurchaseQuoteRequest {
    pub quote_number: String,
    pub vendor_id: Uuid,
    pub date: chrono::NaiveDate,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub items: Vec<CreateInvoiceItemRequest>, // Reusing for simplicity
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseOrder {
    pub id: Uuid,
    pub order_number: String,
    pub purchase_quote_id: Option<Uuid>,
    pub vendor_id: Uuid,
    pub date: chrono::NaiveDate,
    pub delivery_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub subtotal: f64,
    pub tax: f64,
    pub total_amount: f64,
    pub status: String,
    pub budget_type: String, // OPEX or CAPEX
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePurchaseOrderRequest {
    pub order_number: String,
    pub purchase_quote_id: Option<Uuid>,
    pub vendor_id: Uuid,
    pub date: chrono::NaiveDate,
    pub delivery_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub budget_type: Option<String>,
    pub items: Vec<CreateInvoiceItemRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PurchaseShipment {
    pub id: Uuid,
    pub shipment_number: String,
    pub purchase_order_id: Option<Uuid>,
    pub vendor_id: Option<Uuid>,
    pub date: chrono::NaiveDate,
    pub courier_name: Option<String>,
    pub tracking_number: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePurchaseShipmentRequest {
    pub shipment_number: String,
    pub purchase_order_id: Option<Uuid>,
    pub date: chrono::NaiveDate,
    pub courier_name: Option<String>,
    pub tracking_number: Option<String>,
    pub items: Vec<CreateShipmentItemRequest>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSalesInvoiceRequest {
    pub invoice_number: String,
    pub client_id: Uuid,
    pub date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub items: Vec<CreateInvoiceItemRequest>,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvoiceItemRequest {
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub account_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePurchaseBillRequest {
    pub bill_number: String,
    pub vendor_id: Uuid,
    pub date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub budget_type: Option<String>,
    pub account_payable_id: Option<Uuid>,
    pub items: Vec<CreateBillItemRequest>,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBillItemRequest {
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub account_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreateExpenseRequest {
    pub expense_number: String,
    pub date: chrono::NaiveDate,
    pub pay_from_account_id: Uuid,
    pub recipient: Option<String>,
    pub status: Option<String>,
    pub expense_type: Option<String>,
    pub items: Vec<CreateExpenseItemRequest>,
    pub attachment_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateExpenseItemRequest {
    pub account_id: Uuid,
    pub description: Option<String>,
    pub amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateCashBankTransactionRequest {
    pub transaction_number: Option<String>,
    pub transaction_type: String,
    pub date: chrono::NaiveDate,
    pub amount: f64,
    pub from_account_id: Option<Uuid>,
    pub to_account_id: Option<Uuid>,
    pub account_id: Option<Uuid>,
    pub contact_name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSalesQuoteRequest {
    pub quote_number: String,
    pub client_id: Uuid,
    pub date: chrono::NaiveDate,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub items: Vec<CreateInvoiceItemRequest>, // Reusing Item Request
}

#[derive(Debug, Deserialize)]
pub struct CreateSalesOrderRequest {
    pub order_number: String,
    pub quote_id: Option<Uuid>,
    pub client_id: Uuid,
    pub date: chrono::NaiveDate,
    pub delivery_date: Option<chrono::NaiveDate>,
    pub subject: Option<String>,
    pub items: Vec<CreateInvoiceItemRequest>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSalesShipmentRequest {
    pub shipment_number: String,
    pub sales_order_id: Option<Uuid>,
    pub date: chrono::NaiveDate,
    pub courier_name: Option<String>,
    pub tracking_number: Option<String>,
    pub recipient_name: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub items: Vec<CreateShipmentItemRequest>,
}

#[derive(Debug, Deserialize)]
pub struct CreateShipmentItemRequest {
    pub order_item_id: Option<Uuid>,
    pub description: String,
    pub quantity_shipped: f64,
}


// ─── 1. PAYMENT ENTRY ────────────────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PaymentEntry {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub entry_no: String,
    pub payment_type: String, // 'Pay' (to Supplier/Vendor) or 'Receive' (from Customer/Client)
    pub party_type: Option<String>, // 'Customer' | 'Supplier'
    pub party_id: Option<Uuid>,
    pub party_name: Option<String>,
    pub posting_date: chrono::NaiveDate,
    pub mode_of_payment: String, // 'Bank Transfer', 'Cash', 'Cheque'
    pub paid_from_account_id: Option<Uuid>,
    pub paid_to_account_id: Option<Uuid>,
    pub paid_amount: rust_decimal::Decimal,
    pub received_amount: rust_decimal::Decimal,
    pub reference_no: Option<String>,
    pub reference_date: Option<chrono::NaiveDate>,
    pub status: String, // 'Draft', 'Submitted', 'Cancelled'
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PaymentEntryReference {
    pub id: Uuid,
    pub payment_entry_id: Uuid,
    pub reference_doctype: String, // 'Sales Invoice' | 'Purchase Bill'
    pub reference_id: Option<Uuid>,
    pub reference_name: Option<String>,
    pub total_amount: rust_decimal::Decimal,
    pub allocated_amount: rust_decimal::Decimal,
    pub outstanding_amount: rust_decimal::Decimal,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePaymentEntryRequest {
    pub payment_type: String,
    pub party_type: Option<String>,
    pub party_id: Option<Uuid>,
    pub party_name: Option<String>,
    pub posting_date: chrono::NaiveDate,
    pub mode_of_payment: Option<String>,
    pub paid_from_account_id: Option<Uuid>,
    pub paid_to_account_id: Option<Uuid>,
    pub amount: f64,
    pub reference_no: Option<String>,
    pub reference_date: Option<chrono::NaiveDate>,
    pub references: Option<Vec<CreatePaymentEntryReferenceRequest>>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePaymentEntryReferenceRequest {
    pub reference_doctype: String,
    pub reference_id: Uuid,
    pub reference_name: Option<String>,
    pub total_amount: f64,
    pub allocated_amount: f64,
    pub outstanding_amount: f64,
}

// ─── 2. COST CENTER & BUDGET ────────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CostCenter {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub cost_center_name: String,
    pub cost_center_number: Option<String>,
    pub parent_cost_center_id: Option<Uuid>,
    pub is_group: Option<bool>,
    pub disabled: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCostCenterRequest {
    pub cost_center_name: String,
    pub cost_center_number: Option<String>,
    pub parent_cost_center_id: Option<Uuid>,
    pub is_group: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Budget {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub cost_center_id: Option<Uuid>,
    pub fiscal_year: String,
    pub monthly_distribution: Option<String>,
    pub action_if_accumulated_monthly_budget_exceeded: Option<String>,
    pub action_if_annual_budget_exceeded: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BudgetAccount {
    pub id: Uuid,
    pub budget_id: Uuid,
    pub account_id: Option<Uuid>,
    pub budget_amount: rust_decimal::Decimal,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBudgetRequest {
    pub cost_center_id: Option<Uuid>,
    pub fiscal_year: String,
    pub action_if_annual_budget_exceeded: Option<String>,
    pub accounts: Vec<CreateBudgetAccountItem>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBudgetAccountItem {
    pub account_id: Uuid,
    pub budget_amount: f64,
}

#[derive(Debug, Serialize)]
pub struct BudgetVarianceReport {
    pub budget_id: Uuid,
    pub cost_center_name: String,
    pub fiscal_year: String,
    pub account_id: Option<Uuid>,
    pub account_code: String,
    pub account_name: String,
    pub budget_amount: f64,
    pub actual_spent: f64,
    pub variance: f64,
    pub utilization_percentage: f64,
    pub status: String,
}

// ─── 3. AGING REPORTS (AR & AP) ─────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct AgingReportItem {
    pub party_id: Uuid,
    pub party_name: String,
    pub total_outstanding: f64,
    pub current_not_due: f64,
    pub days_1_30: f64,
    pub days_31_60: f64,
    pub days_61_90: f64,
    pub days_over_90: f64,
    pub invoice_count: i64,
}

// ─── 4. BANK ACCOUNT ────────────────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BankAccount {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub account_name: String,
    pub bank_name: String,
    pub bank_account_no: String,
    pub iban: Option<String>,
    pub swift_code: Option<String>,
    pub gl_account_id: Option<Uuid>,
    pub is_default: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBankAccountRequest {
    pub account_name: String,
    pub bank_name: String,
    pub bank_account_no: String,
    pub swift_code: Option<String>,
    pub gl_account_id: Option<Uuid>,
    pub is_default: Option<bool>,
}

// ─── 5. CREDIT & DEBIT NOTES ────────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CreditNote {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub credit_note_no: String,
    pub customer_id: Option<Uuid>,
    pub posting_date: chrono::NaiveDate,
    pub reason: Option<String>,
    pub total_amount: rust_decimal::Decimal,
    pub status: String,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCreditNoteRequest {
    pub credit_note_no: Option<String>,
    pub customer_id: Option<Uuid>,
    pub posting_date: chrono::NaiveDate,
    pub reason: Option<String>,
    pub total_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct DebitNote {
    pub id: Uuid,
    pub company_id: Option<Uuid>,
    pub debit_note_no: String,
    pub supplier_id: Option<Uuid>,
    pub posting_date: chrono::NaiveDate,
    pub reason: Option<String>,
    pub total_amount: rust_decimal::Decimal,
    pub status: String,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDebitNoteRequest {
    pub debit_note_no: Option<String>,
    pub supplier_id: Option<Uuid>,
    pub posting_date: chrono::NaiveDate,
    pub reason: Option<String>,
    pub total_amount: f64,
}

// ─── 6. TAX TEMPLATES ───────────────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaxCategory {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaxRule {
    pub id: Uuid,
    pub tax_type: String, // 'Sales' | 'Purchase'
    pub tax_template_id: Option<Uuid>,
    pub tax_category_id: Option<Uuid>,
    pub priority: Option<i32>,
    pub disabled: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaxRuleRequest {
    pub tax_type: String,
    pub title: String,
    pub rate: f64,
    pub description: Option<String>,
}

// ─── 7. CASH FLOW STATEMENT ─────────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct CashFlowSection {
    pub category: String,
    pub total: f64,
    pub items: Vec<CashFlowItem>,
}

#[derive(Debug, Serialize)]
pub struct CashFlowItem {
    pub title: String,
    pub amount: f64,
}

#[derive(Debug, Serialize)]
pub struct CashFlowStatement {
    pub period: String,
    pub operating_activities: CashFlowSection,
    pub investing_activities: CashFlowSection,
    pub financing_activities: CashFlowSection,
    pub net_cash_change: f64,
    pub beginning_cash_balance: f64,
    pub ending_cash_balance: f64,
}
