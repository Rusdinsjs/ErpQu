use crate::api::server::AppState;
use crate::application::dto::ApiResponse;
use crate::domain::entities::{
    ApplyWorkflowActionPayload, ApprovalWorkflow, CreateWorkflowPayload, SaveWorkflowStatePayload,
    SaveWorkflowTransitionPayload, UserClaims,
};
use crate::shared::errors::AppError;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Extension, Json,
};
use uuid::Uuid;

pub async fn list_workflows(State(state): State<AppState>) -> impl IntoResponse {
    match state.approval_workflow_service.list_workflows().await {
        Ok(workflows) => Json(workflows).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_workflow(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.approval_workflow_service.get_workflow(id).await {
        Ok(workflow) => Json(workflow).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

pub async fn create_workflow(
    State(state): State<AppState>,
    Extension(_claims): Extension<UserClaims>,
    Json(payload): Json<ApprovalWorkflow>,
) -> impl IntoResponse {
    match state
        .approval_workflow_service
        .create_workflow(payload)
        .await
    {
        Ok(workflow) => (StatusCode::CREATED, Json(workflow)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn update_workflow(
    State(state): State<AppState>,
    Extension(_claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ApprovalWorkflow>,
) -> impl IntoResponse {
    match state
        .approval_workflow_service
        .update_workflow(id, payload)
        .await
    {
        Ok(workflow) => Json(workflow).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn delete_workflow(
    State(state): State<AppState>,
    Extension(_claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.approval_workflow_service.delete_workflow(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

// === Frappe / ERPNext Style Workflow Handlers ===

pub async fn list_frappe_workflows(
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::domain::entities::WorkflowWithDocType>>, AppError> {
    let list = state.approval_workflow_service.list_frappe_workflows().await?;
    Ok(Json(list))
}

pub async fn get_frappe_workflow_detail(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<crate::domain::entities::WorkflowDetailResponse>, AppError> {
    let detail = state.approval_workflow_service.get_frappe_workflow_detail(id).await?;
    Ok(Json(detail))
}

pub async fn create_frappe_workflow(
    State(state): State<AppState>,
    Json(payload): Json<CreateWorkflowPayload>,
) -> Result<Json<crate::domain::entities::WorkflowWithDocType>, AppError> {
    let wf = state.approval_workflow_service.create_frappe_workflow(payload).await?;
    Ok(Json(wf))
}

pub async fn save_frappe_workflow_state(
    State(state): State<AppState>,
    Path(workflow_id): Path<Uuid>,
    Json(payload): Json<SaveWorkflowStatePayload>,
) -> Result<Json<crate::domain::entities::WorkflowStateEntity>, AppError> {
    let s = state.approval_workflow_service.save_frappe_workflow_state(workflow_id, payload).await?;
    Ok(Json(s))
}

pub async fn save_frappe_workflow_transition(
    State(state): State<AppState>,
    Path(workflow_id): Path<Uuid>,
    Json(payload): Json<SaveWorkflowTransitionPayload>,
) -> Result<Json<crate::domain::entities::WorkflowTransitionDetail>, AppError> {
    let tr = state.approval_workflow_service.save_frappe_workflow_transition(workflow_id, payload).await?;
    Ok(Json(tr))
}

pub async fn delete_frappe_workflow(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.approval_workflow_service.delete_frappe_workflow(id).await?;
    Ok(Json(ApiResponse::success_with_message((), "Workflow deleted")))
}

pub async fn apply_frappe_workflow_action(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<ApplyWorkflowActionPayload>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    let user_id = claims.user_id();
    state.approval_workflow_service.apply_frappe_workflow_action(payload, user_id).await?;
    Ok(Json(ApiResponse::success_with_message((), "Workflow action applied")))
}

