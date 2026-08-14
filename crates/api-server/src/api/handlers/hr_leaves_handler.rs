use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::application::dto::ApiResponse;
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::errors::AppError;
use management_system_hr::domain::entities::{
    HrHoliday, HrHolidayList, HrLeaveAllocation, HrLeaveApplication,
    HrLeaveBlockList, HrLeaveType, LeaveBalanceSummary,
};
use management_system_hr::dto::{
    AddHolidayRequest, BulkLeaveAllocationRequest, CreateHolidayListRequest,
    CreateLeaveAllocationRequest, CreateLeaveApplicationRequest,
    CreateLeaveBlockListRequest, CreateLeaveTypeRequest, LeaveQueryParams,
    ReviewLeaveApplicationRequest, UpdateLeaveTypeRequest,
};

// ---- LEAVE TYPES ----
pub async fn list_leave_types(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrLeaveType>>, AppError> {
    let data = state.hr_leaves_service.list_leave_types().await?;
    Ok(Json(data))
}

pub async fn get_leave_type(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<HrLeaveType>, AppError> {
    let data = state.hr_leaves_service.get_leave_type(id).await?;
    Ok(Json(data))
}

pub async fn create_leave_type(
    State(state): State<AppState>,
    Json(payload): Json<CreateLeaveTypeRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrLeaveType>>), AppError> {
    let data = state.hr_leaves_service.create_leave_type(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Jenis cuti berhasil dibuat"))))
}

pub async fn update_leave_type(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateLeaveTypeRequest>,
) -> Result<Json<ApiResponse<HrLeaveType>>, AppError> {
    let data = state.hr_leaves_service.update_leave_type(id, payload).await?;
    Ok(Json(ApiResponse::success_with_message(data, "Jenis cuti berhasil diperbarui")))
}

pub async fn delete_leave_type(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.hr_leaves_service.delete_leave_type(id).await?;
    Ok(Json(ApiResponse::success_with_message((), "Jenis cuti berhasil dinonaktifkan")))
}

// ---- ALLOCATIONS ----
pub async fn list_allocations(
    State(state): State<AppState>,
    Query(params): Query<LeaveQueryParams>,
) -> Result<Json<Vec<HrLeaveAllocation>>, AppError> {
    let data = state.hr_leaves_service.list_allocations(params.employee_id).await?;
    Ok(Json(data))
}

pub async fn create_allocation(
    State(state): State<AppState>,
    Json(payload): Json<CreateLeaveAllocationRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrLeaveAllocation>>), AppError> {
    let data = state.hr_leaves_service.create_allocation(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Alokasi saldo cuti berhasil"))))
}

pub async fn bulk_allocate(
    State(state): State<AppState>,
    Json(payload): Json<BulkLeaveAllocationRequest>,
) -> Result<(StatusCode, Json<ApiResponse<Vec<HrLeaveAllocation>>>), AppError> {
    let data = state.hr_leaves_service.bulk_allocate(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Alokasi saldo cuti massal berhasil"))))
}

pub async fn get_leave_balance(
    State(state): State<AppState>,
    Path(employee_id): Path<Uuid>,
) -> Result<Json<Vec<LeaveBalanceSummary>>, AppError> {
    let data = state.hr_leaves_service.get_leave_balance(employee_id).await?;
    Ok(Json(data))
}

// ---- APPLICATIONS ----
pub async fn list_applications(
    State(state): State<AppState>,
    Query(params): Query<LeaveQueryParams>,
) -> Result<Json<Vec<HrLeaveApplication>>, AppError> {
    let data = state.hr_leaves_service.list_applications(params).await?;
    Ok(Json(data))
}

pub async fn get_application(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<HrLeaveApplication>, AppError> {
    let data = state.hr_leaves_service.get_application(id).await?;
    Ok(Json(data))
}

pub async fn create_application(
    State(state): State<AppState>,
    Json(payload): Json<CreateLeaveApplicationRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrLeaveApplication>>), AppError> {
    let data = state.hr_leaves_service.create_application(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Permohonan cuti berhasil diajukan"))))
}

pub async fn review_application(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ReviewLeaveApplicationRequest>,
) -> Result<Json<ApiResponse<HrLeaveApplication>>, AppError> {
    let data = state.hr_leaves_service.review_application(id, payload, Some(claims.user_id())).await?;
    Ok(Json(ApiResponse::success_with_message(data, "Status permohonan cuti berhasil diperbarui")))
}

// ---- HOLIDAYS ----
pub async fn list_holiday_lists(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrHolidayList>>, AppError> {
    let data = state.hr_leaves_service.list_holiday_lists().await?;
    Ok(Json(data))
}

pub async fn list_holidays(
    State(state): State<AppState>,
    Path(holiday_list_id): Path<Uuid>,
) -> Result<Json<Vec<HrHoliday>>, AppError> {
    let data = state.hr_leaves_service.list_holidays(holiday_list_id).await?;
    Ok(Json(data))
}

pub async fn add_holiday(
    State(state): State<AppState>,
    Path(holiday_list_id): Path<Uuid>,
    Json(payload): Json<AddHolidayRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrHoliday>>), AppError> {
    let data = state.hr_leaves_service.add_holiday(holiday_list_id, payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Hari libur berhasil ditambahkan"))))
}

// ---- BLOCK LISTS ----
pub async fn list_block_lists(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrLeaveBlockList>>, AppError> {
    let data = state.hr_leaves_service.list_block_lists().await?;
    Ok(Json(data))
}
