use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use crate::application::services::maintenance_type_service::MaintenanceTypeService;
use crate::domain::entities::maintenance::MaintenanceType;
use crate::AppState;

pub async fn list_maintenance_types(
    State(state): State<AppState>,
) -> Result<Json<Vec<MaintenanceType>>, (StatusCode, String)> {
    let types = state.maintenance_type_service.get_all_types().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(types))
}

pub async fn get_maintenance_type(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<MaintenanceType>, (StatusCode, String)> {
    let m_type = state.maintenance_type_service.get_type_by_id(id).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    
    match m_type {
        Some(m) => Ok(Json(m)),
        None => Err((StatusCode::NOT_FOUND, "Maintenance type not found".to_string())),
    }
}

pub async fn create_maintenance_type(
    State(state): State<AppState>,
    Json(payload): Json<MaintenanceType>,
) -> Result<(StatusCode, Json<MaintenanceType>), (StatusCode, String)> {
    let created = state.maintenance_type_service.create_type(payload).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok((StatusCode::CREATED, Json(created)))
}

pub async fn update_maintenance_type(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<MaintenanceType>,
) -> Result<Json<MaintenanceType>, (StatusCode, String)> {
    let mut m_type = payload;
    m_type.id = id;
    
    let updated = state.maintenance_type_service.update_type(m_type).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(updated))
}

pub async fn delete_maintenance_type(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<StatusCode, (StatusCode, String)> {
    state.maintenance_type_service.delete_type(id).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(StatusCode::NO_CONTENT)
}
