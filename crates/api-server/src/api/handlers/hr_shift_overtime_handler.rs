use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::NaiveDate;
use serde::Deserialize;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::application::dto::ApiResponse;
use management_system_core::shared::errors::AppError;
use management_system_hr::domain::entities::{
    HrAttendanceDetail, HrAttendanceRequest, HrOvertimeRequest, HrShiftAssignment, HrShiftType,
};
use management_system_hr::dto::hr_shift_overtime_dto::{
    AttendanceLogQueryParams, AttendanceRequestQueryParams, BulkShiftAssignmentRequest,
    CreateAttendanceRequestPayload, CreateOvertimeRequestPayload, CreateShiftAssignmentRequest,
    CreateShiftTypeRequest, EmployeeAttendanceRecap, OvertimeQueryParams,
    ReviewAttendanceRequestPayload, ReviewOvertimeRequestPayload, UpdateShiftTypeRequest,
};

// ---- SHIFT TYPES ----

pub async fn list_shift_types(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrShiftType>>, AppError> {
    let data = state.hr_shift_overtime_service.list_shift_types().await?;
    Ok(Json(data))
}

pub async fn get_shift_type(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<HrShiftType>, AppError> {
    let data = state.hr_shift_overtime_service.get_shift_type(id).await?;
    Ok(Json(data))
}

pub async fn create_shift_type(
    State(state): State<AppState>,
    Json(payload): Json<CreateShiftTypeRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrShiftType>>), AppError> {
    let data = state
        .hr_shift_overtime_service
        .create_shift_type(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Shift berhasil dibuat",
        )),
    ))
}

pub async fn update_shift_type(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateShiftTypeRequest>,
) -> Result<Json<ApiResponse<HrShiftType>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .update_shift_type(id, payload)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Shift berhasil diperbarui",
    )))
}

pub async fn delete_shift_type(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state
        .hr_shift_overtime_service
        .delete_shift_type(id)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Shift berhasil dihapus",
    )))
}

// ---- SHIFT ASSIGNMENTS ----

pub async fn list_shift_assignments(
    State(state): State<AppState>,
    Query(params): Query<management_system_hr::dto::hr_lifecycle_dto::LifecycleQueryParams>,
) -> Result<Json<Vec<HrShiftAssignment>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .list_shift_assignments(params.employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_shift_assignment(
    State(state): State<AppState>,
    Json(payload): Json<CreateShiftAssignmentRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrShiftAssignment>>), AppError> {
    let data = state
        .hr_shift_overtime_service
        .create_shift_assignment(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Penugasan shift berhasil dibuat",
        )),
    ))
}

pub async fn bulk_assign_shifts(
    State(state): State<AppState>,
    Json(payload): Json<BulkShiftAssignmentRequest>,
) -> Result<(StatusCode, Json<ApiResponse<Vec<HrShiftAssignment>>>), AppError> {
    let data = state
        .hr_shift_overtime_service
        .bulk_assign_shifts(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Penugasan roster massal berhasil",
        )),
    ))
}

pub async fn delete_shift_assignment(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state
        .hr_shift_overtime_service
        .delete_shift_assignment(id)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Penugasan shift berhasil dihapus",
    )))
}

// ---- ATTENDANCE REQUESTS ----

pub async fn list_attendance_requests(
    State(state): State<AppState>,
    Query(params): Query<AttendanceRequestQueryParams>,
) -> Result<Json<Vec<HrAttendanceRequest>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .list_attendance_requests(params)
        .await?;
    Ok(Json(data))
}

pub async fn create_attendance_request(
    State(state): State<AppState>,
    Json(payload): Json<CreateAttendanceRequestPayload>,
) -> Result<(StatusCode, Json<ApiResponse<HrAttendanceRequest>>), AppError> {
    let data = state
        .hr_shift_overtime_service
        .create_attendance_request(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Permohonan koreksi absen/dinas luar berhasil diajukan",
        )),
    ))
}

pub async fn review_attendance_request(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ReviewAttendanceRequestPayload>,
) -> Result<Json<ApiResponse<HrAttendanceRequest>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .review_attendance_request(id, payload, None)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Permohonan koreksi absensi berhasil diproses",
    )))
}

// ---- OVERTIME REQUESTS ----

pub async fn list_overtime_requests(
    State(state): State<AppState>,
    Query(params): Query<OvertimeQueryParams>,
) -> Result<Json<Vec<HrOvertimeRequest>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .list_overtime_requests(params)
        .await?;
    Ok(Json(data))
}

pub async fn create_overtime_request(
    State(state): State<AppState>,
    Json(payload): Json<CreateOvertimeRequestPayload>,
) -> Result<(StatusCode, Json<ApiResponse<HrOvertimeRequest>>), AppError> {
    let data = state
        .hr_shift_overtime_service
        .create_overtime_request(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Surat perintah lembur berhasil diajukan",
        )),
    ))
}

pub async fn review_overtime_request(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ReviewOvertimeRequestPayload>,
) -> Result<Json<ApiResponse<HrOvertimeRequest>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .review_overtime_request(id, payload, None)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Lembur berhasil diproses & upah lembur dihitung",
    )))
}

// ---- ATTENDANCE LOGS & RECAP ----

pub async fn list_attendance_details(
    State(state): State<AppState>,
    Query(params): Query<AttendanceLogQueryParams>,
) -> Result<Json<Vec<HrAttendanceDetail>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .list_attendance_details(params)
        .await?;
    Ok(Json(data))
}

#[derive(Debug, Deserialize)]
pub struct RecapQueryParams {
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub department_id: Option<Uuid>,
}

pub async fn get_attendance_recap(
    State(state): State<AppState>,
    Query(params): Query<RecapQueryParams>,
) -> Result<Json<Vec<EmployeeAttendanceRecap>>, AppError> {
    let data = state
        .hr_shift_overtime_service
        .get_attendance_recap(params.start_date, params.end_date, params.department_id)
        .await?;
    Ok(Json(data))
}
