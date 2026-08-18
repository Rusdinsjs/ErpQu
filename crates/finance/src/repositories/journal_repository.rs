use crate::domain::entities::journal::{
    CreateJournalEntryRequest, JournalEntry, JournalEntryDetail, JournalLine, JournalStatus,
};
use chrono::{DateTime, NaiveDate, Utc};
use management_system_core::domain::errors::{DomainError, DomainResult};
use management_system_core::infrastructure::database::UnitOfWork;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(FromRow)]
struct JournalEntryRow {
    id: Uuid,
    company_id: Option<Uuid>,
    transaction_number: String,
    date: NaiveDate,
    description: String,
    reference: Option<String>,
    status: String,
    created_by: Option<Uuid>,
    reversed_by: Option<Uuid>,
    reversed_at: Option<DateTime<Utc>>,
    reversal_reason: Option<String>,
    reversal_source_id: Option<Uuid>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<JournalEntryRow> for JournalEntry {
    fn from(r: JournalEntryRow) -> Self {
        let status = match r.status.to_lowercase().as_str() {
            "submitted" => JournalStatus::Submitted,
            "approved" => JournalStatus::Approved,
            "posted" => JournalStatus::Posted,
            "reversed" => JournalStatus::Reversed,
            "cancelled" => JournalStatus::Cancelled,
            _ => JournalStatus::Draft,
        };

        Self {
            id: r.id,
            company_id: r.company_id,
            transaction_number: r.transaction_number,
            date: r.date,
            description: r.description,
            reference: r.reference,
            status,
            created_by: r.created_by,
            reversed_by: r.reversed_by,
            reversed_at: r.reversed_at,
            reversal_reason: r.reversal_reason,
            reversal_source_id: r.reversal_source_id,
            created_at: r.created_at,
            updated_at: r.updated_at,
        }
    }
}

#[derive(FromRow)]
struct JournalLineRow {
    id: Uuid,
    journal_entry_id: Uuid,
    account_id: Uuid,
    description: Option<String>,
    debit: Decimal,
    credit: Decimal,
}

impl From<JournalLineRow> for JournalLine {
    fn from(r: JournalLineRow) -> Self {
        Self {
            id: r.id,
            journal_entry_id: r.journal_entry_id,
            account_id: r.account_id,
            description: r.description,
            debit: r.debit,
            credit: r.credit,
        }
    }
}

#[derive(Clone)]
pub struct JournalRepository {
    pool: PgPool,
}

impl JournalRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn create_journal_entry(
        &self,
        transaction_number: String,
        req: &CreateJournalEntryRequest,
        created_by: Option<Uuid>,
    ) -> DomainResult<JournalEntryDetail> {
        let mut uow = UnitOfWork::begin(&self.pool).await?;
        let detail = Self::create_journal_entry_with_uow(&mut uow, transaction_number, req, created_by).await?;
        uow.commit().await?;
        Ok(detail)
    }

