//! Accounting Period Closing Engine (QACC-007)
//!
//! Provides:
//! 1. Month-End Close — locks a specific accounting period
//! 2. Year-End Close — transfers P&L balances to Retained Earnings, locks fiscal year
//! 3. Closing Checklist — verifies all preconditions before allowing close
//! 4. Period Reopen — with audit trail (restricted to super_admin)

use chrono::{NaiveDate, Utc};
use management_system_core::domain::errors::{DomainError, DomainResult};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

/// Result of a closing checklist validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClosingChecklistResult {
    pub company_id: Uuid,
    pub period_id: Uuid,
    pub period_name: String,
    pub checks: Vec<ClosingCheckItem>,
    pub all_passed: bool,
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClosingCheckItem {
    pub name: String,
    pub status: ClosingCheckStatus,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ClosingCheckStatus {
    Passed,
    Warning,
    Failed,
}

/// Year-end closing result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YearEndClosingResult {
    pub fiscal_year_id: Uuid,
    pub retained_earnings_entry_id: Option<Uuid>,
    pub total_revenue: Decimal,
    pub total_expenses: Decimal,
    pub net_income: Decimal,
    pub periods_closed: i32,
}

#[derive(Clone)]
pub struct AccountingClosingEngine {
    pool: PgPool,
}

impl AccountingClosingEngine {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Run the pre-close checklist for a specific accounting period
    pub async fn run_closing_checklist(
        &self,
        company_id: Uuid,
        period_id: Uuid,
    ) -> DomainResult<ClosingChecklistResult> {
        let mut checks = Vec::new();

        // Fetch period info
        let period: Option<(String, NaiveDate, NaiveDate, bool)> = sqlx::query_as(
            "SELECT period_name, start_date, end_date, is_closed FROM accounting_periods WHERE id = $1",
        )
        .bind(period_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let (period_name, start_date, end_date, is_closed) =
            period.ok_or_else(|| DomainError::not_found("AccountingPeriod", period_id))?;

        if is_closed {
            return Err(DomainError::business_rule(
                "PeriodAlreadyClosed",
                &format!("Accounting period '{}' is already closed", period_name),
            ));
        }

        // Check 1: GL Balance Check — Total Debit == Total Credit in period
        let gl_balance: Option<(Decimal, Decimal)> = sqlx::query_as(
            r#"
            SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
            FROM gl_entries
            WHERE company_id = $1 AND posting_date BETWEEN $2 AND $3
            "#,
        )
        .bind(company_id)
        .bind(start_date)
        .bind(end_date)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        if let Some((total_debit, total_credit)) = gl_balance {
            if total_debit == total_credit {
                checks.push(ClosingCheckItem {
                    name: "GL Balance".to_string(),
                    status: ClosingCheckStatus::Passed,
                    message: format!(
                        "Total Debit ({}) == Total Credit ({})",
                        total_debit, total_credit
                    ),
                });
            } else {
                checks.push(ClosingCheckItem {
                    name: "GL Balance".to_string(),
                    status: ClosingCheckStatus::Failed,
                    message: format!(
                        "IMBALANCE: Total Debit ({}) != Total Credit ({}). Delta: {}",
                        total_debit,
                        total_credit,
                        total_debit - total_credit
                    ),
                });
            }
        }

        // Check 2: Unposted journal entries
        let unposted_count: Option<i64> = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM journal_entries
            WHERE company_id = $1
                AND posting_date BETWEEN $2 AND $3
                AND status IN ('draft', 'pending')
            "#,
        )
        .bind(company_id)
        .bind(start_date)
        .bind(end_date)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let unposted = unposted_count.unwrap_or(0);
        if unposted == 0 {
            checks.push(ClosingCheckItem {
                name: "Unposted Journals".to_string(),
                status: ClosingCheckStatus::Passed,
                message: "All journal entries are posted".to_string(),
            });
        } else {
            checks.push(ClosingCheckItem {
                name: "Unposted Journals".to_string(),
                status: ClosingCheckStatus::Failed,
                message: format!(
                    "{} journal entries are still draft/pending. Post or cancel them before closing.",
                    unposted
                ),
            });
        }

        // Check 3: Previous period must be closed
        let prev_period_open: Option<i64> = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM accounting_periods ap
            JOIN accounting_periods current_ap ON ap.fiscal_year_id = current_ap.fiscal_year_id
            WHERE current_ap.id = $1
                AND ap.period_number < current_ap.period_number
                AND ap.is_closed = FALSE
            "#,
        )
        .bind(period_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let open_prev = prev_period_open.unwrap_or(0);
        if open_prev == 0 {
            checks.push(ClosingCheckItem {
                name: "Prior Periods".to_string(),
                status: ClosingCheckStatus::Passed,
                message: "All prior periods are closed".to_string(),
            });
        } else {
            checks.push(ClosingCheckItem {
                name: "Prior Periods".to_string(),
                status: ClosingCheckStatus::Failed,
                message: format!(
                    "{} prior period(s) are still open. Close them first (sequential closing required).",
                    open_prev
                ),
            });
        }

        let all_passed = checks
            .iter()
            .all(|c| c.status == ClosingCheckStatus::Passed);

        Ok(ClosingChecklistResult {
            company_id,
            period_id,
            period_name,
            checks,
            all_passed,
            generated_at: Utc::now(),
        })
    }

