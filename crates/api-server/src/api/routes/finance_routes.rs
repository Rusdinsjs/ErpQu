//! Finance & Accounting Router Module

use axum::{
    routing::{get, post, put},
    Router,
};

use crate::api::handlers::{
    budget_handler, exchange_rate_handler, finance_handler, finance_report_handler,
    journal_handler,
};
use crate::api::server::AppState;

pub fn finance_routes() -> Router<AppState> {
    Router::new()
        // Multi-Currency Exchange Rates (QACC-008)
        .route(
            "/exchange-rates",
            post(exchange_rate_handler::set_exchange_rate),
        )
        .route(
            "/exchange-rates/latest",
            get(exchange_rate_handler::get_latest_rate),
        )
        .route(
            "/exchange-rates/convert",
            post(exchange_rate_handler::convert_currency),
        )
        // Budgets & Variance (QACC-010)
        .route(
            "/budgets",
            get(budget_handler::list_budgets).post(budget_handler::create_budget),
        )
        .route(
            "/budgets/variance",
            get(budget_handler::get_budget_variance),
        )
        // Accounts & COA
        .route(
            "/accounts",
            get(finance_handler::list_accounts).post(finance_handler::create_account),
        )
        .route("/accounts/tree", get(finance_handler::list_accounts_tree))
        .route("/accounts/:id", put(finance_handler::update_account))
        // Financial Reports
        .route(
            "/reports/ledger/:account_id",
            get(finance_report_handler::get_general_ledger),
        )
        .route(
            "/reports/trial-balance",
            get(finance_report_handler::get_trial_balance),
        )
        .route(
            "/reports/balance-sheet",
            get(finance_report_handler::get_balance_sheet),
        )
        .route(
            "/reports/income-statement",
            get(finance_report_handler::get_income_statement),
        )
        // Journal Entries
        .route(
            "/journals",
            get(journal_handler::list_journals).post(journal_handler::create_journal),
        )
        .route("/journals/:id", get(journal_handler::get_journal_details))
        .route(
            "/journals/:id/submit",
            post(journal_handler::submit_journal),
        )
        .route(
            "/journals/:id/approve",
            post(journal_handler::approve_journal),
        )
        .route("/journals/:id/post", post(journal_handler::post_journal))
        .route(
            "/journals/:id/reverse",
            post(journal_handler::reverse_journal),
        )
        .route(
            "/journals/:id/cancel",
            post(journal_handler::cancel_journal),
        )
        // Sales Invoices, Quotes, Orders, Shipments
        .route(
            "/sales/invoices",
            get(finance_handler::list_sales_invoices).post(finance_handler::create_sales_invoice),
        )
        .route(
            "/sales/invoices/:id",
            get(finance_handler::get_sales_invoice)
                .put(finance_handler::update_sales_invoice)
                .delete(finance_handler::delete_sales_invoice),
        )
        .route(
            "/sales/quotes",
            get(finance_handler::list_sales_quotes).post(finance_handler::create_sales_quote),
        )
        .route(
            "/sales/orders",
            get(finance_handler::list_sales_orders).post(finance_handler::create_sales_order),
        )
        .route(
            "/sales/shipments",
            get(finance_handler::list_sales_shipments).post(finance_handler::create_sales_shipment),
        )
        .route(
            "/sales/shipments/:id/submit",
            post(finance_handler::submit_sales_shipment),
        )
        // Purchasing Receipts, Quotes, Orders, Bills
        .route(
            "/purchase/receipts/company/:company_id",
            get(finance_handler::list_purchase_receipts),
        )
        .route(
            "/purchase/receipts",
            post(finance_handler::create_purchase_receipt),
        )
        .route(
            "/purchase/receipts/:id",
            get(finance_handler::get_purchase_receipt),
        )
        .route(
            "/purchase/receipts/:id/submit",
            post(finance_handler::submit_purchase_receipt),
        )
        .route(
            "/purchase/quotes",
            get(finance_handler::list_purchase_quotes).post(finance_handler::create_purchase_quote),
        )
        .route(
            "/purchase/orders",
            get(finance_handler::list_purchase_orders).post(finance_handler::create_purchase_order),
        )
        .route(
            "/purchase/shipments",
            get(finance_handler::list_purchase_shipments)
                .post(finance_handler::create_purchase_shipment),
        )
        .route(
            "/purchase/bills",
            get(finance_handler::list_purchase_bills).post(finance_handler::create_purchase_bill),
        )
        .route(
            "/expenses",
            get(finance_handler::list_expenses).post(finance_handler::create_expense),
        )
        .route(
            "/cash-bank",
            get(finance_handler::list_cash_bank_transactions)
                .post(finance_handler::create_cash_bank_transaction),
        )
}