    pub async fn create_journal_entry_with_uow(
        uow: &mut UnitOfWork,
        transaction_number: String,
        req: &CreateJournalEntryRequest,
        created_by: Option<Uuid>,
    ) -> DomainResult<JournalEntryDetail> {
        let header_row = sqlx::query_as::<_, JournalEntryRow>(
            r#"
            INSERT INTO journal_entries (
                company_id, transaction_number, date, description, reference, status, created_by
            )
            VALUES ($1, $2, $3, $4, $5, 'draft'::journal_status, $6)
            RETURNING 
                id, company_id, transaction_number, date, description, reference, status::text AS status,
                created_by, reversed_by, reversed_at, reversal_reason, reversal_source_id, created_at, updated_at
            "#,
        )
        .bind(req.company_id)
        .bind(transaction_number)
        .bind(req.date)
        .bind(&req.description)
        .bind(&req.reference)
        .bind(created_by)
        .fetch_one(uow.conn())
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let header: JournalEntry = header_row.into();

        let mut lines = Vec::new();
        for line_req in &req.lines {
            let line_id = Uuid::new_v4();
            let line_row = sqlx::query_as::<_, JournalLineRow>(
                r#"
                INSERT INTO journal_lines (
                    id, journal_entry_id, account_id, description, debit, credit
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, journal_entry_id, account_id, description, debit, credit
                "#,
            )
            .bind(line_id)
            .bind(header.id)
            .bind(line_req.account_id)
            .bind(&line_req.description)
            .bind(line_req.debit)
            .bind(line_req.credit)
            .fetch_one(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
            lines.push(line_row.into());
        }

        Ok(JournalEntryDetail { header, lines })
    }

        pub async fn update_journal_entry_with_uow(
        uow: &mut UnitOfWork,
        journal_id: Uuid,
        req: &CreateJournalEntryRequest,
    ) -> DomainResult<JournalEntryDetail> {
        let current_status: Option<(String,)> =
            sqlx::query_as("SELECT status::text FROM journal_entries WHERE id = $1 FOR UPDATE")
                .bind(journal_id)
                .fetch_optional(uow.conn())
                .await
                .map_err(|e| DomainError::Database(e.to_string()))?;

        match current_status {
            None => return Err(DomainError::not_found("JournalEntry", journal_id)),
            Some((status,)) if !status.eq_ignore_ascii_case("draft") => {
                return Err(DomainError::business_rule(
                    "PostedJournalIsImmutable",
                    "A posted journal entry cannot be rebuilt from an invoice update",
                ));
            }
            Some(_) => {}
        }

        let header_row = sqlx::query_as::<_, JournalEntryRow>(
            r#"
            UPDATE journal_entries
            SET date = $1, description = $2, reference = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING 
                id, company_id, transaction_number, date, description, reference, status::text AS status,
                created_by, reversed_by, reversed_at, reversal_reason, reversal_source_id, created_at, updated_at
            "#,
        )
        .bind(req.date)
        .bind(&req.description)
        .bind(&req.reference)
        .bind(journal_id)
        .fetch_one(uow.conn())
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let header: JournalEntry = header_row.into();

        sqlx::query("DELETE FROM journal_lines WHERE journal_entry_id = $1")
            .bind(journal_id)
            .execute(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        let mut lines = Vec::new();
        for line_req in &req.lines {
            let line_id = Uuid::new_v4();
            let line_row = sqlx::query_as::<_, JournalLineRow>(
                r#"
                INSERT INTO journal_lines (
                    id, journal_entry_id, account_id, description, debit, credit
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, journal_entry_id, account_id, description, debit, credit
                "#,
            )
            .bind(line_id)
            .bind(header.id)
            .bind(line_req.account_id)
            .bind(&line_req.description)
            .bind(line_req.debit)
            .bind(line_req.credit)
            .fetch_one(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;
            lines.push(line_row.into());
        }

        Ok(JournalEntryDetail { header, lines })
    }

    pub async fn get_journal_entry_detail(
        &self,
        id: Uuid,
    ) -> DomainResult<Option<JournalEntryDetail>> {
        let header_row = sqlx::query_as::<_, JournalEntryRow>(
            r#"
            SELECT 
                id, company_id, transaction_number, date, description, reference, status::text AS status,
                created_by, reversed_by, reversed_at, reversal_reason, reversal_source_id, created_at, updated_at
            FROM journal_entries
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let header: JournalEntry = match header_row {
            Some(r) => r.into(),
            None => return Ok(None),
        };

        let line_rows = sqlx::query_as::<_, JournalLineRow>(
            r#"
            SELECT id, journal_entry_id, account_id, description, debit, credit
            FROM journal_lines
            WHERE journal_entry_id = $1
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        let lines = line_rows.into_iter().map(Into::into).collect();

        Ok(Some(JournalEntryDetail { header, lines }))
    }

    pub async fn list_journal_entries(&self) -> DomainResult<Vec<JournalEntry>> {
        let rows = sqlx::query_as::<_, JournalEntryRow>(
            r#"
            SELECT 
                id, company_id, transaction_number, date, description, reference, status::text AS status,
                created_by, reversed_by, reversed_at, reversal_reason, reversal_source_id, created_at, updated_at
            FROM journal_entries
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    pub async fn update_status(&self, id: Uuid, status: JournalStatus) -> DomainResult<()> {
        let status_str = match status {
            JournalStatus::Draft => "draft",
            JournalStatus::Submitted => "submitted",
            JournalStatus::Approved => "approved",
            JournalStatus::Posted => "posted",
            JournalStatus::Reversed => "reversed",
            JournalStatus::Cancelled => "cancelled",
        };
        sqlx::query("UPDATE journal_entries SET status = $1::journal_status, updated_at = NOW() WHERE id = $2")
            .bind(status_str)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn update_status_in_uow(
        uow: &mut UnitOfWork,
        id: Uuid,
        status: JournalStatus,
    ) -> DomainResult<()> {
        let status_str = match status {
            JournalStatus::Draft => "draft",
            JournalStatus::Submitted => "submitted",
            JournalStatus::Approved => "approved",
            JournalStatus::Posted => "posted",
            JournalStatus::Reversed => "reversed",
            JournalStatus::Cancelled => "cancelled",
        };
        sqlx::query("UPDATE journal_entries SET status = $1::journal_status, updated_at = NOW() WHERE id = $2")
            .bind(status_str)
            .bind(id)
            .execute(uow.conn())
            .await
            .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    pub async fn record_reversal_in_uow(
        uow: &mut UnitOfWork,
        original_id: Uuid,
        reversal_id: Uuid,
        reason: &str,
        reversed_by: Option<Uuid>,
    ) -> DomainResult<()> {
        sqlx::query(
            r#"
            UPDATE journal_entries 
            SET status = 'reversed'::journal_status, 
                reversed_by = $1, 
                reversed_at = NOW(), 
                reversal_reason = $2, 
                reversal_source_id = $3,
                updated_at = NOW() 
            WHERE id = $4
            "#
        )
        .bind(reversed_by)
        .bind(reason)
        .bind(reversal_id)
        .bind(original_id)
        .execute(uow.conn())
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    /// Generate the next sequence number for journal entries in format JE-YYYYMM-XXXX.
    pub async fn get_next_sequence_number(&self, date: chrono::NaiveDate) -> DomainResult<String> {
        let prefix = format!("JE-{}", date.format("%Y%m"));
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM journal_entries WHERE transaction_number LIKE $1",
        )
        .bind(format!("{}%", prefix))
        .fetch_one(&self.pool)
        .await
        .map_err(|e| DomainError::Database(e.to_string()))?;
        Ok(format!("{}-{:04}", prefix, count + 1))
    }
}
