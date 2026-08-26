use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::{
    AccountType, ChartOfAccount, GeneralLedgerEntry, NormalBalance, TrialBalanceEntry,
};
use crate::domain::errors::{DomainError, DomainResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExpenseAnalysis {
    pub month: chrono::NaiveDate,
    pub expense_type: String,
    pub total_amount: f64,
}

#[derive(Clone)]
pub struct FinanceRepository {
    pool: PgPool,
}

impl FinanceRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_account(&self, account: &ChartOfAccount) -> DomainResult<ChartOfAccount> {
        let rec = sqlx::query_as!(
            ChartOfAccount,
            r#"
            INSERT INTO chart_of_accounts (
                id, code, name, account_type, normal_balance, parent_id, 
                is_active, description, currency, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, code, name, account_type as "account_type: AccountType", 
                      normal_balance as "normal_balance: NormalBalance", parent_id, 
                      is_active, description, currency, created_at, updated_at
            "#,
            account.id,
            account.code,
            account.name,
            account.account_type as AccountType,
            account.normal_balance as NormalBalance,
            account.parent_id,
            account.is_active,
            account.description,
            account.currency,
            account.created_at,
            account.updated_at
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn list_all(&self) -> DomainResult<Vec<ChartOfAccount>> {
        let recs = sqlx::query_as!(
            ChartOfAccount,
            r#"
            SELECT 
                id, code, name, account_type as "account_type: AccountType", 
                normal_balance as "normal_balance: NormalBalance", parent_id, 
                is_active, description, currency, created_at, updated_at
            FROM chart_of_accounts
            ORDER BY code ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(recs)
    }

    pub async fn find_by_id(&self, id: Uuid) -> DomainResult<Option<ChartOfAccount>> {
        let rec = sqlx::query_as!(
            ChartOfAccount,
            r#"
            SELECT 
                id, code, name, account_type as "account_type: AccountType", 
                normal_balance as "normal_balance: NormalBalance", parent_id, 
                is_active, description, currency, created_at, updated_at
            FROM chart_of_accounts
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn find_by_code(&self, code: &str) -> DomainResult<Option<ChartOfAccount>> {
        let rec = sqlx::query_as!(
            ChartOfAccount,
            r#"
            SELECT 
                id, code, name, account_type as "account_type: AccountType", 
                normal_balance as "normal_balance: NormalBalance", parent_id, 
                is_active, description, currency, created_at, updated_at
            FROM chart_of_accounts
            WHERE code = $1
            "#,
            code
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn update_account(
        &self,
        id: Uuid,
        name: Option<String>,
        parent_id: Option<Uuid>,
        is_active: Option<bool>,
        description: Option<String>,
    ) -> DomainResult<Option<ChartOfAccount>> {
        // Dynamic update using COALESCE isn't ideal for sqlx type checking sometimes,
        // but for specific fields it's okay.
        // Or we can fetch, update struct, and save.
        // Let's us specific update query.

        let rec = sqlx::query_as!(
            ChartOfAccount,
            r#"
            UPDATE chart_of_accounts
            SET 
                name = COALESCE($2, name),
                parent_id = COALESCE($3, parent_id),
                is_active = COALESCE($4, is_active),
                description = COALESCE($5, description),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, code, name, account_type as "account_type: AccountType", 
                      normal_balance as "normal_balance: NormalBalance", parent_id, 
                      is_active, description, currency, created_at, updated_at
            "#,
            id,
            name,
            parent_id,
            is_active,
            description
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn get_general_ledger(
        &self,
        account_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<GeneralLedgerEntry>> {
        let recs = sqlx::query!(
            r#"
            SELECT 
                e.date as "date!",
                e.transaction_number as "transaction_number!",
                e.description as header_description,
                l.description as line_description,
                l.debit::FLOAT8 as "debit!",
                l.credit::FLOAT8 as "credit!"
            FROM journal_lines l
            JOIN journal_entries e ON l.journal_entry_id = e.id
            WHERE l.account_id = $1
            AND ($2::DATE IS NULL OR e.date >= $2)
            AND ($3::DATE IS NULL OR e.date <= $3)
            ORDER BY e.date ASC, e.created_at ASC
            "#,
            account_id,
            start_date as Option<chrono::NaiveDate>,
            end_date as Option<chrono::NaiveDate>
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let mut balance = 0.0;
        let entries = recs
            .into_iter()
            .map(|r| {
                let debit = r.debit;
                let credit = r.credit;
                balance += debit - credit;
                GeneralLedgerEntry {
                    date: r.date,
                    transaction_number: r.transaction_number,
                    header_description: r.header_description,
                    line_description: r.line_description,
                    debit,
                    credit,
                    balance,
                }
            })
            .collect();

        Ok(entries)
    }

    pub async fn get_trial_balance(&self) -> DomainResult<Vec<TrialBalanceEntry>> {
        let recs = sqlx::query!(
            r#"
            SELECT 
                a.id as account_id,
                a.code as account_code,
                a.name as account_name,
                a.account_type as "account_type: AccountType",
                COALESCE(SUM(l.debit), 0)::FLOAT8 as "total_debit!",
                COALESCE(SUM(l.credit), 0)::FLOAT8 as "total_credit!"
            FROM chart_of_accounts a
            LEFT JOIN journal_lines l ON a.id = l.account_id
            GROUP BY a.id, a.code, a.name, a.account_type
            ORDER BY a.code ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let entries = recs
            .into_iter()
            .map(|r| TrialBalanceEntry {
                account_id: r.account_id,
                account_code: r.account_code,
                account_name: r.account_name,
                account_type: r.account_type,
                debit: r.total_debit,
                credit: r.total_credit,
            })
            .collect();

        Ok(entries)
    }

    // --- Operational Finance CRUD ---

    pub async fn list_sales_invoices(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::SalesInvoice>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::SalesInvoice,
            r#"
            SELECT id, invoice_number, client_id, date, due_date, subject, 
                   subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                   total_amount::FLOAT8 as "total_amount!", amount_paid::FLOAT8 as "amount_paid!", 
                   status, journal_entry_id, created_at, attachment_url
            FROM sales_invoices
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn list_purchase_bills(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::PurchaseBill>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::PurchaseBill,
            r#"
            SELECT id, bill_number, vendor_id, date, due_date, 
                   total_amount::FLOAT8 as "total_amount!", amount_paid::FLOAT8 as "amount_paid!", 
                   status, budget_type as "budget_type!", journal_entry_id, created_at, attachment_url
            FROM purchase_bills
            ORDER BY date DESC, created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn list_expenses(&self) -> DomainResult<Vec<crate::domain::entities::Expense>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::Expense,
            r#"
            SELECT id, expense_number, date, pay_from_account_id, recipient, 
                   total_amount::FLOAT8 as "total_amount!", status, expense_type, 
                   journal_entry_id, created_at, attachment_url
            FROM expenses
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn list_cash_bank_transactions(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::CashBankTransaction>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::CashBankTransaction,
            r#"
            SELECT id, transaction_number, transaction_type, date, 
                   amount::FLOAT8 as "amount!", from_account_id, to_account_id, 
                   account_id, contact_name, description, journal_entry_id, created_at
            FROM cash_bank_transactions
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn delete_sales_invoice(&self, id: Uuid) -> DomainResult<()> {
        sqlx::query!("DELETE FROM sales_invoices WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn delete_purchase_bill(&self, id: Uuid) -> DomainResult<()> {
        sqlx::query!("DELETE FROM purchase_bills WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn delete_expense(&self, id: Uuid) -> DomainResult<()> {
        sqlx::query!("DELETE FROM expenses WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn delete_cash_bank_transaction(&self, id: Uuid) -> DomainResult<()> {
        sqlx::query!("DELETE FROM cash_bank_transactions WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn create_cash_bank_transaction(
        &self,
        tx: &crate::domain::entities::CashBankTransaction,
    ) -> DomainResult<crate::domain::entities::CashBankTransaction> {
        let rec = sqlx::query_as!(
            crate::domain::entities::CashBankTransaction,
            r#"
            INSERT INTO cash_bank_transactions (
                id, transaction_number, transaction_type, date, amount, 
                from_account_id, to_account_id, account_id, contact_name, description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, transaction_number, transaction_type, date, 
                      amount::FLOAT8 as "amount!", from_account_id, to_account_id, 
                      account_id, contact_name, description, journal_entry_id, created_at
            "#,
            tx.id,
            tx.transaction_number,
            tx.transaction_type,
            tx.date,
            tx.amount as f64,
            tx.from_account_id,
            tx.to_account_id,
            tx.account_id,
            tx.contact_name,
            tx.description
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn create_expense(
        &self,
        expense: &crate::domain::entities::Expense,
    ) -> DomainResult<crate::domain::entities::Expense> {
        let rec = sqlx::query_as!(
            crate::domain::entities::Expense,
            r#"
            INSERT INTO expenses (
                id, expense_number, date, pay_from_account_id, recipient, total_amount, 
                status, expense_type, attachment_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, expense_number, date, pay_from_account_id, recipient, 
                      total_amount::FLOAT8 as "total_amount!", status, expense_type, 
                      journal_entry_id, created_at, attachment_url
            "#,
            expense.id,
            expense.expense_number,
            expense.date,
            expense.pay_from_account_id,
            expense.recipient,
            expense.total_amount as f64,
            expense.status,
            expense.expense_type,
            expense.attachment_url
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn create_sales_invoice(
        &self,
        invoice: &crate::domain::entities::SalesInvoice,
    ) -> DomainResult<crate::domain::entities::SalesInvoice> {
        let rec = sqlx::query_as!(
            crate::domain::entities::SalesInvoice,
            r#"
            INSERT INTO sales_invoices (
                id, invoice_number, client_id, date, due_date, subject, 
                subtotal, tax, total_amount, amount_paid, status, attachment_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, invoice_number, client_id, date, due_date, subject, 
                      subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                      total_amount::FLOAT8 as "total_amount!", amount_paid::FLOAT8 as "amount_paid!", 
                      status, journal_entry_id, created_at, attachment_url
            "#,
            invoice.id,
            invoice.invoice_number,
            invoice.client_id,
            invoice.date,
            invoice.due_date,
            invoice.subject,
            invoice.subtotal as f64,
            invoice.tax as f64,
            invoice.total_amount as f64,
            invoice.amount_paid as f64,
            invoice.status,
            invoice.attachment_url
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn create_purchase_bill(
        &self,
        bill: &crate::domain::entities::PurchaseBill,
    ) -> DomainResult<crate::domain::entities::PurchaseBill> {
        let rec = sqlx::query_as!(
            crate::domain::entities::PurchaseBill,
            r#"
            INSERT INTO purchase_bills (
                id, bill_number, vendor_id, date, due_date, total_amount, amount_paid, status, budget_type, attachment_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, bill_number, vendor_id, date, due_date, 
                      total_amount::FLOAT8 as "total_amount!", amount_paid::FLOAT8 as "amount_paid!", 
                      status, budget_type as "budget_type!", journal_entry_id, created_at, attachment_url
            "#,
            bill.id,
            bill.bill_number,
            bill.vendor_id,
            bill.date,
            bill.due_date,
            bill.total_amount as f64,
            bill.amount_paid as f64,
            bill.status,
            bill.budget_type,
            bill.attachment_url
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    // --- New Sales Modules ---

    pub async fn list_sales_quotes(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::SalesQuote>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::SalesQuote,
            r#"
            SELECT id, quote_number, client_id, date, expiry_date, subject, 
                   subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                   total_amount::FLOAT8 as "total_amount!", status, created_at
            FROM sales_quotes
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_sales_quote(
        &self,
        quote: &crate::domain::entities::SalesQuote,
    ) -> DomainResult<crate::domain::entities::SalesQuote> {
        let rec = sqlx::query_as!(
            crate::domain::entities::SalesQuote,
            r#"
            INSERT INTO sales_quotes (
                id, quote_number, client_id, date, expiry_date, subject, 
                subtotal, tax, total_amount, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, quote_number, client_id, date, expiry_date, subject, 
                      subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                      total_amount::FLOAT8 as "total_amount!", status, created_at
            "#,
            quote.id,
            quote.quote_number,
            quote.client_id,
            quote.date,
            quote.expiry_date,
            quote.subject,
            quote.subtotal as f64,
            quote.tax as f64,
            quote.total_amount as f64,
            quote.status
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn list_sales_orders(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::SalesOrder>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::SalesOrder,
            r#"
            SELECT id, order_number, quote_id, client_id, date, delivery_date, subject, 
                   subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                   total_amount::FLOAT8 as "total_amount!", status, created_at
            FROM sales_orders
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_sales_order(
        &self,
        order: &crate::domain::entities::SalesOrder,
    ) -> DomainResult<crate::domain::entities::SalesOrder> {
        let rec = sqlx::query_as!(
            crate::domain::entities::SalesOrder,
            r#"
            INSERT INTO sales_orders (
                id, order_number, quote_id, client_id, date, delivery_date, subject, 
                subtotal, tax, total_amount, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, order_number, quote_id, client_id, date, delivery_date, subject, 
                      subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                      total_amount::FLOAT8 as "total_amount!", status, created_at
            "#,
            order.id,
            order.order_number,
            order.quote_id,
            order.client_id,
            order.date,
            order.delivery_date,
            order.subject,
            order.subtotal as f64,
            order.tax as f64,
            order.total_amount as f64,
            order.status
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn list_sales_shipments(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::SalesShipment>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::SalesShipment,
            r#"
            SELECT id, shipment_number, sales_order_id, client_id, date, courier_name, 
                   tracking_number, status, created_at
            FROM sales_shipments
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_sales_shipment(
        &self,
        tx: &crate::domain::entities::SalesShipment,
    ) -> DomainResult<crate::domain::entities::SalesShipment> {
        let rec = sqlx::query_as!(
            crate::domain::entities::SalesShipment,
            r#"
            INSERT INTO sales_shipments (id, shipment_number, sales_order_id, client_id, date, courier_name, tracking_number, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, shipment_number, sales_order_id, client_id, date, courier_name, tracking_number, status, created_at
            "#,
            tx.id,
            tx.shipment_number,
            tx.sales_order_id,
            tx.client_id,
            tx.date,
            tx.courier_name,
            tx.tracking_number,
            tx.status,
            tx.created_at
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    // --- Purchase Module Methods ---

    pub async fn list_purchase_quotes(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::PurchaseQuote>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::PurchaseQuote,
            r#"
            SELECT id, quote_number, vendor_id, date, expiry_date, subject, 
                   subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                   total_amount::FLOAT8 as "total_amount!", status, created_at as "created_at!"
            FROM purchase_quotes
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_purchase_quote(
        &self,
        quote: &crate::domain::entities::PurchaseQuote,
    ) -> DomainResult<crate::domain::entities::PurchaseQuote> {
        let rec = sqlx::query_as!(
            crate::domain::entities::PurchaseQuote,
            r#"
            INSERT INTO purchase_quotes (
                id, quote_number, vendor_id, date, expiry_date, subject, 
                subtotal, tax, total_amount, status, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, quote_number, vendor_id, date, expiry_date, subject, 
                      subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                      total_amount::FLOAT8 as "total_amount!", status, created_at as "created_at!"
            "#,
            quote.id,
            quote.quote_number,
            quote.vendor_id,
            quote.date,
            quote.expiry_date,
            quote.subject,
            quote.subtotal as f64,
            quote.tax as f64,
            quote.total_amount as f64,
            quote.status,
            quote.created_at
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn list_purchase_orders(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::PurchaseOrder>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::PurchaseOrder,
            r#"
            SELECT id, order_number, purchase_quote_id, vendor_id, date, delivery_date, subject, 
                   subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                   total_amount::FLOAT8 as "total_amount!", status, budget_type, created_at as "created_at!"
            FROM purchase_orders
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_purchase_order(
        &self,
        order: &crate::domain::entities::PurchaseOrder,
    ) -> DomainResult<crate::domain::entities::PurchaseOrder> {
        let rec = sqlx::query_as!(
            crate::domain::entities::PurchaseOrder,
            r#"
            INSERT INTO purchase_orders (
                id, order_number, purchase_quote_id, vendor_id, date, delivery_date, subject, 
                subtotal, tax, total_amount, status, budget_type, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, order_number, purchase_quote_id, vendor_id, date, delivery_date, subject, 
                      subtotal::FLOAT8 as "subtotal!", tax::FLOAT8 as "tax!", 
                      total_amount::FLOAT8 as "total_amount!", status, budget_type, created_at as "created_at!"
            "#,
            order.id,
            order.order_number,
            order.purchase_quote_id,
            order.vendor_id,
            order.date,
            order.delivery_date,
            order.subject,
            order.subtotal as f64,
            order.tax as f64,
            order.total_amount as f64,
            order.status,
            order.budget_type,
            order.created_at
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn list_purchase_shipments(
        &self,
    ) -> DomainResult<Vec<crate::domain::entities::PurchaseShipment>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::PurchaseShipment,
            r#"
            SELECT id, shipment_number, purchase_order_id, vendor_id, date, courier_name, 
                   tracking_number, status, created_at as "created_at!"
            FROM purchase_shipments
            ORDER BY date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_purchase_shipment(
        &self,
        tx: &crate::domain::entities::PurchaseShipment,
    ) -> DomainResult<crate::domain::entities::PurchaseShipment> {
        let rec = sqlx::query_as!(
            crate::domain::entities::PurchaseShipment,
            r#"
            INSERT INTO purchase_shipments (id, shipment_number, purchase_order_id, vendor_id, date, courier_name, tracking_number, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, shipment_number, purchase_order_id, vendor_id, date, courier_name, tracking_number, status, created_at as "created_at!"
            "#,
            tx.id,
            tx.shipment_number,
            tx.purchase_order_id,
            tx.vendor_id,
            tx.date,
            tx.courier_name,
            tx.tracking_number,
            tx.status,
            tx.created_at
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn get_expense_analysis(
        &self,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<ExpenseAnalysis>> {
        let recs = sqlx::query_as!(
            ExpenseAnalysis,
            r#"
            SELECT 
                DATE_TRUNC('month', date)::DATE as "month!",
                type as "expense_type!",
                SUM(total_amount)::FLOAT8 as "total_amount!"
            FROM (
                SELECT date, expense_type as type, total_amount FROM expenses
                UNION ALL
                SELECT date, budget_type as type, total_amount FROM purchase_bills
            ) combined
            WHERE ($1::DATE IS NULL OR date >= $1)
            AND ($2::DATE IS NULL OR date <= $2)
            GROUP BY 1, 2
            ORDER BY 1 ASC
            "#,
            start_date,
            end_date
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    // ─── EXTENDED ACCOUNTING REPOSITORY METHODS ──────────────────────────────
    
    // 1. Payment Entries
    pub async fn list_payment_entries(&self) -> DomainResult<Vec<crate::domain::entities::PaymentEntry>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::PaymentEntry,
            r#"
            SELECT id, company_id, entry_no, payment_type, party_type, party_id, party_name,
                   posting_date, mode_of_payment, paid_from_account_id, paid_to_account_id,
                   paid_amount, received_amount, reference_no, reference_date, status,
                   created_at, updated_at
            FROM payment_entries
            ORDER BY posting_date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn get_payment_entry_by_id(&self, id: Uuid) -> DomainResult<Option<crate::domain::entities::PaymentEntry>> {
        let rec = sqlx::query_as!(
            crate::domain::entities::PaymentEntry,
            r#"
            SELECT id, company_id, entry_no, payment_type, party_type, party_id, party_name,
                   posting_date, mode_of_payment, paid_from_account_id, paid_to_account_id,
                   paid_amount, received_amount, reference_no, reference_date, status,
                   created_at, updated_at
            FROM payment_entries
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn create_payment_entry(
        &self,
        req: &crate::domain::entities::CreatePaymentEntryRequest,
    ) -> DomainResult<crate::domain::entities::PaymentEntry> {
        let entry_id = Uuid::new_v4();
        let count_row = sqlx::query!("SELECT COUNT(*) as count FROM payment_entries")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        let count = count_row.count.unwrap_or(0);
        let entry_no = format!("ACC-PAY-{}-{:04}", chrono::Utc::now().format("%Y"), count + 1);
        let decimal_amount = rust_decimal::Decimal::from_f64_retain(req.amount).unwrap_or_default();

        let entry = sqlx::query_as!(
            crate::domain::entities::PaymentEntry,
            r#"
            INSERT INTO payment_entries (
                id, entry_no, payment_type, party_type, party_id, party_name,
                posting_date, mode_of_payment, paid_from_account_id, paid_to_account_id,
                paid_amount, received_amount, reference_no, reference_date, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Submitted')
            RETURNING id, company_id, entry_no, payment_type, party_type, party_id, party_name,
                      posting_date, mode_of_payment, paid_from_account_id, paid_to_account_id,
                      paid_amount, received_amount, reference_no, reference_date, status,
                      created_at, updated_at
            "#,
            entry_id,
            entry_no,
            req.payment_type,
            req.party_type,
            req.party_id,
            req.party_name,
            req.posting_date,
            req.mode_of_payment.clone().unwrap_or_else(|| "Bank Transfer".to_string()),
            req.paid_from_account_id,
            req.paid_to_account_id,
            decimal_amount,
            decimal_amount,
            req.reference_no,
            req.reference_date
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        if let Some(refs) = &req.references {
            for r in refs {
                let ref_id = Uuid::new_v4();
                let total_dec = rust_decimal::Decimal::from_f64_retain(r.total_amount).unwrap_or_default();
                let alloc_dec = rust_decimal::Decimal::from_f64_retain(r.allocated_amount).unwrap_or_default();
                let out_dec = rust_decimal::Decimal::from_f64_retain(r.outstanding_amount).unwrap_or_default();

                let _ = sqlx::query!(
                    r#"
                    INSERT INTO payment_entry_references (
                        id, payment_entry_id, reference_doctype, reference_id,
                        reference_name, total_amount, allocated_amount, outstanding_amount
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    "#,
                    ref_id,
                    entry_id,
                    r.reference_doctype,
                    r.reference_id,
                    r.reference_name,
                    total_dec,
                    alloc_dec,
                    out_dec
                )
                .execute(&self.pool)
                .await;

                if r.reference_doctype == "Sales Invoice" {
                    let _ = sqlx::query!(
                        r#"
                        UPDATE sales_invoices
                        SET amount_paid = amount_paid + $1,
                            status = CASE WHEN (amount_paid + $1) >= total_amount THEN 'paid' ELSE 'partial' END,
                            updated_at = NOW()
                        WHERE id = $2
                        "#,
                        alloc_dec,
                        r.reference_id
                    )
                    .execute(&self.pool)
                    .await;
                } else if r.reference_doctype == "Purchase Bill" {
                    let _ = sqlx::query!(
                        r#"
                        UPDATE purchase_bills
                        SET amount_paid = amount_paid + $1,
                            status = CASE WHEN (amount_paid + $1) >= total_amount THEN 'paid' ELSE 'partial' END,
                            updated_at = NOW()
                        WHERE id = $2
                        "#,
                        alloc_dec,
                        r.reference_id
                    )
                    .execute(&self.pool)
                    .await;
                }
            }
        }

        Ok(entry)
    }

    // 2. Cost Centers
    pub async fn list_cost_centers(&self) -> DomainResult<Vec<crate::domain::entities::CostCenter>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::CostCenter,
            r#"
            SELECT id, company_id, cost_center_name, cost_center_number, parent_cost_center_id, is_group, disabled, created_at
            FROM cost_centers
            ORDER BY cost_center_number ASC, cost_center_name ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_cost_center(
        &self,
        req: &crate::domain::entities::CreateCostCenterRequest,
    ) -> DomainResult<crate::domain::entities::CostCenter> {
        let id = Uuid::new_v4();
        let rec = sqlx::query_as!(
            crate::domain::entities::CostCenter,
            r#"
            INSERT INTO cost_centers (id, cost_center_name, cost_center_number, parent_cost_center_id, is_group)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, company_id, cost_center_name, cost_center_number, parent_cost_center_id, is_group, disabled, created_at
            "#,
            id,
            req.cost_center_name,
            req.cost_center_number,
            req.parent_cost_center_id,
            req.is_group.unwrap_or(false)
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    // 3. Budgets
    pub async fn list_budgets(&self) -> DomainResult<Vec<crate::domain::entities::Budget>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::Budget,
            r#"
            SELECT id, company_id, cost_center_id, fiscal_year, monthly_distribution,
                   action_if_accumulated_monthly_budget_exceeded, action_if_annual_budget_exceeded, created_at
            FROM budgets
            ORDER BY fiscal_year DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_budget(
        &self,
        req: &crate::domain::entities::CreateBudgetRequest,
    ) -> DomainResult<crate::domain::entities::Budget> {
        let budget_id = Uuid::new_v4();
        let budget = sqlx::query_as!(
            crate::domain::entities::Budget,
            r#"
            INSERT INTO budgets (id, cost_center_id, fiscal_year, action_if_annual_budget_exceeded)
            VALUES ($1, $2, $3, $4)
            RETURNING id, company_id, cost_center_id, fiscal_year, monthly_distribution,
                      action_if_accumulated_monthly_budget_exceeded, action_if_annual_budget_exceeded, created_at
            "#,
            budget_id,
            req.cost_center_id,
            req.fiscal_year,
            req.action_if_annual_budget_exceeded.clone().unwrap_or_else(|| "Warn".to_string())
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        for acc in &req.accounts {
            let item_id = Uuid::new_v4();
            let amount_dec = rust_decimal::Decimal::from_f64_retain(acc.budget_amount).unwrap_or_default();
            let _ = sqlx::query!(
                r#"
                INSERT INTO budget_accounts (id, budget_id, account_id, budget_amount)
                VALUES ($1, $2, $3, $4)
                "#,
                item_id,
                budget_id,
                acc.account_id,
                amount_dec
            )
            .execute(&self.pool)
            .await;
        }

        Ok(budget)
    }

    pub async fn get_budget_variance(&self) -> DomainResult<Vec<crate::domain::entities::BudgetVarianceReport>> {
        let rows = sqlx::query!(
            r#"
            SELECT 
                b.id as budget_id,
                COALESCE(cc.cost_center_name, 'General Operations') as cost_center_name,
                b.fiscal_year,
                ba.account_id,
                COALESCE(coa.code, 'N/A') as account_code,
                COALESCE(coa.name, 'Unassigned Account') as account_name,
                COALESCE(ba.budget_amount, 0) as budget_amount
            FROM budgets b
            LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id
            JOIN budget_accounts ba ON b.id = ba.budget_id
            LEFT JOIN chart_of_accounts coa ON ba.account_id = coa.id
            ORDER BY b.fiscal_year DESC, cc.cost_center_name ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        use rust_decimal::prelude::ToPrimitive;
        let mut reports = Vec::new();
        for r in rows {
            let b_amt = r.budget_amount.to_f64().unwrap_or(0.0);
            let actual = 0.0; // In full integration, aggregate from journal_entry_accounts where account_id matches
            let variance = b_amt - actual;
            let util = if b_amt > 0.0 { (actual / b_amt) * 100.0 } else { 0.0 };
            let status = if util > 100.0 { "Overbudget".to_string() } else if util > 80.0 { "Warning".to_string() } else { "Within Budget".to_string() };

            reports.push(crate::domain::entities::BudgetVarianceReport {
                budget_id: r.budget_id,
                cost_center_name: r.cost_center_name,
                fiscal_year: r.fiscal_year,
                account_id: r.account_id,
                account_code: r.account_code,
                account_name: r.account_name,
                budget_amount: b_amt,
                actual_spent: actual,
                variance,
                utilization_percentage: util,
                status,
            });
        }
        Ok(reports)
    }

    // 4. Aging Reports (AR & AP)
    pub async fn get_ar_aging(&self) -> DomainResult<Vec<crate::domain::entities::AgingReportItem>> {
        use rust_decimal::prelude::ToPrimitive;
        let rows = sqlx::query!(
            r#"
            SELECT 
                si.client_id,
                COALESCE(c.name, 'Unknown Client') as client_name,
                (si.total_amount - si.amount_paid) as outstanding,
                si.due_date,
                si.date as invoice_date
            FROM sales_invoices si
            LEFT JOIN clients c ON si.client_id = c.id
            WHERE (si.total_amount - si.amount_paid) > 0
              AND si.status != 'void'
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        use std::collections::HashMap;
        let now = chrono::Utc::now().naive_utc().date();
        let mut map: HashMap<Uuid, crate::domain::entities::AgingReportItem> = HashMap::new();

        for r in rows {
            let out = r.outstanding.to_f64().unwrap_or(0.0);
            let item = map.entry(r.client_id).or_insert(crate::domain::entities::AgingReportItem {
                party_id: r.client_id,
                party_name: r.client_name,
                total_outstanding: 0.0,
                current_not_due: 0.0,
                days_1_30: 0.0,
                days_31_60: 0.0,
                days_61_90: 0.0,
                days_over_90: 0.0,
                invoice_count: 0,
            });

            item.total_outstanding += out;
            item.invoice_count += 1;

            let due = r.due_date.unwrap_or(r.invoice_date);
            let diff_days = (now - due).num_days();

            if diff_days <= 0 {
                item.current_not_due += out;
            } else if diff_days <= 30 {
                item.days_1_30 += out;
            } else if diff_days <= 60 {
                item.days_31_60 += out;
            } else if diff_days <= 90 {
                item.days_61_90 += out;
            } else {
                item.days_over_90 += out;
            }
        }

        Ok(map.into_values().collect())
    }

    pub async fn get_ap_aging(&self) -> DomainResult<Vec<crate::domain::entities::AgingReportItem>> {
        use rust_decimal::prelude::ToPrimitive;
        let rows = sqlx::query!(
            r#"
            SELECT 
                pb.vendor_id,
                COALESCE(v.name, 'Unknown Vendor') as vendor_name,
                (pb.total_amount - pb.amount_paid) as outstanding,
                pb.due_date,
                pb.date as bill_date
            FROM purchase_bills pb
            LEFT JOIN vendors v ON pb.vendor_id = v.id
            WHERE (pb.total_amount - pb.amount_paid) > 0
              AND pb.status != 'void'
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        use std::collections::HashMap;
        let now = chrono::Utc::now().naive_utc().date();
        let mut map: HashMap<Uuid, crate::domain::entities::AgingReportItem> = HashMap::new();

        for r in rows {
            let out = r.outstanding.to_f64().unwrap_or(0.0);
            let item = map.entry(r.vendor_id).or_insert(crate::domain::entities::AgingReportItem {
                party_id: r.vendor_id,
                party_name: r.vendor_name,
                total_outstanding: 0.0,
                current_not_due: 0.0,
                days_1_30: 0.0,
                days_31_60: 0.0,
                days_61_90: 0.0,
                days_over_90: 0.0,
                invoice_count: 0,
            });

            item.total_outstanding += out;
            item.invoice_count += 1;

            let due = r.due_date.unwrap_or(r.bill_date);
            let diff_days = (now - due).num_days();

            if diff_days <= 0 {
                item.current_not_due += out;
            } else if diff_days <= 30 {
                item.days_1_30 += out;
            } else if diff_days <= 60 {
                item.days_31_60 += out;
            } else if diff_days <= 90 {
                item.days_61_90 += out;
            } else {
                item.days_over_90 += out;
            }
        }

        Ok(map.into_values().collect())
    }

    // 5. Bank Accounts
    pub async fn list_bank_accounts(&self) -> DomainResult<Vec<crate::domain::entities::BankAccount>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::BankAccount,
            r#"
            SELECT id, company_id, account_name, bank_name, bank_account_no, iban, swift_code, gl_account_id, is_default, created_at
            FROM bank_accounts
            ORDER BY is_default DESC, account_name ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_bank_account(
        &self,
        req: &crate::domain::entities::CreateBankAccountRequest,
    ) -> DomainResult<crate::domain::entities::BankAccount> {
        let id = Uuid::new_v4();
        let rec = sqlx::query_as!(
            crate::domain::entities::BankAccount,
            r#"
            INSERT INTO bank_accounts (id, account_name, bank_name, bank_account_no, swift_code, gl_account_id, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, company_id, account_name, bank_name, bank_account_no, iban, swift_code, gl_account_id, is_default, created_at
            "#,
            id,
            req.account_name,
            req.bank_name,
            req.bank_account_no,
            req.swift_code,
            req.gl_account_id,
            req.is_default.unwrap_or(false)
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    // 6. Credit Notes & Debit Notes
    pub async fn list_credit_notes(&self) -> DomainResult<Vec<crate::domain::entities::CreditNote>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::CreditNote,
            r#"
            SELECT id, company_id, credit_note_no, customer_id, posting_date, reason, total_amount, status, created_at
            FROM credit_notes
            ORDER BY posting_date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_credit_note(
        &self,
        req: &crate::domain::entities::CreateCreditNoteRequest,
    ) -> DomainResult<crate::domain::entities::CreditNote> {
        let id = Uuid::new_v4();
        let count_row = sqlx::query!("SELECT COUNT(*) as count FROM credit_notes")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        let count = count_row.count.unwrap_or(0);
        let note_no = req.credit_note_no.clone().unwrap_or_else(|| {
            format!("ACC-CN-{}-{:04}", chrono::Utc::now().format("%Y"), count + 1)
        });
        let amt_dec = rust_decimal::Decimal::from_f64_retain(req.total_amount).unwrap_or_default();

        let rec = sqlx::query_as!(
            crate::domain::entities::CreditNote,
            r#"
            INSERT INTO credit_notes (id, credit_note_no, customer_id, posting_date, reason, total_amount, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'Submitted')
            RETURNING id, company_id, credit_note_no, customer_id, posting_date, reason, total_amount, status, created_at
            "#,
            id,
            note_no,
            req.customer_id,
            req.posting_date,
            req.reason,
            amt_dec
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    pub async fn list_debit_notes(&self) -> DomainResult<Vec<crate::domain::entities::DebitNote>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::DebitNote,
            r#"
            SELECT id, company_id, debit_note_no, supplier_id, posting_date, reason, total_amount, status, created_at
            FROM debit_notes
            ORDER BY posting_date DESC, created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_debit_note(
        &self,
        req: &crate::domain::entities::CreateDebitNoteRequest,
    ) -> DomainResult<crate::domain::entities::DebitNote> {
        let id = Uuid::new_v4();
        let count_row = sqlx::query!("SELECT COUNT(*) as count FROM debit_notes")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        let count = count_row.count.unwrap_or(0);
        let note_no = req.debit_note_no.clone().unwrap_or_else(|| {
            format!("ACC-DN-{}-{:04}", chrono::Utc::now().format("%Y"), count + 1)
        });
        let amt_dec = rust_decimal::Decimal::from_f64_retain(req.total_amount).unwrap_or_default();

        let rec = sqlx::query_as!(
            crate::domain::entities::DebitNote,
            r#"
            INSERT INTO debit_notes (id, debit_note_no, supplier_id, posting_date, reason, total_amount, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'Submitted')
            RETURNING id, company_id, debit_note_no, supplier_id, posting_date, reason, total_amount, status, created_at
            "#,
            id,
            note_no,
            req.supplier_id,
            req.posting_date,
            req.reason,
            amt_dec
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    // 7. Tax Templates
    pub async fn list_tax_categories(&self) -> DomainResult<Vec<crate::domain::entities::TaxCategory>> {
        let recs = sqlx::query_as!(
            crate::domain::entities::TaxCategory,
            r#"
            SELECT id, title, description, created_at
            FROM tax_categories
            ORDER BY title ASC
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(recs)
    }

    pub async fn create_tax_category(&self, title: &str, description: Option<&str>) -> DomainResult<crate::domain::entities::TaxCategory> {
        let id = Uuid::new_v4();
        let rec = sqlx::query_as!(
            crate::domain::entities::TaxCategory,
            r#"
            INSERT INTO tax_categories (id, title, description)
            VALUES ($1, $2, $3)
            RETURNING id, title, description, created_at
            "#,
            id,
            title,
            description
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rec)
    }

    // 8. Cash Flow Statement
    pub async fn get_cash_flow_statement(&self) -> DomainResult<crate::domain::entities::CashFlowStatement> {
        use crate::domain::entities::{CashFlowStatement, CashFlowSection, CashFlowItem};
        
        let sales_total: f64 = sqlx::query!("SELECT COALESCE(SUM(amount_paid), 0) as total FROM sales_invoices")
            .fetch_one(&self.pool)
            .await
            .ok()
            .and_then(|r| r.total.map(|v| rust_decimal::prelude::ToPrimitive::to_f64(&v).unwrap_or(0.0)))
            .unwrap_or(0.0);

        let purchase_total: f64 = sqlx::query!("SELECT COALESCE(SUM(amount_paid), 0) as total FROM purchase_bills")
            .fetch_one(&self.pool)
            .await
            .ok()
            .and_then(|r| r.total.map(|v| rust_decimal::prelude::ToPrimitive::to_f64(&v).unwrap_or(0.0)))
            .unwrap_or(0.0);

        let opex_total: f64 = sqlx::query!("SELECT COALESCE(SUM(total_amount), 0) as total FROM expenses WHERE expense_type = 'OPEX'")
            .fetch_one(&self.pool)
            .await
            .ok()
            .and_then(|r| r.total.map(|v| rust_decimal::prelude::ToPrimitive::to_f64(&v).unwrap_or(0.0)))
            .unwrap_or(0.0);

        let capex_total: f64 = sqlx::query!("SELECT COALESCE(SUM(total_amount), 0) as total FROM expenses WHERE expense_type = 'CAPEX'")
            .fetch_one(&self.pool)
            .await
            .ok()
            .and_then(|r| r.total.map(|v| rust_decimal::prelude::ToPrimitive::to_f64(&v).unwrap_or(0.0)))
            .unwrap_or(0.0);

        let operating_net = sales_total - purchase_total - opex_total;
        let investing_net = -capex_total;
        let financing_net = 0.0;
        let net_change = operating_net + investing_net + financing_net;
        let beginning_balance = 150_000_000.0; // Default base opening cash
        let ending_balance = beginning_balance + net_change;

        Ok(CashFlowStatement {
            period: chrono::Utc::now().format("%B %Y").to_string(),
            operating_activities: CashFlowSection {
                category: "Arus Kas dari Aktivitas Operasi".to_string(),
                total: operating_net,
                items: vec![
                    CashFlowItem { title: "Penerimaan Kas dari Pelanggan (Sales)".to_string(), amount: sales_total },
                    CashFlowItem { title: "Pembayaran Kas ke Pemasok (Purchases)".to_string(), amount: -purchase_total },
                    CashFlowItem { title: "Pembayaran Beban Operasional (OPEX)".to_string(), amount: -opex_total },
                ],
            },
            investing_activities: CashFlowSection {
                category: "Arus Kas dari Aktivitas Investasi".to_string(),
                total: investing_net,
                items: vec![
                    CashFlowItem { title: "Perolehan Aset Tetap & Peralatan (CAPEX)".to_string(), amount: -capex_total },
                ],
            },
            financing_activities: CashFlowSection {
                category: "Arus Kas dari Aktivitas Pendanaan".to_string(),
                total: financing_net,
                items: vec![
                    CashFlowItem { title: "Penerimaan / Pembayaran Pinjaman & Modal".to_string(), amount: 0.0 },
                ],
            },
            net_cash_change: net_change,
            beginning_cash_balance: beginning_balance,
            ending_cash_balance: ending_balance,
        })
    }

}
