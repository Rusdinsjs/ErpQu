//! RBAC Handler

use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::server::AppState;
use crate::application::dto::ApiResponse;
use crate::domain::entities::{
    CustomDocPerm, DocType, Permission, Role, SaveDocPermPayload, UserClaims,
};
use crate::shared::errors::AppError;

#[derive(Debug, Deserialize)]
pub struct UpdateRolePermissionsRequest {
    pub permission_ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct GetDocPermsParams {
    pub doctype_id: Option<Uuid>,
}

pub async fn list_roles(State(state): State<AppState>) -> Result<Json<Vec<Role>>, AppError> {
    let roles = state.rbac_service.list_roles().await?;
    Ok(Json(roles))
}

pub async fn list_permissions(
    State(state): State<AppState>,
) -> Result<Json<Vec<Permission>>, AppError> {
    let permissions = state.rbac_service.list_permissions().await?;
    Ok(Json(permissions))
}

pub async fn get_role_permissions(
    State(state): State<AppState>,
    Path(role_id): Path<Uuid>,
) -> Result<Json<Vec<Permission>>, AppError> {
    let permissions = state.rbac_service.get_role_permissions(role_id).await?;
    Ok(Json(permissions))
}

pub async fn update_role_permissions(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(role_id): Path<Uuid>,
    Json(payload): Json<UpdateRolePermissionsRequest>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    // Only admins (level 2 or below) can update role permissions
    if claims.role_level > 2 {
        return Err(AppError::Forbidden(
            "Admin access required to update role permissions".to_string(),
        ));
    }

    state
        .rbac_service
        .update_role_permissions(role_id, payload.permission_ids)
        .await?;

    Ok(Json(ApiResponse::success_with_message(
        (),
        "Role permissions updated successfully",
    )))
}

pub async fn get_user_roles(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<Role>>, AppError> {
    let roles = state.rbac_service.get_user_roles(user_id).await?;
    Ok(Json(roles))
}

pub async fn get_user_permissions(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<Permission>>, AppError> {
    let permissions = state.rbac_service.get_user_permissions(user_id).await?;
    Ok(Json(permissions))
}

pub async fn assign_role(
    State(state): State<AppState>,
    Path((user_id, role_code)): Path<(Uuid, String)>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state
        .rbac_service
        .assign_role(user_id, &role_code, None, None)
        .await?;
    Ok(Json(ApiResponse::success_with_message((), "Role assigned")))
}

pub async fn remove_role(
    State(state): State<AppState>,
    Path((user_id, role_code)): Path<(Uuid, String)>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.rbac_service.remove_role(user_id, &role_code).await?;
    Ok(Json(ApiResponse::success_with_message((), "Role removed")))
}

// Frappe DocType & DocPerm Handlers

pub async fn list_doctypes(
    State(state): State<AppState>,
) -> Result<Json<Vec<DocType>>, AppError> {
    let list = state.rbac_service.list_doctypes().await?;
    Ok(Json(list))
}

pub async fn get_docperms(
    State(state): State<AppState>,
    Query(params): Query<GetDocPermsParams>,
) -> Result<Json<Vec<CustomDocPerm>>, AppError> {
    let list = state.rbac_service.get_docperms(params.doctype_id).await?;
    Ok(Json(list))
}

pub async fn save_docperm(
    State(state): State<AppState>,
    Json(payload): Json<SaveDocPermPayload>,
) -> Result<Json<CustomDocPerm>, AppError> {
    let item = state.rbac_service.save_docperm(payload).await?;
    Ok(Json(item))
}

pub async fn delete_docperm(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.rbac_service.delete_docperm(id).await?;
    Ok(Json(ApiResponse::success_with_message((), "DocPerm deleted")))
}

