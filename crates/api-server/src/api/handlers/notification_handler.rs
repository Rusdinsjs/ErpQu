//! Notification Handler

use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use serde::Serialize;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::application::dto::{ApiResponse, PaginationParams};
use management_system_core::domain::entities::notification::Notification;
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::errors::AppError;

#[derive(Serialize)]
pub struct UnreadCount {
    count: i64,
}

fn check_user_access(claims: &UserClaims, target_user_id: Uuid) -> Result<(), AppError> {
    let is_admin = claims.role == "super_admin"
        || claims.role == "admin"
        || claims.role.starts_with("admin_")
        || claims.role_level <= 2;

    if !is_admin && claims.user_id() != target_user_id {
        return Err(AppError::Forbidden(
            "Access denied: You cannot view or modify another user's notifications".to_string(),
        ));
    }
    Ok(())
}

pub async fn list_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(user_id): Path<Uuid>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<Vec<Notification>>, AppError> {
    check_user_access(&claims, user_id)?;

    let notifications = state
        .notification_service
        .list_by_user(user_id, params.page(), params.per_page())
        .await?;
    Ok(Json(notifications))
}

pub async fn list_unread_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<Notification>>, AppError> {
    check_user_access(&claims, user_id)?;

    let notifications = state.notification_service.list_unread(user_id).await?;
    Ok(Json(notifications))
}

pub async fn count_unread_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<UnreadCount>, AppError> {
    check_user_access(&claims, user_id)?;

    let count = state.notification_service.count_unread(user_id).await?;
    Ok(Json(UnreadCount { count }))
}

pub async fn mark_notification_as_read(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    let is_admin = claims.role == "super_admin"
        || claims.role == "admin"
        || claims.role.starts_with("admin_")
        || claims.role_level <= 2;

    state
        .notification_service
        .mark_as_read_for_user(id, claims.user_id(), is_admin)
        .await?;

    Ok(Json(ApiResponse::success_with_message(
        (),
        "Marked as read",
    )))
}

pub async fn mark_all_notifications_as_read(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<ApiResponse<i64>>, AppError> {
    check_user_access(&claims, user_id)?;

    let count = state.notification_service.mark_all_as_read(user_id).await?;
    Ok(Json(ApiResponse::success_with_message(
        count,
        &format!("Marked {} as read", count),
    )))
}
