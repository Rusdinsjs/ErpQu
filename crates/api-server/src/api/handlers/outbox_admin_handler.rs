//! Outbox Administration HTTP Handler (M12)
//!
//! Provides administrative endpoints to inspect Outbox DLQ (Dead-Letter Queue)
//! and manually retry failed events with RBAC authorization and audit logging.

use axum::{
    extract::{Path, State},
    Extension, Json,
};
use serde::Serialize;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::errors::DomainError;
use management_system_core::domain::request_context::RequestContext;
use management_system_core::shared::errors::AppResult;

#[derive(Debug, Serialize)]
pub struct OutboxRetryResponse {
    pub success: bool,
    pub outbox_id: Uuid,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct OutboxLagResponse {
    pub unprocessed_count: i64,
}

/// Manually retry a failed / DEAD_LETTER outbox event (M12)
/// POST /api/v1/admin/outbox/:id/retry
pub async fn retry_outbox_event(
    State(state): State<AppState>,
    Extension(ctx): Extension<RequestContext>,
    Path(outbox_id): Path<Uuid>,
) -> AppResult<Json<OutboxRetryResponse>> {
    // 1. Enforce Admin Role Authorization
    let role = ctx.role.to_lowercase();
    if role != "admin" && role != "super_admin" {
        return Err(DomainError::unauthorized(
            "Admin authorization required for outbox DLQ manual retry",
        ).into());
    }

    // 2. Reset Outbox Status to 'PENDING', next_attempt_at to NOW(), attempt_count to 0
    let rows_affected = sqlx::query(
        r#"
        UPDATE outbox
        SET status = 'PENDING',
            attempt_count = 0,
            next_attempt_at = NOW(),
            last_error = NULL
        WHERE id = $1
        "#,
    )
    .bind(outbox_id)
    .execute(&state.pool)
    .await
    .map_err(|e| DomainError::Database(e.to_string()))?
    .rows_affected();

    if rows_affected == 0 {
        return Err(DomainError::not_found("OutboxEvent", outbox_id).into());
    }

    // 3. Log Audit Trail
    tracing::info!(
        "User {} (role {}) manually retried outbox event {}",
        ctx.user_id,
        ctx.role,
        outbox_id
    );

    Ok(Json(OutboxRetryResponse {
        success: true,
        outbox_id,
        message: format!("Outbox event {} reset to PENDING for re-dispatch", outbox_id),
    }))
}

/// Get current outbox lag / unprocessed event count (M7)
/// GET /api/v1/admin/outbox/lag
pub async fn get_outbox_lag(
    State(state): State<AppState>,
    Extension(_ctx): Extension<RequestContext>,
) -> AppResult<Json<OutboxLagResponse>> {
    let lag = management_system_core::infrastructure::repositories::OutboxStore::get_outbox_lag(&state.pool).await?;
    Ok(Json(OutboxLagResponse {
        unprocessed_count: lag,
    }))
}
