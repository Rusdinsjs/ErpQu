use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::application::services::depreciation_method_service::DepreciationMethodService;
use crate::domain::entities::depreciation::DepreciationMethod;
use crate::AppState;

pub async fn list_depreciation_methods(
    State(state): State<AppState>,
) -> Result<Json<Vec<DepreciationMethod>>, (StatusCode, String)> {
    let methods = state.depreciation_method_service.get_all_methods().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(methods))
}

pub async fn get_depreciation_method(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<DepreciationMethod>, (StatusCode, String)> {
    let method = state.depreciation_method_service.get_method_by_id(id).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    
    match method {
        Some(m) => Ok(Json(m)),
        None => Err((StatusCode::NOT_FOUND, "Depreciation method not found".to_string())),
    }
}

pub async fn create_depreciation_method(
    State(state): State<AppState>,
    Json(payload): Json<DepreciationMethod>,
) -> Result<(StatusCode, Json<DepreciationMethod>), (StatusCode, String)> {
    let mut method = payload;
    if method.id.is_nil() {
        method.id = Uuid::new_v4();
    }
    
    let created = state.depreciation_method_service.create_method(method).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok((StatusCode::CREATED, Json(created)))
}

pub async fn update_depreciation_method(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<DepreciationMethod>,
) -> Result<Json<DepreciationMethod>, (StatusCode, String)> {
    let mut method = payload;
    method.id = id;
    
    let updated = state.depreciation_method_service.update_method(method).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(updated))
}

pub async fn delete_depreciation_method(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    state.depreciation_method_service.delete_method(id).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(StatusCode::NO_CONTENT)
}