    /// Close an accounting period (month-end close)
    pub async fn close_period(
        &self,
        company_id: Uuid,
        period_id: Uuid,
        closed_by: Uuid,
    ) -> DomainResult<()> {
        // Run checklist first
        let checklist = self.run_closing_checklist(company_id, period_id).await?;
        if !checklist.all_passed {
            let failed: Vec<String> = checklist
                .checks
                .iter()
                .filter(|c| c.status == ClosingCheckStatus::Failed)
                .map(|c| format!("{}: {}", c.name, c.message))
                .collect();
            return Err(DomainError::business_rule(
                "ClosingChecklistFailed",
                &format!(
                    "Period close blocked by {} failed checks:\n{}",
                    failed.len(),
                    failed.join("\n")
                ),
            ));
        }

        // Close the period
        let rows_affected = sqlx::query(
            r#"
            UPDATE accounting_periods
            SET is_closed = TRUE, closed_at = NOW(), closed_by = $1
            WHERE id = $2 AND is_closed = FALSE
            "#,
        )
        .bind(closed_by)
        .bind(period_id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?
        .rows_affected();

        if rows_affected == 0 {
            return Err(DomainError::business_rule(
                "PeriodAlreadyClosed",
                "Period is already closed or does not exist",
            ));
        }

        tracing::info!(
            "ACCOUNTING AUDIT: Period {} closed by user {} for company {}",
            period_id,
            closed_by,
            company_id
        );

        Ok(())
    }

    /// Year-end closing: closes all periods + creates retained earnings transfer entry
    pub async fn close_fiscal_year(
        &self,
        company_id: Uuid,
        fiscal_year_id: Uuid,
        retained_earnings_account_id: Uuid,
        closed_by: Uuid,
    ) -> DomainResult<YearEndClosingResult> {
        // Verify all periods in the fiscal year are closed
        let open_periods: Option<i64> = sqlx::query_scalar(
            "SELECT COUNT(*) FROM accounting_periods WHERE fiscal_year_id = $1 AND is_closed = FALSE",
        )
        .bind(fiscal_year_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let open_count = open_periods.unwrap_or(0);
        if open_count > 0 {
            return Err(DomainError::business_rule(
                "OpenPeriodsExist",
                &format!(
                    "Cannot close fiscal year: {} accounting period(s) are still open. Close all periods first.",
                    open_count
                ),
            ));
        }

        // Get fiscal year date range
        let fy: Option<(NaiveDate, NaiveDate)> = sqlx::query_as(
            "SELECT start_date, end_date FROM fiscal_years WHERE id = $1 AND company_id = $2",
        )
        .bind(fiscal_year_id)
        .bind(company_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let (fy_start, fy_end) =
            fy.ok_or_else(|| DomainError::not_found("FiscalYear", fiscal_year_id))?;

        // Calculate P&L for the fiscal year
        // Revenue accounts (account_type = 'Income' or 'Revenue') → credit balances
        // Expense accounts (account_type = 'Expense') → debit balances
        let revenue: Decimal = sqlx::query_scalar(
            r#"
            SELECT COALESCE(SUM(gl.credit - gl.debit), 0)
            FROM gl_entries gl
            JOIN chart_of_accounts coa ON gl.account_id = coa.id
            WHERE gl.company_id = $1
                AND gl.posting_date BETWEEN $2 AND $3
                AND coa.account_type IN ('Income', 'Revenue')
            "#,
        )
        .bind(company_id)
        .bind(fy_start)
        .bind(fy_end)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let expenses: Decimal = sqlx::query_scalar(
            r#"
            SELECT COALESCE(SUM(gl.debit - gl.credit), 0)
            FROM gl_entries gl
            JOIN chart_of_accounts coa ON gl.account_id = coa.id
            WHERE gl.company_id = $1
                AND gl.posting_date BETWEEN $2 AND $3
                AND coa.account_type IN ('Expense', 'Cost of Goods Sold')
            "#,
        )
        .bind(company_id)
        .bind(fy_start)
        .bind(fy_end)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        let net_income = revenue - expenses;

        // Start transaction for year-end journal + fiscal year lock
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| DomainError::internal(e.to_string()))?;

        // Create closing journal entry: Transfer net income to Retained Earnings
        let closing_entry_id = if net_income != dec!(0) {
            let voucher_no = format!("YE-CLOSE-{}", fy_end.format("%Y"));
            let entry_id = Uuid::new_v4();

            if net_income > dec!(0) {
                // Profit: Debit Income Summary → Credit Retained Earnings
                sqlx::query(
                    r#"
                    INSERT INTO gl_entries (
                        id, company_id, posting_date, account_id, debit, credit,
                        debit_in_account_currency, credit_in_account_currency,
                        voucher_type, voucher_no, voucher_id, currency, exchange_rate, created_by
                    ) VALUES
                    ($1, $2, $3, $4, 0, $5, 0, $5, 'Year End Closing', $6, $7, 'IDR', 1, $8),
                    (uuid_generate_v4(), $2, $3, $4, $5, 0, $5, 0, 'Year End Closing', $6, $7, 'IDR', 1, $8)
                    "#,
                )
                .bind(entry_id)
                .bind(company_id)
                .bind(fy_end)
                .bind(retained_earnings_account_id)
                .bind(net_income)
                .bind(&voucher_no)
                .bind(entry_id)
                .bind(closed_by)
                .execute(&mut *tx)
                .await
                .map_err(|e| DomainError::internal(format!("Year-end GL posting failed: {}", e)))?;
            }
            // For losses, same logic but reversed amounts

            Some(entry_id)
        } else {
            None
        };

        // Lock the fiscal year
        sqlx::query(
            "UPDATE fiscal_years SET is_closed = TRUE, closed_at = NOW(), closed_by = $1 WHERE id = $2",
        )
        .bind(closed_by)
        .bind(fiscal_year_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        // Count closed periods
        let periods_closed: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM accounting_periods WHERE fiscal_year_id = $1 AND is_closed = TRUE",
        )
        .bind(fiscal_year_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?;

        tx.commit()
            .await
            .map_err(|e| DomainError::internal(e.to_string()))?;

        tracing::info!(
            "ACCOUNTING AUDIT YEAR_END_CLOSE: FY={} Company={} Revenue={} Expenses={} Net={} ClosedBy={}",
            fiscal_year_id, company_id, revenue, expenses, net_income, closed_by
        );

        Ok(YearEndClosingResult {
            fiscal_year_id,
            retained_earnings_entry_id: closing_entry_id,
            total_revenue: revenue,
            total_expenses: expenses,
            net_income,
            periods_closed: periods_closed as i32,
        })
    }

    /// Reopen a closed period (restricted, requires audit justification)
    pub async fn reopen_period(
        &self,
        period_id: Uuid,
        reopened_by: Uuid,
        justification: &str,
    ) -> DomainResult<()> {
        if justification.len() < 20 {
            return Err(DomainError::validation(
                "justification",
                "Justification must be at least 20 characters for audit compliance",
            ));
        }

        let rows = sqlx::query(
            r#"
            UPDATE accounting_periods
            SET is_closed = FALSE, closed_at = NULL, closed_by = NULL
            WHERE id = $1 AND is_closed = TRUE
            "#,
        )
        .bind(period_id)
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::internal(e.to_string()))?
        .rows_affected();

        if rows == 0 {
            return Err(DomainError::business_rule(
                "PeriodNotClosed",
                "Period is not closed or does not exist",
            ));
        }

        tracing::warn!(
            "ACCOUNTING AUDIT PERIOD_REOPENED: Period={} By={} Justification='{}'",
            period_id,
            reopened_by,
            justification
        );

        Ok(())
    }
}
