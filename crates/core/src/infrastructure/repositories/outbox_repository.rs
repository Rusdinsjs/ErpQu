//! Outbox Repository Implementation (QARC-005)
//!
//! Persistence store for transactional outbox pattern.

use crate::domain::errors::{DomainError, DomainResult};
use crate::domain::outbox::OutboxEntry;
use crate::infrastructure::database::UnitOfWork;

pub struct OutboxStore;

impl OutboxStore {
    /// Append an outbox entry inside the active `UnitOfWork` transaction.
    pub async fn append(uow: &mut UnitOfWork, entry: &OutboxEntry) -> DomainResult<()> {
        sqlx::query(
            r#"
            INSERT INTO outbox
                (id, event_type, payload, source_type, source_id,
                 tenant_id, company_id, correlation_id,
                 status, attempt_count, max_attempts, next_attempt_at,
                 created_at, last_error)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            "#,
        )
        .bind(entry.id)
        .bind(&entry.event_type)
        .bind(&entry.payload)
        .bind(&entry.source_type)
        .bind(entry.source_id)
        .bind(entry.tenant_id)
        .bind(entry.company_id)
        .bind(&entry.correlation_id)
        .bind(&entry.status)
        .bind(entry.attempt_count)
        .bind(entry.max_attempts)
        .bind(entry.next_attempt_at)
        .bind(entry.created_at)
        .bind(&entry.last_error)
        .execute(uow.conn())
        .await
        .map_err(|e: sqlx::Error| DomainError::Database(e.to_string()))?;

        Ok(())
    }

    /// Fetch pending outbox entries using `FOR UPDATE SKIP LOCKED` (M22)
    pub async fn fetch_and_lock_pending(
        pool: &sqlx::PgPool,
        batch_size: i64,
    ) -> DomainResult<Vec<OutboxEntry>> {
        let rows = sqlx::query_as::<_, OutboxRow>(
            r#"
            SELECT id, event_type, payload, source_type, source_id,
                   tenant_id, company_id, correlation_id,
                   status, attempt_count, max_attempts, next_attempt_at,
                   created_at, last_error
            FROM outbox
            WHERE status IN ('PENDING', 'FAILED')
              AND next_attempt_at <= NOW()
            ORDER BY created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
            "#,
        )
        .bind(batch_size)
        .fetch_all(pool)
        .await
        .map_err(|e: sqlx::Error| DomainError::Database(e.to_string()))?;

        Ok(rows.into_iter().map(|r| r.into_entry()).collect())
    }

    /// Mark an outbox entry as COMPLETED after successful side-effect delivery (M26)
    pub async fn mark_completed(pool: &sqlx::PgPool, id: uuid::Uuid) -> DomainResult<()> {
        sqlx::query("UPDATE outbox SET status = 'COMPLETED', last_error = NULL WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await
            .map_err(|e: sqlx::Error| DomainError::Database(e.to_string()))?;
        Ok(())
    }

    /// Mark an outbox entry as FAILED with exponential backoff calculation (M23)
    pub async fn mark_failed(
        pool: &sqlx::PgPool,
        id: uuid::Uuid,
        error_msg: &str,
        current_attempts: i32,
        max_attempts: i32,
    ) -> DomainResult<()> {
        let new_attempts = current_attempts + 1;
        if new_attempts >= max_attempts {
            // Move to DEAD_LETTER
            sqlx::query(
                "UPDATE outbox SET status = 'DEAD_LETTER', attempt_count = $2, last_error = $3 WHERE id = $1",
            )
            .bind(id)
            .bind(new_attempts)
            .bind(error_msg)
            .execute(pool)
            .await
            .map_err(|e: sqlx::Error| DomainError::Database(e.to_string()))?;
        } else {
            // Calculate exponential backoff (2^attempts * 5 seconds)
            let backoff_secs = 5 * (2_i64.pow(new_attempts as u32));
            sqlx::query(
                r#"
                UPDATE outbox 
                SET status = 'FAILED', 
                    attempt_count = $2, 
                    last_error = $3,
                    next_attempt_at = NOW() + ($4 || ' seconds')::INTERVAL
                WHERE id = $1
                "#,
            )
            .bind(id)
            .bind(new_attempts)
            .bind(error_msg)
            .bind(backoff_secs.to_string())
            .execute(pool)
            .await
            .map_err(|e: sqlx::Error| DomainError::Database(e.to_string()))?;
        }
        Ok(())
    }

    /// Get outbox lag metric (unprocessed count) (M27)
    pub async fn get_outbox_lag(pool: &sqlx::PgPool) -> DomainResult<i64> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM outbox WHERE status IN ('PENDING', 'FAILED')",
        )
        .fetch_one(pool)
        .await
        .map_err(|e: sqlx::Error| DomainError::Database(e.to_string()))?;
        Ok(count)
    }
}

#[derive(sqlx::FromRow)]
struct OutboxRow {
    id: uuid::Uuid,
    event_type: String,
    payload: String,
    source_type: String,
    source_id: uuid::Uuid,
    tenant_id: uuid::Uuid,
    company_id: Option<uuid::Uuid>,
    correlation_id: String,
    status: String,
    attempt_count: i32,
    max_attempts: i32,
    next_attempt_at: chrono::DateTime<chrono::Utc>,
    created_at: chrono::DateTime<chrono::Utc>,
    last_error: Option<String>,
}

impl OutboxRow {
    fn into_entry(self) -> OutboxEntry {
        OutboxEntry {
            id: self.id,
            event_type: self.event_type,
            payload: self.payload,
            source_type: self.source_type,
            source_id: self.source_id,
            tenant_id: self.tenant_id,
            company_id: self.company_id,
            correlation_id: self.correlation_id,
            status: self.status,
            attempt_count: self.attempt_count,
            max_attempts: self.max_attempts,
            next_attempt_at: self.next_attempt_at,
            created_at: self.created_at,
            last_error: self.last_error,
        }
    }
}
