use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::application::dto::ApiResponse;
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::errors::AppError;
use management_system_hr::domain::entities::{
    HrDriverAssignment, HrDriverSafetyIncident, HrP2hInspection, HrVehicleHandover,
};
use management_system_hr::dto::{
    CreateDriverAssignmentRequest, CreateDriverSafetyIncidentRequest, CreateVehicleHandoverRequest,
    ReturnDriverAssignmentRequest, SubmitP2hInspectionRequest,
};

#[derive(Debug, Deserialize)]
pub struct DriverFilterParams {
    pub employee_id: Option<Uuid>,
    pub asset_id: Option<Uuid>,
}

// ---- DRIVER ASSIGNMENTS ----
pub async fn list_driver_assignments(
    State(state): State<AppState>,
    Query(params): Query<DriverFilterParams>,
) -> Result<Json<Vec<HrDriverAssignment>>, AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .list_driver_assignments(params.employee_id, params.asset_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_driver_assignment(
    State(state): State<AppState>,
    Json(payload): Json<CreateDriverAssignmentRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrDriverAssignment>>), AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .create_driver_assignment(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Penugasan driver / operator unit berhasil disimpan",
        )),
    ))
}

pub async fn return_driver_assignment(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ReturnDriverAssignmentRequest>,
) -> Result<Json<ApiResponse<HrDriverAssignment>>, AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .return_driver_assignment(id, payload)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Unit berhasil dikembalikan",
    )))
}

// ---- P2H INSPECTIONS ----
pub async fn list_p2h_inspections(
    State(state): State<AppState>,
    Query(params): Query<DriverFilterParams>,
) -> Result<Json<Vec<HrP2hInspection>>, AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .list_p2h_inspections(params.employee_id, params.asset_id)
        .await?;
    Ok(Json(data))
}

pub async fn submit_p2h_inspection(
    State(state): State<AppState>,
    Json(payload): Json<SubmitP2hInspectionRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrP2hInspection>>), AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .submit_p2h_inspection(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Checklist inspeksi harian P2H berhasil disimpan",
        )),
    ))
}

// ---- DRIVER SAFETY INCIDENTS ----
pub async fn list_driver_safety_incidents(
    State(state): State<AppState>,
    Query(params): Query<DriverFilterParams>,
) -> Result<Json<Vec<HrDriverSafetyIncident>>, AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .list_driver_safety_incidents(params.employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_driver_safety_incident(
    State(state): State<AppState>,
    Json(payload): Json<CreateDriverSafetyIncidentRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrDriverSafetyIncident>>), AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .create_driver_safety_incident(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Log insiden keselamatan / pelanggaran driver berhasil dicatat",
        )),
    ))
}

// ---- VEHICLE HANDOVERS ----
pub async fn list_vehicle_handovers(
    State(state): State<AppState>,
    Query(params): Query<DriverFilterParams>,
) -> Result<Json<Vec<HrVehicleHandover>>, AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .list_vehicle_handovers(params.asset_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_vehicle_handover(
    State(state): State<AppState>,
    Json(payload): Json<CreateVehicleHandoverRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrVehicleHandover>>), AppError> {
    let data = state
        .hr_driver_p2h_safety_service
        .create_vehicle_handover(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Berita Acara Serah Terima (BAST) unit berhasil disimpan",
        )),
    ))
}
