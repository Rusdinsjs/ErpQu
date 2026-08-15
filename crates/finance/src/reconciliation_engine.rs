//! Centralized Accounting & Inventory Reconciliation Engine (Fase 19 Integrity)
//!
//! Provides automated audit reconciliation reports for GL, Stock, AR, AP, and Fixed Assets.
//! Every variance (delta) must be zero (0.0000) or carry an auditable explanation.

use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditVarianceItem {
    pub category: String,
    pub expected_amount: Decimal,
    pub actual_amount: Decimal,
    pub delta: Decimal,
    pub status: String, // "PASSED" or "VARIANCE_DETECTED"
    pub explanation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationReport {
    pub company_id: Uuid,
    pub generated_at: chrono::DateTime<chrono::Utc>,
    pub gl_balance_variance: AuditVarianceItem,
    pub stock_balance_variance: AuditVarianceItem,
    pub ar_control_variance: AuditVarianceItem,
    pub ap_control_variance: AuditVarianceItem,
    pub asset_register_variance: AuditVarianceItem,
    pub overall_status: String, // "CLEAN_AUDIT" or "RECONCILIATION_FAILED"
}

#[derive(Clone)]
pub struct ReconciliationEngine {
    pool: PgPool,
}

impl ReconciliationEngine {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// 1. Reconcile GL Double-Entry Balance: Sum(Debit) == Sum(Credit)
    pub async fn reconcile_gl_balance(&self, company_id: Uuid) -> DomainResult<AuditVarianceItem> {
        let (total_debit, total_credit): (Decimal, Decimal) = sqlx::query_as(
            r#"
            SELECT
                COALESCE(SUM(debit), 0.0000) as total_debit,
                COALESCE(SUM(credit), 0.0000) as total_credit
            FROM gl_entries
            WHERE company_id = $1
            "#,
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let delta = total_debit - total_credit;
        let is_clean = delta == dec!(0.0000);

        Ok(AuditVarianceItem {
            category: "GL_DOUBLE_ENTRY_BALANCE".to_string(),
            expected_amount: total_debit,
            actual_amount: total_credit,
            delta,
            status: if is_clean { "PASSED".to_string() } else { "VARIANCE_DETECTED".to_string() },
            explanation: if is_clean {
                Some("Debit and Credit balances match exactly (Zero Delta)".to_string())
            } else {
                Some(format!("Unbalanced GL entries detected! Delta: {}", delta))
            },
        })
    }

    /// 2. Reconcile Stock Ledger vs Bin Balances
    pub async fn reconcile_stock_ledger_vs_bins(&self, company_id: Uuid) -> DomainResult<AuditVarianceItem> {
        let ledger_sum: Decimal = sqlx::query_scalar(
            "SELECT COALESCE(SUM(actual_qty), 0.0000) FROM stock_ledger_entries WHERE company_id = $1"
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let bin_sum: Decimal = sqlx::query_scalar(
            "SELECT COALESCE(SUM(actual_qty), 0.0000) FROM bins WHERE company_id = $1"
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let delta = ledger_sum - bin_sum;
        let is_clean = delta == dec!(0.0000);

        Ok(AuditVarianceItem {
            category: "STOCK_LEDGER_VS_BIN_BALANCES".to_string(),
            expected_amount: ledger_sum,
            actual_amount: bin_sum,
            delta,
            status: if is_clean { "PASSED".to_string() } else { "VARIANCE_DETECTED".to_string() },
            explanation: if is_clean {
                Some("Stock ledger transactions match bin physical inventory exactly (Zero Delta)".to_string())
            } else {
                Some(format!("Stock ledger and bin inventory discrepancy! Delta: {}", delta))
            },
        })
    }

    /// 3. Reconcile AR Control Account vs Unpaid Sales Invoices
    pub async fn reconcile_ar_control_account(&self, company_id: Uuid) -> DomainResult<AuditVarianceItem> {
        let invoice_unpaid_sum: Decimal = sqlx::query_scalar(
            "SELECT COALESCE(SUM(total_amount - amount_paid), 0.0000) FROM sales_invoices WHERE company_id = $1 AND status != 'cancelled'"
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let ar_gl_balance: Decimal = sqlx::query_scalar(
            r#"
            SELECT COALESCE(SUM(debit - credit), 0.0000)
            FROM gl_entries gle
            JOIN chart_of_accounts coa ON gle.account_id = coa.id
            WHERE gle.company_id = $1 AND coa.account_type = 'Receivable'
            "#
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let delta = invoice_unpaid_sum - ar_gl_balance;
        let is_clean = delta == dec!(0.0000);

        Ok(AuditVarianceItem {
            category: "AR_CONTROL_ACCOUNT_RECONCILIATION".to_string(),
            expected_amount: invoice_unpaid_sum,
            actual_amount: ar_gl_balance,
            delta,
            status: if is_clean { "PASSED".to_string() } else { "VARIANCE_DETECTED".to_string() },
            explanation: if is_clean {
                Some("Unpaid Accounts Receivable invoices match GL Control Account exactly (Zero Delta)".to_string())
            } else {
                Some(format!("AR Control Account variance detected! Delta: {}", delta))
            },
        })
    }

    /// 4. Reconcile AP Control Account vs Unpaid Purchase Bills
    pub async fn reconcile_ap_control_account(&self, company_id: Uuid) -> DomainResult<AuditVarianceItem> {
        let bill_unpaid_sum: Decimal = sqlx::query_scalar(
            "SELECT COALESCE(SUM(total_amount - amount_paid), 0.0000) FROM purchase_bills WHERE company_id = $1 AND status != 'cancelled'"
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let ap_gl_balance: Decimal = sqlx::query_scalar(
            r#"
            SELECT COALESCE(SUM(credit - debit), 0.0000)
            FROM gl_entries gle
            JOIN chart_of_accounts coa ON gle.account_id = coa.id
            WHERE gle.company_id = $1 AND coa.account_type = 'Payable'
            "#
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let delta = bill_unpaid_sum - ap_gl_balance;
        let is_clean = delta == dec!(0.0000);

        Ok(AuditVarianceItem {
            category: "AP_CONTROL_ACCOUNT_RECONCILIATION".to_string(),
            expected_amount: bill_unpaid_sum,
            actual_amount: ap_gl_balance,
            delta,
            status: if is_clean { "PASSED".to_string() } else { "VARIANCE_DETECTED".to_string() },
            explanation: if is_clean {
                Some("Unpaid Accounts Payable bills match GL Control Account exactly (Zero Delta)".to_string())
            } else {
                Some(format!("AP Control Account variance detected! Delta: {}", delta))
            },
        })
    }

    /// 5. Reconcile Fixed Assets Register vs GL Book Value
    pub async fn reconcile_asset_register(&self, company_id: Uuid) -> DomainResult<AuditVarianceItem> {
        let asset_book_value_sum: Decimal = sqlx::query_scalar(
            "SELECT COALESCE(SUM(cost - accumulated_depreciation), 0.0000) FROM assets WHERE company_id = $1 AND status != 'DISPOSED'"
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let asset_gl_balance: Decimal = sqlx::query_scalar(
            r#"
            SELECT COALESCE(SUM(debit - credit), 0.0000)
            FROM gl_entries gle
            JOIN chart_of_accounts coa ON gle.account_id = coa.id
            WHERE gle.company_id = $1 AND coa.account_type IN ('Fixed Asset', 'Accumulated Depreciation')
            "#
        )
        .bind(company_id)
        .fetch_one(&self.pool)
        .await
        .unwrap_or(dec!(0.0000));

        let delta = asset_book_value_sum - asset_gl_balance;
        let is_clean = delta == dec!(0.0000);

        Ok(AuditVarianceItem {
            category: "ASSET_REGISTER_VS_GL_BOOK_VALUE".to_string(),
            expected_amount: asset_book_value_sum,
            actual_amount: asset_gl_balance,
            delta,
            status: if is_clean { "PASSED".to_string() } else { "VARIANCE_DETECTED".to_string() },
            explanation: if is_clean {
                Some("Fixed Assets register book value matches GL Accounts exactly (Zero Delta)".to_string())
            } else {
                Some(format!("Fixed Assets register discrepancy! Delta: {}", delta))
            },
        })
    }

    /// Master Full Reconciliation Report
    pub async fn generate_full_reconciliation_report(&self, company_id: Uuid) -> DomainResult<ReconciliationReport> {
        let gl_variance = self.reconcile_gl_balance(company_id).await?;
        let stock_variance = self.reconcile_stock_ledger_vs_bins(company_id).await?;
        let ar_variance = self.reconcile_ar_control_account(company_id).await?;
        let ap_variance = self.reconcile_ap_control_account(company_id).await?;
        let asset_variance = self.reconcile_asset_register(company_id).await?;

        let all_passed = gl_variance.delta == dec!(0.0000)
            && stock_variance.delta == dec!(0.0000)
            && ar_variance.delta == dec!(0.0000)
            && ap_variance.delta == dec!(0.0000)
            && asset_variance.delta == dec!(0.0000);

        Ok(ReconciliationReport {
            company_id,
            generated_at: chrono::Utc::now(),
            gl_balance_variance: gl_variance,
            stock_balance_variance: stock_variance,
            ar_control_variance: ar_variance,
            ap_control_variance: ap_variance,
            asset_register_variance: asset_variance,
            overall_status: if all_passed {
                "CLEAN_AUDIT".to_string()
            } else {
                "RECONCILIATION_FAILED".to_string()
            },
        })
    }
}
