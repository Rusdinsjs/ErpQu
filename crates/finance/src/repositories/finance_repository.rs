use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::entities::*;
use management_system_core::domain::errors::{DomainError, DomainResult};
use management_system_core::infrastructure::database::UnitOfWork;

#[derive(Debug, sqlx::FromRow)]
struct ExpenseAnalysisRow {
    pub month: chrono::NaiveDate,
    pub expense_type: String,
    pub total_amount: Decimal,
}

impl From<ExpenseAnalysisRow> for ExpenseAnalysis {
    fn from(row: ExpenseAnalysisRow) -> Self {
        Self {
            month: row.month,
            expense_type: row.expense_type,
            total_amount: row.total_amount,
        }
    }
}

// --- Internal SQL persistence mapping rows (3R.1.1-002: Pure domain models carry 0 sqlx attributes) ---

#[derive(Debug, sqlx::FromRow)]
struct ChartOfAccountRow {
    id: Uuid,
    company_id: Option<Uuid>,
    code: String,
    name: String,
    account_type: String,
    normal_balance: String,
    parent_id: Option<Uuid>,
    is_active: bool,
    description: Option<String>,
    currency: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<ChartOfAccountRow> for ChartOfAccount {
    fn from(r: ChartOfAccountRow) -> Self {
        let account_type = match r.account_type.to_lowercase().as_str() {
            "asset" => AccountType::Asset,
            "liability" => AccountType::Liability,
            "equity" => AccountType::Equity,
            "revenue" => AccountType::Revenue,
            _ => AccountType::Expense,
        };
        let normal_balance = match r.normal_balance.to_lowercase().as_str() {
            "debit" => NormalBalance::Debit,
            _ => NormalBalance::Credit,
        };
        Self {
            id: r.id,
            company_id: r.company_id,
            code: r.code,
            name: r.name,
            account_type,
            normal_balance,
            parent_id: r.parent_id,
            is_active: r.is_active,
            description: r.description,
            currency: r.currency,
            created_at: r.created_at,
            updated_at: r.updated_at,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SalesInvoiceRow {
    id: Uuid,
    invoice_number: String,
    client_id: Uuid,
    date: chrono::NaiveDate,
    due_date: Option<chrono::NaiveDate>,
    subject: Option<String>,
    subtotal: Decimal,
    tax: Decimal,
    total_amount: Decimal,
    amount_paid: Decimal,
    status: String,
    journal_entry_id: Option<Uuid>,
    created_at: chrono::DateTime<chrono::Utc>,
    attachment_url: Option<String>,
    company_id: Option<Uuid>,
}

impl From<SalesInvoiceRow> for SalesInvoice {
    fn from(r: SalesInvoiceRow) -> Self {
        Self {
            id: r.id,
            invoice_number: r.invoice_number,
            client_id: r.client_id,
            date: r.date,
            due_date: r.due_date,
            subject: r.subject,
            subtotal: r.subtotal,
            tax: r.tax,
            total_amount: r.total_amount,
            amount_paid: r.amount_paid,
            status: r.status,
            journal_entry_id: r.journal_entry_id,
            journal_status: None,
            created_at: r.created_at,
            attachment_url: r.attachment_url,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct TaxInvoiceRow {
    pub id: Uuid,
    pub company_id: Uuid,
    pub sales_invoice_id: Option<Uuid>,
    pub tax_invoice_number: String,
    pub npwp_buyer: String,
    pub name_buyer: String,
    pub tax_base: Decimal,
    pub vat_amount: Decimal,
    pub vat_rate: Decimal,
    pub effective_date: chrono::NaiveDate,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<TaxInvoiceRow> for crate::domain::entities::efaktur::TaxInvoiceRecord {
    fn from(r: TaxInvoiceRow) -> Self {
        Self {
            id: r.id,
            company_id: r.company_id,
            sales_invoice_id: r.sales_invoice_id,
            tax_invoice_number: r.tax_invoice_number,
            npwp_buyer: r.npwp_buyer,
            name_buyer: r.name_buyer,
            tax_base: r.tax_base,
            vat_amount: r.vat_amount,
            vat_rate: r.vat_rate,
            effective_date: r.effective_date,
            status: r.status,
            created_at: r.created_at,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SalesInvoiceItemRow {
    id: Uuid,
    invoice_id: Uuid,
    description: String,
    quantity: Decimal,
    unit_price: Decimal,
    total_price: Decimal,
    account_id: Option<Uuid>,
}

impl From<SalesInvoiceItemRow> for SalesInvoiceItem {
    fn from(r: SalesInvoiceItemRow) -> Self {
        Self {
            id: r.id,
            invoice_id: r.invoice_id,
            description: r.description,
            quantity: r.quantity,
            unit_price: r.unit_price,
            total_price: r.total_price,
            account_id: r.account_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct PurchaseBillRow {
    id: Uuid,
    bill_number: String,
    vendor_id: Uuid,
    date: chrono::NaiveDate,
    due_date: Option<chrono::NaiveDate>,
    total_amount: Decimal,
    amount_paid: Decimal,
    status: String,
    budget_type: String,
    journal_entry_id: Option<Uuid>,
    created_at: chrono::DateTime<chrono::Utc>,
    attachment_url: Option<String>,
    company_id: Option<Uuid>,
}

impl From<PurchaseBillRow> for PurchaseBill {
    fn from(r: PurchaseBillRow) -> Self {
        Self {
            id: r.id,
            bill_number: r.bill_number,
            vendor_id: r.vendor_id,
            date: r.date,
            due_date: r.due_date,
            total_amount: r.total_amount,
            amount_paid: r.amount_paid,
            status: r.status,
            budget_type: r.budget_type,
            journal_entry_id: r.journal_entry_id,
            created_at: r.created_at,
            attachment_url: r.attachment_url,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct ExpenseRow {
    id: Uuid,
    expense_number: String,
    date: chrono::NaiveDate,
    pay_from_account_id: Uuid,
    recipient: String,
    total_amount: Decimal,
    status: String,
    expense_type: Option<String>,
    journal_entry_id: Option<Uuid>,
    created_at: chrono::DateTime<chrono::Utc>,
    attachment_url: Option<String>,
    company_id: Option<Uuid>,
}

impl From<ExpenseRow> for Expense {
    fn from(r: ExpenseRow) -> Self {
        Self {
            id: r.id,
            expense_number: r.expense_number,
            date: r.date,
            pay_from_account_id: r.pay_from_account_id,
            recipient: r.recipient,
            total_amount: r.total_amount,
            status: r.status,
            expense_type: r.expense_type,
            journal_entry_id: r.journal_entry_id,
            created_at: r.created_at,
            attachment_url: r.attachment_url,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct CashBankTransactionRow {
    id: Uuid,
    transaction_number: String,
    transaction_type: String,
    date: chrono::NaiveDate,
    amount: Decimal,
    from_account_id: Option<Uuid>,
    to_account_id: Option<Uuid>,
    account_id: Option<Uuid>,
    contact_name: Option<String>,
    description: Option<String>,
    journal_entry_id: Option<Uuid>,
    created_at: chrono::DateTime<chrono::Utc>,
    company_id: Option<Uuid>,
}

impl From<CashBankTransactionRow> for CashBankTransaction {
    fn from(r: CashBankTransactionRow) -> Self {
        Self {
            id: r.id,
            transaction_number: r.transaction_number,
            transaction_type: r.transaction_type,
            date: r.date,
            amount: r.amount,
            from_account_id: r.from_account_id,
            to_account_id: r.to_account_id,
            account_id: r.account_id,
            contact_name: r.contact_name,
            description: r.description,
            journal_entry_id: r.journal_entry_id,
            created_at: r.created_at,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SalesQuoteRow {
    id: Uuid,
    quote_number: String,
    client_id: Uuid,
    date: chrono::NaiveDate,
    expiry_date: Option<chrono::NaiveDate>,
    subject: Option<String>,
    subtotal: Decimal,
    tax: Decimal,
    total_amount: Decimal,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    company_id: Option<Uuid>,
}

impl From<SalesQuoteRow> for SalesQuote {
    fn from(r: SalesQuoteRow) -> Self {
        Self {
            id: r.id,
            quote_number: r.quote_number,
            client_id: r.client_id,
            date: r.date,
            expiry_date: r.expiry_date,
            subject: r.subject,
            subtotal: r.subtotal,
            tax: r.tax,
            total_amount: r.total_amount,
            status: r.status,
            created_at: r.created_at,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SalesOrderRow {
    id: Uuid,
    order_number: String,
    quote_id: Option<Uuid>,
    client_id: Uuid,
    date: chrono::NaiveDate,
    delivery_date: Option<chrono::NaiveDate>,
    subject: Option<String>,
    subtotal: Decimal,
    tax: Decimal,
    total_amount: Decimal,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    company_id: Option<Uuid>,
}

impl From<SalesOrderRow> for SalesOrder {
    fn from(r: SalesOrderRow) -> Self {
        Self {
            id: r.id,
            order_number: r.order_number,
            quote_id: r.quote_id,
            client_id: r.client_id,
            date: r.date,
            delivery_date: r.delivery_date,
            subject: r.subject,
            subtotal: r.subtotal,
            tax: r.tax,
            total_amount: r.total_amount,
            status: r.status,
            created_at: r.created_at,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SalesShipmentRow {
    id: Uuid,
    shipment_number: String,
    sales_order_id: Uuid,
    client_id: Option<Uuid>,
    warehouse_id: Option<Uuid>,
    date: chrono::NaiveDate,
    courier_name: Option<String>,
    tracking_number: Option<String>,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    company_id: Option<Uuid>,
}

impl From<SalesShipmentRow> for SalesShipment {
    fn from(r: SalesShipmentRow) -> Self {
        Self {
            id: r.id,
            shipment_number: r.shipment_number,
            sales_order_id: r.sales_order_id,
            client_id: r.client_id,
            warehouse_id: r.warehouse_id,
            date: r.date,
            courier_name: r.courier_name,
            tracking_number: r.tracking_number,
            status: r.status,
            created_at: r.created_at,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct SalesShipmentItemRow {
    pub id: Uuid,
    pub shipment_id: Uuid,
    pub order_item_id: Option<Uuid>,
    pub description: String,
    pub quantity_shipped: Decimal,
    pub item_id: Option<Uuid>,
}

impl From<SalesShipmentItemRow> for SalesShipmentItem {
    fn from(r: SalesShipmentItemRow) -> Self {
        Self {
            id: r.id,
            shipment_id: r.shipment_id,
            order_item_id: r.order_item_id,
            description: r.description,
            quantity_shipped: r.quantity_shipped,
            item_id: r.item_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct PurchaseReceiptRow {
    pub id: Uuid,
    pub company_id: Uuid,
    pub receipt_number: String,
    pub purchase_order_id: Option<Uuid>,
    pub vendor_id: Uuid,
    pub warehouse_id: Uuid,
    pub posting_date: chrono::NaiveDate,
    pub status: String,
    pub notes: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub created_by: Option<Uuid>,
}

impl From<PurchaseReceiptRow> for crate::domain::entities::commercial_graph::PurchaseReceipt {
    fn from(r: PurchaseReceiptRow) -> Self {
        Self {
            id: r.id,
            company_id: r.company_id,
            receipt_number: r.receipt_number,
            purchase_order_id: r.purchase_order_id,
            vendor_id: r.vendor_id,
            warehouse_id: r.warehouse_id,
            posting_date: r.posting_date,
            status: r.status,
            notes: r.notes,
            created_at: r.created_at,
            created_by: r.created_by,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct PurchaseReceiptItemRow {
    pub id: Uuid,
    pub receipt_id: Uuid,
    pub item_id: Uuid,
    pub qty_received: Decimal,
    pub unit_cost: Decimal,
    pub total_amount: Decimal,
    pub po_line_id: Option<Uuid>,
    pub batch_no: Option<String>,
    pub serial_no: Option<String>,
}

impl From<PurchaseReceiptItemRow>
    for crate::domain::entities::commercial_graph::PurchaseReceiptItem
{
    fn from(r: PurchaseReceiptItemRow) -> Self {
        Self {
            id: r.id,
            receipt_id: r.receipt_id,
            item_id: r.item_id,
            qty_received: r.qty_received,
            unit_cost: r.unit_cost,
            total_amount: r.total_amount,
            po_line_id: r.po_line_id,
            batch_no: r.batch_no,
            serial_no: r.serial_no,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct PurchaseQuoteRow {
    id: Uuid,
    quote_number: String,
    vendor_id: Uuid,
    date: chrono::NaiveDate,
    expiry_date: Option<chrono::NaiveDate>,
    subject: Option<String>,
    subtotal: Decimal,
    tax: Decimal,
    total_amount: Decimal,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    company_id: Option<Uuid>,
}

impl From<PurchaseQuoteRow> for PurchaseQuote {
    fn from(r: PurchaseQuoteRow) -> Self {
        Self {
            id: r.id,
            quote_number: r.quote_number,
            vendor_id: r.vendor_id,
            date: r.date,
            expiry_date: r.expiry_date,
            subject: r.subject,
            subtotal: r.subtotal,
            tax: r.tax,
            total_amount: r.total_amount,
            status: r.status,
            created_at: r.created_at,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct PurchaseOrderRow {
    id: Uuid,
    order_number: String,
    purchase_quote_id: Option<Uuid>,
    vendor_id: Uuid,
    date: chrono::NaiveDate,
    delivery_date: Option<chrono::NaiveDate>,
    subject: Option<String>,
    subtotal: Decimal,
    tax: Decimal,
    total_amount: Decimal,
    status: String,
    budget_type: String,
    created_at: chrono::DateTime<chrono::Utc>,
    company_id: Option<Uuid>,
}

impl From<PurchaseOrderRow> for PurchaseOrder {
    fn from(r: PurchaseOrderRow) -> Self {
        Self {
            id: r.id,
            order_number: r.order_number,
            purchase_quote_id: r.purchase_quote_id,
            vendor_id: r.vendor_id,
            date: r.date,
            delivery_date: r.delivery_date,
            subject: r.subject,
            subtotal: r.subtotal,
            tax: r.tax,
            total_amount: r.total_amount,
            status: r.status,
            budget_type: r.budget_type,
            created_at: r.created_at,
            company_id: r.company_id,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct PurchaseShipmentRow {
    id: Uuid,
    shipment_number: String,
    purchase_order_id: Uuid,
    vendor_id: Option<Uuid>,
    date: chrono::NaiveDate,
    courier_name: Option<String>,
    tracking_number: Option<String>,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    company_id: Option<Uuid>,
}

impl From<PurchaseShipmentRow> for PurchaseShipment {
    fn from(r: PurchaseShipmentRow) -> Self {
        Self {
            id: r.id,
            shipment_number: r.shipment_number,
            purchase_order_id: r.purchase_order_id,
            vendor_id: r.vendor_id,
            date: r.date,
            courier_name: r.courier_name,
            tracking_number: r.tracking_number,
            status: r.status,
            created_at: r.created_at,
            company_id: r.company_id,
        }
    }
}

// --- Repository Implementation ---

#[derive(Clone)]
pub struct FinanceRepository {
    pool: PgPool,
}

impl FinanceRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn find_by_id(&self, id: Uuid) -> DomainResult<Option<ChartOfAccount>> {
        self.get_account_by_id(id).await
    }

    pub async fn find_by_code(
        &self,
        code: &str,
        company_id: Option<Uuid>,
    ) -> DomainResult<Option<ChartOfAccount>> {
        self.get_account_by_code(code, company_id).await
    }

    pub async fn list_all(&self, company_id: Uuid) -> DomainResult<Vec<ChartOfAccount>> {
        self.list_accounts(company_id).await
    }

    pub async fn get_capex_opex_analysis(
        &self,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<ExpenseAnalysis>> {
        let rows = sqlx::query_as::<_, ExpenseAnalysisRow>(
            r#"
            SELECT
                DATE_TRUNC('month', date)::date AS month,
                COALESCE(expense_type, 'General') AS expense_type,
                SUM(total_amount) AS total_amount
            FROM expenses
            WHERE ($1::date IS NULL OR date >= $1)
              AND ($2::date IS NULL OR date <= $2)
            GROUP BY DATE_TRUNC('month', date)::date, COALESCE(expense_type, 'General')
            ORDER BY month DESC, expense_type ASC
            "#,
        )
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_sales_invoice_with_uow(
        &self,
        uow: &mut UnitOfWork,
        invoice: &SalesInvoice,
        items: &[CreateInvoiceItemRequest],
    ) -> DomainResult<(SalesInvoice, Vec<SalesInvoiceItem>)> {
        if items.is_empty() {
            return Err(DomainError::validation(
                "items",
                "Sales invoice requires at least one line item",
            ));
        }

        let created_row = sqlx::query_as::<_, SalesInvoiceRow>(
            r#"
            INSERT INTO sales_invoices (
                id, invoice_number, client_id, date, due_date, subject, 
                subtotal, tax, total_amount, amount_paid, status, journal_entry_id, attachment_url,
                company_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id, invoice_number, client_id, date, due_date, subject, 
                      subtotal, tax, total_amount, amount_paid, 
                      status, journal_entry_id, created_at, attachment_url, company_id
            "#,
        )
        .bind(invoice.id)
        .bind(&invoice.invoice_number)
        .bind(invoice.client_id)
        .bind(invoice.date)
        .bind(invoice.due_date)
        .bind(&invoice.subject)
        .bind(invoice.subtotal)
        .bind(invoice.tax)
        .bind(invoice.total_amount)
        .bind(invoice.amount_paid)
        .bind(&invoice.status)
        .bind(invoice.journal_entry_id)
        .bind(&invoice.attachment_url)
        .bind(invoice.company_id)
        .fetch_one(uow.conn())
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let created_invoice: SalesInvoice = created_row.into();

        let mut created_items = Vec::new();
        for item in items {
            let item_id = Uuid::new_v4();
            let total_price = item.quantity * item.unit_price;
            let item_row = sqlx::query_as::<_, SalesInvoiceItemRow>(
                r#"
                INSERT INTO sales_invoice_items (
                    id, invoice_id, description, quantity, unit_price, total_price, account_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, invoice_id, description, quantity, unit_price, total_price, account_id
                "#,
            )
            .bind(item_id)
            .bind(created_invoice.id)
            .bind(&item.description)
            .bind(item.quantity)
            .bind(item.unit_price)
            .bind(total_price)
            .bind(item.account_id)
            .fetch_one(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

            created_items.push(item_row.into());
        }

        Ok((created_invoice, created_items))
    }

    pub async fn update_sales_invoice_with_uow(
        &self,
        uow: &mut UnitOfWork,
        invoice: &SalesInvoice,
        items: &[CreateInvoiceItemRequest],
    ) -> DomainResult<(SalesInvoice, Vec<SalesInvoiceItem>)> {
        let updated_row = sqlx::query_as::<_, SalesInvoiceRow>(
            r#"
            UPDATE sales_invoices
            SET invoice_number = $1, client_id = $2, date = $3, due_date = $4, subject = $5,
                subtotal = $6, tax = $7, total_amount = $8, amount_paid = $9, status = $10,
                attachment_url = $11, company_id = COALESCE($12, company_id)
            WHERE id = $13
            RETURNING id, invoice_number, client_id, date, due_date, subject, 
                      subtotal, tax, total_amount, amount_paid, 
                      status, journal_entry_id, created_at, attachment_url, company_id
            "#,
        )
        .bind(&invoice.invoice_number)
        .bind(invoice.client_id)
        .bind(invoice.date)
        .bind(invoice.due_date)
        .bind(&invoice.subject)
        .bind(invoice.subtotal)
        .bind(invoice.tax)
        .bind(invoice.total_amount)
        .bind(invoice.amount_paid)
        .bind(&invoice.status)
        .bind(&invoice.attachment_url)
        .bind(invoice.company_id)
        .bind(invoice.id)
        .fetch_one(uow.conn())
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let updated_invoice: SalesInvoice = updated_row.into();

        sqlx::query("DELETE FROM sales_invoice_items WHERE invoice_id = $1")
            .bind(updated_invoice.id)
            .execute(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let mut updated_items = Vec::new();
        for item in items {
            let item_id = Uuid::new_v4();
            let total_price = item.quantity * item.unit_price;
            let item_row = sqlx::query_as::<_, SalesInvoiceItemRow>(
                r#"
                INSERT INTO sales_invoice_items (
                    id, invoice_id, description, quantity, unit_price, total_price, account_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, invoice_id, description, quantity, unit_price, total_price, account_id
                "#,
            )
            .bind(item_id)
            .bind(updated_invoice.id)
            .bind(&item.description)
            .bind(item.quantity)
            .bind(item.unit_price)
            .bind(total_price)
            .bind(item.account_id)
            .fetch_one(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

            updated_items.push(item_row.into());
        }

        Ok((updated_invoice, updated_items))
    }

    pub async fn get_sales_invoice_by_id(&self, id: Uuid) -> DomainResult<Option<SalesInvoice>> {
        let row = sqlx::query_as::<_, SalesInvoiceRow>(
            r#"
            SELECT id, invoice_number, client_id, date, due_date, subject, 
                   subtotal, tax, total_amount, amount_paid, 
                   status, journal_entry_id, created_at, attachment_url, company_id
            FROM sales_invoices
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.map(Into::into))
    }

    pub async fn get_sales_invoice_items(
        &self,
        invoice_id: Uuid,
    ) -> DomainResult<Vec<SalesInvoiceItem>> {
        let rows = sqlx::query_as::<_, SalesInvoiceItemRow>(
            r#"
            SELECT id, invoice_id, description, quantity, unit_price, total_price, account_id
            FROM sales_invoice_items
            WHERE invoice_id = $1
            "#,
        )
        .bind(invoice_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn list_sales_invoices(&self) -> DomainResult<Vec<SalesInvoice>> {
        let rows = sqlx::query_as::<_, SalesInvoiceRow>(
            r#"
            SELECT id, invoice_number, client_id, date, due_date, subject, 
                   subtotal, tax, total_amount, amount_paid, 
                   status, journal_entry_id, created_at, attachment_url, company_id
            FROM sales_invoices
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn delete_sales_invoice(&self, id: Uuid) -> DomainResult<()> {
        sqlx::query("DELETE FROM sales_invoices WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    // --- Chart of Accounts queries ---

    pub async fn list_accounts(&self, company_id: Uuid) -> DomainResult<Vec<ChartOfAccount>> {
        let rows = sqlx::query_as::<_, ChartOfAccountRow>(
            r#"
            SELECT id, company_id, code, name, account_type::text AS account_type, normal_balance::text AS normal_balance, parent_id, is_active, description, currency, created_at, updated_at
            FROM chart_of_accounts
            WHERE company_id = $1
            ORDER BY code ASC
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn get_account_by_id(&self, id: Uuid) -> DomainResult<Option<ChartOfAccount>> {
        let row = sqlx::query_as::<_, ChartOfAccountRow>(
            r#"
            SELECT id, company_id, code, name, account_type::text AS account_type, normal_balance::text AS normal_balance, parent_id, is_active, description, currency, created_at, updated_at
            FROM chart_of_accounts
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.map(Into::into))
    }

    pub async fn get_account_by_code(
        &self,
        code: &str,
        company_id: Option<Uuid>,
    ) -> DomainResult<Option<ChartOfAccount>> {
        let row = sqlx::query_as::<_, ChartOfAccountRow>(
            r#"
            SELECT id, company_id, code, name, account_type::text AS account_type, normal_balance::text AS normal_balance, parent_id, is_active, description, currency, created_at, updated_at
            FROM chart_of_accounts
            WHERE code = $1 AND ($2::uuid IS NULL OR company_id = $2)
            "#,
        )
        .bind(code)
        .bind(company_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.map(Into::into))
    }

    pub async fn create_account(&self, account: &ChartOfAccount) -> DomainResult<ChartOfAccount> {
        let acc_type_str = match account.account_type {
            AccountType::Asset => "asset",
            AccountType::Liability => "liability",
            AccountType::Equity => "equity",
            AccountType::Revenue => "revenue",
            AccountType::Expense => "expense",
        };
        let norm_bal_str = match account.normal_balance {
            NormalBalance::Debit => "debit",
            NormalBalance::Credit => "credit",
        };

        let row = sqlx::query_as::<_, ChartOfAccountRow>(
            r#"
            INSERT INTO chart_of_accounts (id, company_id, code, name, account_type, normal_balance, parent_id, is_active, description, currency, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5::account_type, $6::normal_balance, $7, $8, $9, $10, $11, $12)
            RETURNING id, company_id, code, name, account_type::text AS account_type, normal_balance::text AS normal_balance, parent_id, is_active, description, currency, created_at, updated_at
            "#,
        )
        .bind(account.id)
        .bind(account.company_id)
        .bind(&account.code)
        .bind(&account.name)
        .bind(acc_type_str)
        .bind(norm_bal_str)
        .bind(account.parent_id)
        .bind(account.is_active)
        .bind(&account.description)
        .bind(&account.currency)
        .bind(account.created_at)
        .bind(account.updated_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn update_account(&self, account: &ChartOfAccount) -> DomainResult<ChartOfAccount> {
        let row = sqlx::query_as::<_, ChartOfAccountRow>(
            r#"
            UPDATE chart_of_accounts
            SET name = $1, parent_id = $2, is_active = $3, description = $4, updated_at = NOW()
            WHERE id = $5
            RETURNING id, company_id, code, name, account_type::text AS account_type, normal_balance::text AS normal_balance, parent_id, is_active, description, currency, created_at, updated_at
            "#,
        )
        .bind(&account.name)
        .bind(account.parent_id)
        .bind(account.is_active)
        .bind(&account.description)
        .bind(account.id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn get_general_ledger(
        &self,
        account_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<GeneralLedgerEntry>> {
        #[derive(sqlx::FromRow)]
        struct GLRow {
            date: chrono::NaiveDate,
            transaction_number: String,
            header_description: String,
            line_description: Option<String>,
            debit: Decimal,
            credit: Decimal,
        }

        let rows = sqlx::query_as::<_, GLRow>(
            r#"
            SELECT
                gl.posting_date AS date,
                gl.voucher_no AS transaction_number,
                gl.voucher_type AS header_description,
                NULL::text AS line_description,
                gl.debit,
                gl.credit
            FROM gl_entries gl
            WHERE gl.account_id = $1
              AND ($2::date IS NULL OR gl.posting_date >= $2)
              AND ($3::date IS NULL OR gl.posting_date <= $3)
            ORDER BY gl.posting_date ASC, gl.created_at ASC
            "#,
        )
        .bind(account_id)
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let mut running_balance = Decimal::ZERO;
        let mut entries = Vec::new();

        for r in rows {
            running_balance += r.debit - r.credit;
            entries.push(GeneralLedgerEntry {
                date: r.date,
                transaction_number: r.transaction_number,
                header_description: r.header_description,
                line_description: r.line_description,
                debit: r.debit,
                credit: r.credit,
                balance: running_balance,
            });
        }

        Ok(entries)
    }

    pub async fn get_trial_balance(
        &self,
        company_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<TrialBalanceEntry>> {
        #[derive(sqlx::FromRow)]
        struct TBRow {
            account_id: Uuid,
            account_code: String,
            account_name: String,
            account_type: String,
            debit: Decimal,
            credit: Decimal,
        }

        let rows = sqlx::query_as::<_, TBRow>(
            r#"
            SELECT
                coa.id AS account_id,
                coa.code AS account_code,
                coa.name AS account_name,
                coa.account_type::text AS account_type,
                COALESCE(SUM(gl.debit), 0.0000) AS debit,
                COALESCE(SUM(gl.credit), 0.0000) AS credit
            FROM chart_of_accounts coa
            LEFT JOIN gl_entries gl ON coa.id = gl.account_id
                AND gl.company_id = $1
                AND ($2::date IS NULL OR gl.posting_date >= $2)
                AND ($3::date IS NULL OR gl.posting_date <= $3)
            WHERE COALESCE(coa.is_group, FALSE) = FALSE
                AND coa.is_active = TRUE
                AND coa.company_id = $1
            GROUP BY coa.id, coa.code, coa.name, coa.account_type
            ORDER BY coa.code ASC
            "#,
        )
        .bind(company_id)
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let entries = rows
            .into_iter()
            .map(|r| {
                let acc_type = match r.account_type.to_lowercase().as_str() {
                    "asset" => AccountType::Asset,
                    "liability" => AccountType::Liability,
                    "equity" => AccountType::Equity,
                    "revenue" => AccountType::Revenue,
                    "expense" => AccountType::Expense,
                    _ => AccountType::Asset,
                };
                TrialBalanceEntry {
                    account_id: r.account_id,
                    account_code: r.account_code,
                    account_name: r.account_name,
                    account_type: acc_type,
                    debit: r.debit,
                    credit: r.credit,
                }
            })
            .collect();

        Ok(entries)
    }

    // --- Account Mapping queries (QSEC-ACMAP-001) ---

    /// Resolve a symbolic account mapping key to an actual CoA account for a specific company.
    /// Falls back to code-based lookup if no mapping exists.
    pub async fn get_account_by_mapping(
        &self,
        company_id: Uuid,
        mapping_key: &str,
    ) -> DomainResult<Option<ChartOfAccount>> {
        let row = sqlx::query_as::<_, ChartOfAccountRow>(
            r#"
            SELECT coa.id, coa.company_id, coa.code, coa.name,
                   coa.account_type::text AS account_type,
                   coa.normal_balance::text AS normal_balance,
                   coa.parent_id, coa.is_active, coa.description,
                   coa.currency, coa.created_at, coa.updated_at
            FROM account_mappings am
            JOIN chart_of_accounts coa ON coa.id = am.account_id
            WHERE am.company_id = $1 AND am.mapping_key = $2
            "#,
        )
        .bind(company_id)
        .bind(mapping_key)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.map(Into::into))
    }

    /// Create or update an account mapping for a company
    pub async fn upsert_account_mapping(
        &self,
        company_id: Uuid,
        mapping_key: &str,
        account_id: Uuid,
        description: Option<&str>,
    ) -> DomainResult<()> {
        sqlx::query(
            r#"
            INSERT INTO account_mappings (company_id, mapping_key, account_id, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (company_id, mapping_key)
            DO UPDATE SET account_id = EXCLUDED.account_id,
                          description = EXCLUDED.description,
                          updated_at = NOW()
            "#,
        )
        .bind(company_id)
        .bind(mapping_key)
        .bind(account_id)
        .bind(description)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    // --- Other operational entity queries ---

    pub async fn create_purchase_bill(&self, bill: &PurchaseBill) -> DomainResult<PurchaseBill> {
        let row = sqlx::query_as::<_, PurchaseBillRow>(
            r#"
            INSERT INTO purchase_bills (id, bill_number, vendor_id, date, due_date, total_amount, amount_paid, status, budget_type, journal_entry_id, created_at, attachment_url, company_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, bill_number, vendor_id, date, due_date, total_amount, amount_paid, status, budget_type, journal_entry_id, created_at, attachment_url, company_id
            "#,
        )
        .bind(bill.id)
        .bind(&bill.bill_number)
        .bind(bill.vendor_id)
        .bind(bill.date)
        .bind(bill.due_date)
        .bind(bill.total_amount)
        .bind(bill.amount_paid)
        .bind(&bill.status)
        .bind(&bill.budget_type)
        .bind(bill.journal_entry_id)
        .bind(bill.created_at)
        .bind(&bill.attachment_url)
        .bind(bill.company_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn create_purchase_bill_with_uow(
        &self,
        uow: &mut UnitOfWork,
        bill: &PurchaseBill,
    ) -> DomainResult<PurchaseBill> {
        let row = sqlx::query_as::<_, PurchaseBillRow>(
            r#"
            INSERT INTO purchase_bills (id, bill_number, vendor_id, date, due_date, total_amount, amount_paid, status, budget_type, journal_entry_id, created_at, attachment_url, company_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, bill_number, vendor_id, date, due_date, total_amount, amount_paid, status, budget_type, journal_entry_id, created_at, attachment_url, company_id
            "#,
        )
        .bind(bill.id)
        .bind(&bill.bill_number)
        .bind(bill.vendor_id)
        .bind(bill.date)
        .bind(bill.due_date)
        .bind(bill.total_amount)
        .bind(bill.amount_paid)
        .bind(&bill.status)
        .bind(&bill.budget_type)
        .bind(bill.journal_entry_id)
        .bind(bill.created_at)
        .bind(&bill.attachment_url)
        .bind(bill.company_id)
        .fetch_one(uow.conn())
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn create_expense_with_uow(
        &self,
        uow: &mut UnitOfWork,
        expense: &Expense,
    ) -> DomainResult<Expense> {
        let row = sqlx::query_as::<_, ExpenseRow>(
            r#"
            INSERT INTO expenses (id, expense_number, date, pay_from_account_id, recipient, total_amount, status, expense_type, journal_entry_id, created_at, attachment_url, company_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, expense_number, date, pay_from_account_id, recipient, total_amount, status, expense_type, journal_entry_id, created_at, attachment_url, company_id
            "#,
        )
        .bind(expense.id)
        .bind(&expense.expense_number)
        .bind(expense.date)
        .bind(expense.pay_from_account_id)
        .bind(&expense.recipient)
        .bind(expense.total_amount)
        .bind(&expense.status)
        .bind(&expense.expense_type)
        .bind(expense.journal_entry_id)
        .bind(expense.created_at)
        .bind(&expense.attachment_url)
        .bind(expense.company_id)
        .fetch_one(uow.conn())
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_purchase_bills(&self) -> DomainResult<Vec<PurchaseBill>> {
        let rows = sqlx::query_as::<_, PurchaseBillRow>(
            r#"
            SELECT id, bill_number, vendor_id, date, due_date, total_amount, amount_paid, status, budget_type, journal_entry_id, created_at, attachment_url, company_id
            FROM purchase_bills
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn get_purchase_bill_by_id(&self, id: Uuid) -> DomainResult<Option<PurchaseBill>> {
        let row = sqlx::query_as::<_, PurchaseBillRow>(
            r#"
            SELECT id, bill_number, vendor_id, date, due_date, total_amount, amount_paid, status, budget_type, journal_entry_id, created_at, attachment_url, company_id
            FROM purchase_bills
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.map(Into::into))
    }

    pub async fn update_purchase_bill_payment_status(
        &self,
        id: Uuid,
        amount_paid: Decimal,
        status: &str,
    ) -> DomainResult<()> {
        sqlx::query(
            r#"
            UPDATE purchase_bills
            SET amount_paid = $1, status = $2
            WHERE id = $3
            "#,
        )
        .bind(amount_paid)
        .bind(status)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn update_sales_invoice_payment_status(
        &self,
        id: Uuid,
        amount_paid: Decimal,
        status: &str,
    ) -> DomainResult<()> {
        sqlx::query(
            r#"
            UPDATE sales_invoices
            SET amount_paid = $1, status = $2
            WHERE id = $3
            "#,
        )
        .bind(amount_paid)
        .bind(status)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn create_expense(&self, expense: &Expense) -> DomainResult<Expense> {
        let row = sqlx::query_as::<_, ExpenseRow>(
            r#"
            INSERT INTO expenses (id, expense_number, date, pay_from_account_id, recipient, total_amount, status, expense_type, journal_entry_id, created_at, attachment_url, company_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, expense_number, date, pay_from_account_id, recipient, total_amount, status, expense_type, journal_entry_id, created_at, attachment_url, company_id
            "#,
        )
        .bind(expense.id)
        .bind(&expense.expense_number)
        .bind(expense.date)
        .bind(expense.pay_from_account_id)
        .bind(&expense.recipient)
        .bind(expense.total_amount)
        .bind(&expense.status)
        .bind(&expense.expense_type)
        .bind(expense.journal_entry_id)
        .bind(expense.created_at)
        .bind(&expense.attachment_url)
        .bind(expense.company_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_expenses(&self) -> DomainResult<Vec<Expense>> {
        let rows = sqlx::query_as::<_, ExpenseRow>(
            r#"
            SELECT id, expense_number, date, pay_from_account_id, recipient, total_amount, status, expense_type, journal_entry_id, created_at, attachment_url, company_id
            FROM expenses
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_cash_bank_transaction(
        &self,
        tx: &CashBankTransaction,
    ) -> DomainResult<CashBankTransaction> {
        let row = sqlx::query_as::<_, CashBankTransactionRow>(
            r#"
            INSERT INTO cash_bank_transactions (id, transaction_number, transaction_type, date, amount, from_account_id, to_account_id, account_id, contact_name, description, journal_entry_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, transaction_number, transaction_type, date, amount, from_account_id, to_account_id, account_id, contact_name, description, journal_entry_id, created_at
            "#,
        )
        .bind(tx.id)
        .bind(&tx.transaction_number)
        .bind(&tx.transaction_type)
        .bind(tx.date)
        .bind(tx.amount)
        .bind(tx.from_account_id)
        .bind(tx.to_account_id)
        .bind(tx.account_id)
        .bind(&tx.contact_name)
        .bind(&tx.description)
        .bind(tx.journal_entry_id)
        .bind(tx.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_sales_quotes(&self) -> DomainResult<Vec<SalesQuote>> {
        let rows = sqlx::query_as::<_, SalesQuoteRow>(
            r#"
            SELECT id, quote_number, client_id, date, expiry_date, subject, subtotal, tax, total_amount, status, created_at
            FROM sales_quotes
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_sales_quote(&self, quote: &SalesQuote) -> DomainResult<SalesQuote> {
        let row = sqlx::query_as::<_, SalesQuoteRow>(
            r#"
            INSERT INTO sales_quotes (id, quote_number, client_id, date, expiry_date, subject, subtotal, tax, total_amount, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, quote_number, client_id, date, expiry_date, subject, subtotal, tax, total_amount, status, created_at
            "#,
        )
        .bind(quote.id)
        .bind(&quote.quote_number)
        .bind(quote.client_id)
        .bind(quote.date)
        .bind(quote.expiry_date)
        .bind(&quote.subject)
        .bind(quote.subtotal)
        .bind(quote.tax)
        .bind(quote.total_amount)
        .bind(&quote.status)
        .bind(quote.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_sales_orders(&self) -> DomainResult<Vec<SalesOrder>> {
        let rows = sqlx::query_as::<_, SalesOrderRow>(
            r#"
            SELECT id, order_number, quote_id, client_id, date, delivery_date, subject, subtotal, tax, total_amount, status, created_at
            FROM sales_orders
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_sales_order(&self, order: &SalesOrder) -> DomainResult<SalesOrder> {
        let row = sqlx::query_as::<_, SalesOrderRow>(
            r#"
            INSERT INTO sales_orders (id, order_number, quote_id, client_id, date, delivery_date, subject, subtotal, tax, total_amount, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, order_number, quote_id, client_id, date, delivery_date, subject, subtotal, tax, total_amount, status, created_at
            "#,
        )
        .bind(order.id)
        .bind(&order.order_number)
        .bind(order.quote_id)
        .bind(order.client_id)
        .bind(order.date)
        .bind(order.delivery_date)
        .bind(&order.subject)
        .bind(order.subtotal)
        .bind(order.tax)
        .bind(order.total_amount)
        .bind(&order.status)
        .bind(order.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_sales_shipments(&self) -> DomainResult<Vec<SalesShipment>> {
        let rows = sqlx::query_as::<_, SalesShipmentRow>(
            r#"
            SELECT id, shipment_number, sales_order_id, client_id, warehouse_id, date, courier_name, tracking_number, status, created_at
            FROM sales_shipments
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn get_sales_shipment(&self, id: Uuid) -> DomainResult<Option<SalesShipment>> {
        let row = sqlx::query_as::<_, SalesShipmentRow>(
            r#"
            SELECT id, shipment_number, sales_order_id, client_id, warehouse_id, date, courier_name, tracking_number, status, created_at
            FROM sales_shipments
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.map(Into::into))
    }

    pub async fn create_sales_shipment(
        &self,
        shipment: &SalesShipment,
        items: &[SalesShipmentItem],
    ) -> DomainResult<SalesShipment> {
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let row = sqlx::query_as::<_, SalesShipmentRow>(
            r#"
            INSERT INTO sales_shipments (id, shipment_number, sales_order_id, client_id, warehouse_id, date, courier_name, tracking_number, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, shipment_number, sales_order_id, client_id, warehouse_id, date, courier_name, tracking_number, status, created_at
            "#,
        )
        .bind(shipment.id)
        .bind(&shipment.shipment_number)
        .bind(shipment.sales_order_id)
        .bind(shipment.client_id)
        .bind(shipment.warehouse_id)
        .bind(shipment.date)
        .bind(&shipment.courier_name)
        .bind(&shipment.tracking_number)
        .bind(&shipment.status)
        .bind(shipment.created_at)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        for item in items {
            sqlx::query(
                r#"
                INSERT INTO sales_shipment_items (id, shipment_id, order_item_id, description, quantity_shipped, item_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
            )
            .bind(item.id)
            .bind(item.shipment_id)
            .bind(item.order_item_id)
            .bind(&item.description)
            .bind(item.quantity_shipped)
            .bind(item.item_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        }

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn update_sales_shipment_status(&self, id: Uuid, status: &str) -> DomainResult<()> {
        sqlx::query("UPDATE sales_shipments SET status = $2, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .bind(status)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn get_sales_shipment_items(
        &self,
        shipment_id: Uuid,
    ) -> DomainResult<Vec<SalesShipmentItem>> {
        let rows = sqlx::query_as::<_, SalesShipmentItemRow>(
            r#"
            SELECT id, shipment_id, order_item_id, description, quantity_shipped, item_id
            FROM sales_shipment_items
            WHERE shipment_id = $1
            "#,
        )
        .bind(shipment_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn list_purchase_quotes(&self) -> DomainResult<Vec<PurchaseQuote>> {
        let rows = sqlx::query_as::<_, PurchaseQuoteRow>(
            r#"
            SELECT id, quote_number, vendor_id, date, expiry_date, subject, subtotal, tax, total_amount, status, created_at
            FROM purchase_quotes
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_purchase_quote(
        &self,
        quote: &PurchaseQuote,
    ) -> DomainResult<PurchaseQuote> {
        let row = sqlx::query_as::<_, PurchaseQuoteRow>(
            r#"
            INSERT INTO purchase_quotes (id, quote_number, vendor_id, date, expiry_date, subject, subtotal, tax, total_amount, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, quote_number, vendor_id, date, expiry_date, subject, subtotal, tax, total_amount, status, created_at
            "#,
        )
        .bind(quote.id)
        .bind(&quote.quote_number)
        .bind(quote.vendor_id)
        .bind(quote.date)
        .bind(quote.expiry_date)
        .bind(&quote.subject)
        .bind(quote.subtotal)
        .bind(quote.tax)
        .bind(quote.total_amount)
        .bind(&quote.status)
        .bind(quote.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_purchase_orders(&self) -> DomainResult<Vec<PurchaseOrder>> {
        let rows = sqlx::query_as::<_, PurchaseOrderRow>(
            r#"
            SELECT id, order_number, purchase_quote_id, vendor_id, date, delivery_date, subject, subtotal, tax, total_amount, status, budget_type, created_at
            FROM purchase_orders
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_purchase_order(
        &self,
        order: &PurchaseOrder,
    ) -> DomainResult<PurchaseOrder> {
        let row = sqlx::query_as::<_, PurchaseOrderRow>(
            r#"
            INSERT INTO purchase_orders (id, order_number, purchase_quote_id, vendor_id, date, delivery_date, subject, subtotal, tax, total_amount, status, budget_type, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, order_number, purchase_quote_id, vendor_id, date, delivery_date, subject, subtotal, tax, total_amount, status, budget_type, created_at
            "#,
        )
        .bind(order.id)
        .bind(&order.order_number)
        .bind(order.purchase_quote_id)
        .bind(order.vendor_id)
        .bind(order.date)
        .bind(order.delivery_date)
        .bind(&order.subject)
        .bind(order.subtotal)
        .bind(order.tax)
        .bind(order.total_amount)
        .bind(&order.status)
        .bind(&order.budget_type)
        .bind(order.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_purchase_shipments(&self) -> DomainResult<Vec<PurchaseShipment>> {
        let rows = sqlx::query_as::<_, PurchaseShipmentRow>(
            r#"
            SELECT id, shipment_number, purchase_order_id, vendor_id, date, courier_name, tracking_number, status, created_at
            FROM purchase_shipments
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_purchase_shipment(
        &self,
        shipment: &PurchaseShipment,
    ) -> DomainResult<PurchaseShipment> {
        let row = sqlx::query_as::<_, PurchaseShipmentRow>(
            r#"
            INSERT INTO purchase_shipments (id, shipment_number, purchase_order_id, vendor_id, date, courier_name, tracking_number, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, shipment_number, purchase_order_id, vendor_id, date, courier_name, tracking_number, status, created_at
            "#,
        )
        .bind(shipment.id)
        .bind(&shipment.shipment_number)
        .bind(shipment.purchase_order_id)
        .bind(shipment.vendor_id)
        .bind(shipment.date)
        .bind(&shipment.courier_name)
        .bind(&shipment.tracking_number)
        .bind(&shipment.status)
        .bind(shipment.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(row.into())
    }

    pub async fn list_purchase_receipts(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::commercial_graph::PurchaseReceipt>> {
        let rows = sqlx::query_as::<_, PurchaseReceiptRow>(
            r#"
            SELECT id, company_id, receipt_number, purchase_order_id, vendor_id, warehouse_id, posting_date, status, notes, created_at, created_by
            FROM purchase_receipts
            WHERE company_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn get_purchase_receipt(
        &self,
        id: Uuid,
    ) -> DomainResult<Option<crate::domain::entities::commercial_graph::PurchaseReceipt>> {
        let row = sqlx::query_as::<_, PurchaseReceiptRow>(
            r#"
            SELECT id, company_id, receipt_number, purchase_order_id, vendor_id, warehouse_id, posting_date, status, notes, created_at, created_by
            FROM purchase_receipts
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(row.map(Into::into))
    }

    pub async fn create_purchase_receipt(
        &self,
        receipt: &crate::domain::entities::commercial_graph::PurchaseReceipt,
        items: &[crate::domain::entities::commercial_graph::PurchaseReceiptItem],
    ) -> DomainResult<crate::domain::entities::commercial_graph::PurchaseReceipt> {
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO purchase_receipts (id, company_id, receipt_number, purchase_order_id, vendor_id, warehouse_id, posting_date, status, notes, created_at, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
        )
        .bind(receipt.id)
        .bind(receipt.company_id)
        .bind(&receipt.receipt_number)
        .bind(receipt.purchase_order_id)
        .bind(receipt.vendor_id)
        .bind(receipt.warehouse_id)
        .bind(receipt.posting_date)
        .bind(&receipt.status)
        .bind(&receipt.notes)
        .bind(receipt.created_at)
        .bind(receipt.created_by)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        for item in items {
            sqlx::query(
                r#"
                INSERT INTO purchase_receipt_items (id, receipt_id, item_id, qty_received, unit_cost, total_amount, po_line_id, batch_no, serial_no)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                "#,
            )
            .bind(item.id)
            .bind(item.receipt_id)
            .bind(item.item_id)
            .bind(item.qty_received)
            .bind(item.unit_cost)
            .bind(item.total_amount)
            .bind(item.po_line_id)
            .bind(&item.batch_no)
            .bind(&item.serial_no)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        }

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(receipt.clone())
    }

    pub async fn update_purchase_receipt_status(&self, id: Uuid, status: &str) -> DomainResult<()> {
        sqlx::query("UPDATE purchase_receipts SET status = $2 WHERE id = $1")
            .bind(id)
            .bind(status)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn get_purchase_receipt_items(
        &self,
        receipt_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::commercial_graph::PurchaseReceiptItem>> {
        let rows = sqlx::query_as::<_, PurchaseReceiptItemRow>(
            r#"
            SELECT id, receipt_id, item_id, qty_received, unit_cost, total_amount, po_line_id, batch_no, serial_no
            FROM purchase_receipt_items
            WHERE receipt_id = $1
            "#,
        )
        .bind(receipt_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_commercial_document_link(
        &self,
        company_id: Option<Uuid>,
        source_type: &str,
        source_id: Uuid,
        target_type: &str,
        target_id: Uuid,
        created_by: Option<Uuid>,
    ) -> DomainResult<crate::domain::entities::commercial_graph::CommercialDocumentLink> {
        let id = Uuid::new_v4();
        let created_at = Utc::now();
        sqlx::query(
            r#"
            INSERT INTO commercial_document_links (id, company_id, source_type, source_id, target_type, target_id, created_at, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (source_type, source_id, target_type, target_id) DO NOTHING
            "#,
        )
        .bind(id)
        .bind(company_id)
        .bind(source_type)
        .bind(source_id)
        .bind(target_type)
        .bind(target_id)
        .bind(created_at)
        .bind(created_by)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(
            crate::domain::entities::commercial_graph::CommercialDocumentLink {
                id,
                source_type: source_type.to_string(),
                source_id,
                target_type: target_type.to_string(),
                target_id,
                created_at,
            },
        )
    }

    pub async fn get_commercial_document_links(
        &self,
        source_type: &str,
        source_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::commercial_graph::CommercialDocumentLink>> {
        #[derive(sqlx::FromRow)]
        struct LinkRow {
            id: Uuid,
            source_type: String,
            source_id: Uuid,
            target_type: String,
            target_id: Uuid,
            created_at: DateTime<Utc>,
        }

        let rows = sqlx::query_as::<_, LinkRow>(
            r#"
            SELECT id, source_type, source_id, target_type, target_id, created_at
            FROM commercial_document_links
            WHERE source_type = $1 AND source_id = $2
            ORDER BY created_at ASC
            "#,
        )
        .bind(source_type)
        .bind(source_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows
            .into_iter()
            .map(
                |r| crate::domain::entities::commercial_graph::CommercialDocumentLink {
                    id: r.id,
                    source_type: r.source_type,
                    source_id: r.source_id,
                    target_type: r.target_type,
                    target_id: r.target_id,
                    created_at: r.created_at,
                },
            )
            .collect())
    }
    pub async fn create_payment_allocation(
        &self,
        allocation: &crate::domain::entities::commercial_graph::PaymentAllocation,
    ) -> DomainResult<crate::domain::entities::commercial_graph::PaymentAllocation> {
        #[derive(sqlx::FromRow)]
        #[allow(dead_code)]
        struct AllocationRow {
            id: Uuid,
            company_id: Uuid,
            payment_id: Uuid,
            invoice_id: Uuid,
            allocated_amount: Decimal,
            allocated_at: DateTime<Utc>,
            created_by: Option<Uuid>,
            created_at: DateTime<Utc>,
        }

        let row = sqlx::query_as::<_, AllocationRow>(
            r#"
            INSERT INTO public.payment_allocations (
                id, company_id, payment_id, invoice_id, allocated_amount, allocated_at, created_by, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, company_id, payment_id, invoice_id, allocated_amount, allocated_at, created_by, created_at
            "#,
        )
        .bind(allocation.id)
        .bind(allocation.company_id)
        .bind(allocation.payment_entry_id)
        .bind(allocation.invoice_id)
        .bind(allocation.allocated_amount)
        .bind(allocation.created_at)
        .bind(allocation.created_by)
        .bind(allocation.created_at)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(
            crate::domain::entities::commercial_graph::PaymentAllocation {
                id: row.id,
                company_id: row.company_id,
                payment_entry_id: row.payment_id,
                invoice_type: allocation.invoice_type.clone(),
                invoice_id: row.invoice_id,
                allocated_amount: row.allocated_amount,
                created_by: row.created_by,
                created_at: row.created_at,
            },
        )
    }

    pub async fn list_payment_allocations_for_invoice(
        &self,
        invoice_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::commercial_graph::PaymentAllocation>> {
        #[derive(sqlx::FromRow)]
        #[allow(dead_code)]
        struct AllocationRow {
            id: Uuid,
            company_id: Uuid,
            payment_id: Uuid,
            invoice_id: Uuid,
            allocated_amount: Decimal,
            allocated_at: DateTime<Utc>,
            created_by: Option<Uuid>,
            created_at: DateTime<Utc>,
        }

        let rows = sqlx::query_as::<_, AllocationRow>(
            r#"
            SELECT id, company_id, payment_id, invoice_id, allocated_amount, allocated_at, created_by, created_at
            FROM public.payment_allocations
            WHERE invoice_id = $1
            ORDER BY allocated_at ASC
            "#,
        )
        .bind(invoice_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows
            .into_iter()
            .map(
                |r| crate::domain::entities::commercial_graph::PaymentAllocation {
                    id: r.id,
                    company_id: r.company_id,
                    payment_entry_id: r.payment_id,
                    invoice_type: "INVOICE".to_string(),
                    invoice_id: r.invoice_id,
                    allocated_amount: r.allocated_amount,
                    created_by: r.created_by,
                    created_at: r.created_at,
                },
            )
            .collect())
    }

    // --- Budget Management queries (QACC-010) ---

    pub async fn list_budgets(&self, company_id: Uuid) -> DomainResult<Vec<Budget>> {
        #[derive(sqlx::FromRow)]
        struct BudgetRow {
            id: Uuid,
            company_id: Option<Uuid>,
            cost_center_id: Option<Uuid>,
            fiscal_year: String,
            monthly_distribution: Option<String>,
            action_if_accumulated_monthly_budget_exceeded: Option<String>,
            action_if_annual_budget_exceeded: Option<String>,
            created_at: DateTime<Utc>,
        }

        let rows = sqlx::query_as::<_, BudgetRow>(
            r#"
            SELECT id, company_id, cost_center_id, fiscal_year, monthly_distribution,
                   action_if_accumulated_monthly_budget_exceeded, action_if_annual_budget_exceeded, created_at
            FROM budgets
            WHERE company_id = $1
            ORDER BY fiscal_year DESC, created_at DESC
            "#,
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows
            .into_iter()
            .map(|r| Budget {
                id: r.id,
                company_id: r.company_id,
                cost_center_id: r.cost_center_id,
                fiscal_year: r.fiscal_year,
                monthly_distribution: r.monthly_distribution,
                action_if_accumulated_monthly_budget_exceeded: r
                    .action_if_accumulated_monthly_budget_exceeded,
                action_if_annual_budget_exceeded: r.action_if_annual_budget_exceeded,
                created_at: r.created_at,
            })
            .collect())
    }

    pub async fn create_budget_with_items(
        &self,
        budget: &Budget,
        items: &[CreateBudgetAccountItem],
    ) -> DomainResult<Budget> {
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO budgets (id, company_id, cost_center_id, fiscal_year, monthly_distribution,
                                action_if_accumulated_monthly_budget_exceeded, action_if_annual_budget_exceeded, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(budget.id)
        .bind(budget.company_id)
        .bind(budget.cost_center_id)
        .bind(&budget.fiscal_year)
        .bind(&budget.monthly_distribution)
        .bind(&budget.action_if_accumulated_monthly_budget_exceeded)
        .bind(&budget.action_if_annual_budget_exceeded)
        .bind(budget.created_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        for item in items {
            sqlx::query(
                r#"
                INSERT INTO budget_accounts (id, budget_id, account_id, budget_amount, created_at)
                VALUES ($1, $2, $3, $4, $5)
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(budget.id)
            .bind(item.account_id)
            .bind(item.budget_amount)
            .bind(budget.created_at)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        }

        tx.commit()
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(budget.clone())
    }

    pub async fn get_budget_variance_report(
        &self,
        company_id: Uuid,
        fiscal_year: Option<&str>,
    ) -> DomainResult<Vec<BudgetVarianceReport>> {
        #[derive(sqlx::FromRow)]
        struct VarianceRow {
            budget_id: Uuid,
            cost_center_name: Option<String>,
            fiscal_year: String,
            account_id: Option<Uuid>,
            account_code: Option<String>,
            account_name: Option<String>,
            budget_amount: Decimal,
            actual_spent: Decimal,
        }

        let rows = sqlx::query_as::<_, VarianceRow>(
            r#"
            SELECT 
                b.id AS budget_id,
                cc.name AS cost_center_name,
                b.fiscal_year,
                ba.account_id,
                coa.code AS account_code,
                coa.name AS account_name,
                COALESCE(ba.budget_amount, 0.00) AS budget_amount,
                COALESCE(SUM(gl.debit - gl.credit), 0.00) AS actual_spent
            FROM budgets b
            LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
            JOIN budget_accounts ba ON ba.budget_id = b.id
            LEFT JOIN chart_of_accounts coa ON coa.id = ba.account_id
            LEFT JOIN gl_entries gl ON gl.account_id = ba.account_id 
                AND gl.company_id = b.company_id
                AND ($2::text IS NULL OR TO_CHAR(gl.posting_date, 'YYYY') = $2)
            WHERE b.company_id = $1
                AND ($2::text IS NULL OR b.fiscal_year = $2)
            GROUP BY b.id, cc.name, b.fiscal_year, ba.account_id, coa.code, coa.name, ba.budget_amount
            ORDER BY b.fiscal_year DESC, coa.code ASC
            "#,
        )
        .bind(company_id)
        .bind(fiscal_year)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let report = rows
            .into_iter()
            .map(|r| {
                let budget_amt = r.budget_amount;
                let actual = r.actual_spent;
                let variance = budget_amt - actual;
                let util_pct = if budget_amt > Decimal::ZERO {
                    ((actual / budget_amt) * Decimal::from(100)).round_dp(2)
                } else {
                    Decimal::ZERO
                };
                let status = if actual > budget_amt {
                    "Overbudget".to_string()
                } else {
                    "On Track".to_string()
                };

                BudgetVarianceReport {
                    budget_id: r.budget_id,
                    cost_center_name: r.cost_center_name.unwrap_or_else(|| "General".to_string()),
                    fiscal_year: r.fiscal_year,
                    account_id: r.account_id,
                    account_code: r.account_code.unwrap_or_default(),
                    account_name: r
                        .account_name
                        .unwrap_or_else(|| "Unassigned Account".to_string()),
                    budget_amount: budget_amt,
                    actual_spent: actual,
                    variance,
                    utilization_percentage: util_pct,
                    status,
                }
            })
            .collect();

        Ok(report)
    }

    pub async fn list_tax_invoices(
        &self,
        company_id: Uuid,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
    ) -> DomainResult<Vec<crate::domain::entities::efaktur::TaxInvoiceRecord>> {
        let mut query = String::from(
            "SELECT id, company_id, sales_invoice_id, tax_invoice_number, npwp_buyer, name_buyer,
                    tax_base, vat_amount, vat_rate, effective_date, status, created_at
             FROM id_tax_invoices
             WHERE company_id = $1",
        );
        if start_date.is_some() {
            query.push_str(" AND effective_date >= $2");
        }
        if end_date.is_some() {
            if start_date.is_some() {
                query.push_str(" AND effective_date <= $3");
            } else {
                query.push_str(" AND effective_date <= $2");
            }
        }
        query.push_str(" ORDER BY effective_date DESC, tax_invoice_number DESC");

        let mut q = sqlx::query_as::<_, TaxInvoiceRow>(&query).bind(company_id);
        if let Some(sd) = start_date {
            q = q.bind(sd);
        }
        if let Some(ed) = end_date {
            q = q.bind(ed);
        }

        let rows = q
            .fetch_all(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn create_tax_invoice(
        &self,
        record: &crate::domain::entities::efaktur::TaxInvoiceRecord,
    ) -> DomainResult<crate::domain::entities::efaktur::TaxInvoiceRecord> {
        let sql = "INSERT INTO id_tax_invoices (
                id, company_id, sales_invoice_id, tax_invoice_number, npwp_buyer, name_buyer,
                tax_base, vat_amount, vat_rate, effective_date, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, company_id, sales_invoice_id, tax_invoice_number, npwp_buyer, name_buyer,
                      tax_base, vat_amount, vat_rate, effective_date, status, created_at";

        let created: TaxInvoiceRow = sqlx::query_as::<_, TaxInvoiceRow>(sql)
            .bind(record.id)
            .bind(record.company_id)
            .bind(record.sales_invoice_id)
            .bind(&record.tax_invoice_number)
            .bind(&record.npwp_buyer)
            .bind(&record.name_buyer)
            .bind(record.tax_base)
            .bind(record.vat_amount)
            .bind(record.vat_rate)
            .bind(record.effective_date)
            .bind(&record.status)
            .bind(record.created_at)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(created.into())
    }

    pub async fn update_sales_invoice_status(
        &self,
        id: Uuid,
        status: &str,
    ) -> DomainResult<()> {
        sqlx::query("UPDATE sales_invoices SET status = $1, updated_at = NOW() WHERE id = $2")
            .bind(status)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn update_purchase_bill_status(
        &self,
        id: Uuid,
        status: &str,
    ) -> DomainResult<()> {
        sqlx::query("UPDATE purchase_bills SET status = $1 WHERE id = $2")
            .bind(status)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    pub async fn create_bank_statement(
        &self,
        stmt: &crate::domain::entities::BankStatement,
        lines: &[crate::domain::entities::BankStatementLine],
    ) -> DomainResult<crate::domain::entities::BankStatement> {
        let mut tx = self.pool.begin().await.map_err(|e| DomainError::Database(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO bank_statements (
                id, company_id, account_id, statement_date, reference_number,
                opening_balance, closing_balance, status, uploaded_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#
        )
        .bind(stmt.id)
        .bind(stmt.company_id)
        .bind(stmt.account_id)
        .bind(stmt.statement_date)
        .bind(&stmt.reference_number)
        .bind(stmt.opening_balance)
        .bind(stmt.closing_balance)
        .bind(&stmt.status)
        .bind(stmt.uploaded_by)
        .bind(stmt.created_at)
        .bind(stmt.updated_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        for line in lines {
            sqlx::query(
                r#"
                INSERT INTO bank_statement_lines (
                    id, statement_id, company_id, transaction_date, description,
                    reference_number, amount, is_reconciled, matched_gl_entry_id, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                "#
            )
            .bind(line.id)
            .bind(line.statement_id)
            .bind(line.company_id)
            .bind(line.transaction_date)
            .bind(&line.description)
            .bind(&line.reference_number)
            .bind(line.amount)
            .bind(line.is_reconciled)
            .bind(line.matched_gl_entry_id)
            .bind(line.created_at)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
        }

        tx.commit().await.map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(stmt.clone())
    }

    pub async fn list_bank_statements(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::BankStatement>> {
        let rows = sqlx::query_as::<_, BankStatementRow>(
            r#"
            SELECT id, company_id, account_id, statement_date, reference_number,
                   opening_balance, closing_balance, status, uploaded_by, created_at, updated_at
            FROM bank_statements
            WHERE company_id = $1
            ORDER BY statement_date DESC, created_at DESC
            "#
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn get_bank_statement(
        &self,
        id: Uuid,
    ) -> DomainResult<Option<(crate::domain::entities::BankStatement, Vec<crate::domain::entities::BankStatementLine>)>> {
        let stmt_row = sqlx::query_as::<_, BankStatementRow>(
            r#"
            SELECT id, company_id, account_id, statement_date, reference_number,
                   opening_balance, closing_balance, status, uploaded_by, created_at, updated_at
            FROM bank_statements
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let Some(stmt) = stmt_row else {
            return Ok(None);
        };

        let line_rows = sqlx::query_as::<_, BankStatementLineRow>(
            r#"
            SELECT id, statement_id, company_id, transaction_date, description,
                   reference_number, amount, is_reconciled, matched_gl_entry_id, created_at
            FROM bank_statement_lines
            WHERE statement_id = $1
            ORDER BY transaction_date ASC, created_at ASC
            "#
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(Some((stmt.into(), line_rows.into_iter().map(Into::into).collect())))
    }

    pub async fn auto_match_bank_statement_lines(
        &self,
        statement_id: Uuid,
    ) -> DomainResult<crate::domain::entities::AutoMatchResult> {
        let (stmt, lines) = self.get_bank_statement(statement_id).await?
            .ok_or_else(|| DomainError::not_found("BankStatement", statement_id))?;

        let mut matched_count = 0;

        for line in lines {
            if line.is_reconciled || line.matched_gl_entry_id.is_some() {
                continue;
            }

            // Find matching candidate in gl_entries
            // Line amount > 0 means money in (Cash Debit)
            // Line amount < 0 means money out (Cash Credit)
            let gl_match: Option<(Uuid,)> = if line.amount > rust_decimal::Decimal::ZERO {
                sqlx::query_as(
                    r#"
                    SELECT id FROM gl_entries
                    WHERE account_id = $1
                      AND debit = $2
                      AND posting_date BETWEEN ($3::date - INTERVAL '5 days') AND ($3::date + INTERVAL '5 days')
                      AND is_cancelled = false
                    ORDER BY ABS(EXTRACT(DAY FROM (posting_date::timestamp - $3::timestamp))) ASC
                    LIMIT 1
                    "#
                )
                .bind(stmt.account_id)
                .bind(line.amount)
                .bind(line.transaction_date)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?
            } else {
                sqlx::query_as(
                    r#"
                    SELECT id FROM gl_entries
                    WHERE account_id = $1
                      AND credit = $2
                      AND posting_date BETWEEN ($3::date - INTERVAL '5 days') AND ($3::date + INTERVAL '5 days')
                      AND is_cancelled = false
                    ORDER BY ABS(EXTRACT(DAY FROM (posting_date::timestamp - $3::timestamp))) ASC
                    LIMIT 1
                    "#
                )
                .bind(stmt.account_id)
                .bind(line.amount.abs())
                .bind(line.transaction_date)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?
            };

            if let Some((gl_id,)) = gl_match {
                sqlx::query("UPDATE bank_statement_lines SET matched_gl_entry_id = $1, is_reconciled = true WHERE id = $2")
                    .bind(gl_id)
                    .bind(line.id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| DomainError::Database(e.to_string()))?;
                matched_count += 1;
            }
        }

        let total_lines = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM bank_statement_lines WHERE statement_id = $1")
            .bind(statement_id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))? as usize;

        Ok(crate::domain::entities::AutoMatchResult {
            matched_count,
            total_lines,
        })
    }

    pub async fn finalize_bank_reconciliation(
        &self,
        statement_id: Uuid,
        reconciled_by: Uuid,
        as_of_date: chrono::NaiveDate,
    ) -> DomainResult<crate::domain::entities::BankReconciliation> {
        let (stmt, _lines) = self.get_bank_statement(statement_id).await?
            .ok_or_else(|| DomainError::not_found("BankStatement", statement_id))?;

        // Calculate GL ending balance for that account as of date
        let gl_balance: rust_decimal::Decimal = sqlx::query_scalar(
            r#"
            SELECT COALESCE(SUM(debit - credit), 0)
            FROM gl_entries
            WHERE account_id = $1
              AND posting_date <= $2
              AND is_cancelled = false
            "#
        )
        .bind(stmt.account_id)
        .bind(as_of_date)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let diff = stmt.closing_balance - gl_balance;

        let rec = crate::domain::entities::BankReconciliation {
            id: Uuid::new_v4(),
            company_id: stmt.company_id,
            account_id: stmt.account_id,
            statement_id,
            as_of_date,
            statement_ending_balance: stmt.closing_balance,
            gl_ending_balance: gl_balance,
            unreconciled_difference: diff,
            status: "COMPLETED".to_string(),
            reconciled_by,
            reconciled_at: chrono::Utc::now(),
        };

        let mut tx = self.pool.begin().await.map_err(|e| DomainError::Database(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO bank_reconciliations (
                id, company_id, account_id, statement_id, as_of_date,
                statement_ending_balance, gl_ending_balance, unreconciled_difference,
                status, reconciled_by, reconciled_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#
        )
        .bind(rec.id)
        .bind(rec.company_id)
        .bind(rec.account_id)
        .bind(rec.statement_id)
        .bind(rec.as_of_date)
        .bind(rec.statement_ending_balance)
        .bind(rec.gl_ending_balance)
        .bind(rec.unreconciled_difference)
        .bind(&rec.status)
        .bind(rec.reconciled_by)
        .bind(rec.reconciled_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        sqlx::query("UPDATE bank_statements SET status = 'RECONCILED', updated_at = NOW() WHERE id = $1")
            .bind(statement_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        sqlx::query("UPDATE bank_statement_lines SET is_reconciled = true WHERE statement_id = $1")
            .bind(statement_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        tx.commit().await.map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rec)
    }

    pub async fn list_bank_reconciliations(
        &self,
        company_id: Uuid,
    ) -> DomainResult<Vec<crate::domain::entities::BankReconciliation>> {
        let rows = sqlx::query_as::<_, BankReconciliationRow>(
            r#"
            SELECT id, company_id, account_id, statement_id, as_of_date,
                   statement_ending_balance, gl_ending_balance, unreconciled_difference,
                   status, reconciled_by, reconciled_at
            FROM bank_reconciliations
            WHERE company_id = $1
            ORDER BY as_of_date DESC, reconciled_at DESC
            "#
        )
        .bind(company_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

}

#[derive(Debug, sqlx::FromRow)]
struct BankStatementRow {
    id: Uuid,
    company_id: Uuid,
    account_id: Uuid,
    statement_date: chrono::NaiveDate,
    reference_number: String,
    opening_balance: Decimal,
    closing_balance: Decimal,
    status: String,
    uploaded_by: Uuid,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<BankStatementRow> for crate::domain::entities::BankStatement {
    fn from(r: BankStatementRow) -> Self {
        Self {
            id: r.id,
            company_id: r.company_id,
            account_id: r.account_id,
            statement_date: r.statement_date,
            reference_number: r.reference_number,
            opening_balance: r.opening_balance,
            closing_balance: r.closing_balance,
            status: r.status,
            uploaded_by: r.uploaded_by,
            created_at: r.created_at,
            updated_at: r.updated_at,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct BankStatementLineRow {
    id: Uuid,
    statement_id: Uuid,
    company_id: Uuid,
    transaction_date: chrono::NaiveDate,
    description: String,
    reference_number: Option<String>,
    amount: Decimal,
    is_reconciled: bool,
    matched_gl_entry_id: Option<Uuid>,
    created_at: DateTime<Utc>,
}

impl From<BankStatementLineRow> for crate::domain::entities::BankStatementLine {
    fn from(r: BankStatementLineRow) -> Self {
        Self {
            id: r.id,
            statement_id: r.statement_id,
            company_id: r.company_id,
            transaction_date: r.transaction_date,
            description: r.description,
            reference_number: r.reference_number,
            amount: r.amount,
            is_reconciled: r.is_reconciled,
            matched_gl_entry_id: r.matched_gl_entry_id,
            created_at: r.created_at,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct BankReconciliationRow {
    id: Uuid,
    company_id: Uuid,
    account_id: Uuid,
    statement_id: Uuid,
    as_of_date: chrono::NaiveDate,
    statement_ending_balance: Decimal,
    gl_ending_balance: Decimal,
    unreconciled_difference: Decimal,
    status: String,
    reconciled_by: Uuid,
    reconciled_at: DateTime<Utc>,
}

impl From<BankReconciliationRow> for crate::domain::entities::BankReconciliation {
    fn from(r: BankReconciliationRow) -> Self {
        Self {
            id: r.id,
            company_id: r.company_id,
            account_id: r.account_id,
            statement_id: r.statement_id,
            as_of_date: r.as_of_date,
            statement_ending_balance: r.statement_ending_balance,
            gl_ending_balance: r.gl_ending_balance,
            unreconciled_difference: r.unreconciled_difference,
            status: r.status,
            reconciled_by: r.reconciled_by,
            reconciled_at: r.reconciled_at,
        }
    }
}

