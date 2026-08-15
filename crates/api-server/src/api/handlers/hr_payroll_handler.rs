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
    HrPayrollEntry, HrSalaryAssignment, HrSalaryComponent, HrSalarySlip, HrSalaryStructure,
};
use management_system_hr::dto::{
    CreateSalaryAssignmentRequest, PayrollQueryParams, RunPayrollEntryRequest,
};

// ---- SALARY COMPONENTS ----
pub async fn list_salary_components(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrSalaryComponent>>, AppError> {
    let data = state.hr_payroll_service.list_salary_components().await?;
    Ok(Json(data))
}

// ---- SALARY STRUCTURES ----
pub async fn list_salary_structures(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrSalaryStructure>>, AppError> {
    let data = state.hr_payroll_service.list_salary_structures().await?;
    Ok(Json(data))
}

pub async fn get_salary_component(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<HrSalaryComponent>, AppError> {
    let data = state.hr_payroll_service.get_salary_component(id).await?;
    Ok(Json(data))
}

pub async fn create_salary_component(
    State(state): State<AppState>,
    Json(payload): Json<management_system_hr::dto::CreateSalaryComponentRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrSalaryComponent>>), AppError> {
    let data = state
        .hr_payroll_service
        .create_salary_component(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Komponen gaji berhasil ditambahkan",
        )),
    ))
}

pub async fn update_salary_component(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<management_system_hr::dto::UpdateSalaryComponentRequest>,
) -> Result<Json<ApiResponse<HrSalaryComponent>>, AppError> {
    let data = state
        .hr_payroll_service
        .update_salary_component(id, payload)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Komponen gaji berhasil diperbarui",
    )))
}

pub async fn delete_salary_component(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.hr_payroll_service.delete_salary_component(id).await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Komponen gaji berhasil dihapus",
    )))
}

pub async fn get_salary_structure(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<HrSalaryStructure>, AppError> {
    let data = state.hr_payroll_service.get_salary_structure(id).await?;
    Ok(Json(data))
}

pub async fn create_salary_structure(
    State(state): State<AppState>,
    Json(payload): Json<management_system_hr::dto::CreateSalaryStructureRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrSalaryStructure>>), AppError> {
    let data = state
        .hr_payroll_service
        .create_salary_structure(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Struktur gaji berhasil ditambahkan",
        )),
    ))
}

pub async fn update_salary_structure(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<management_system_hr::dto::UpdateSalaryStructureRequest>,
) -> Result<Json<ApiResponse<HrSalaryStructure>>, AppError> {
    let data = state
        .hr_payroll_service
        .update_salary_structure(id, payload)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Struktur gaji berhasil diperbarui",
    )))
}

pub async fn delete_salary_structure(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.hr_payroll_service.delete_salary_structure(id).await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Struktur gaji berhasil dihapus",
    )))
}

// ---- SALARY ASSIGNMENTS ----
pub async fn list_salary_assignments(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrSalaryAssignment>>, AppError> {
    let data = state.hr_payroll_service.list_salary_assignments().await?;
    Ok(Json(data))
}

pub async fn create_salary_assignment(
    State(state): State<AppState>,
    Json(payload): Json<CreateSalaryAssignmentRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrSalaryAssignment>>), AppError> {
    let data = state
        .hr_payroll_service
        .create_salary_assignment(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Penetapan gaji karyawan berhasil disimpan",
        )),
    ))
}

// ---- PAYROLL ENTRIES (BATCH RUN) ----
pub async fn list_payroll_entries(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrPayrollEntry>>, AppError> {
    let data = state.hr_payroll_service.list_payroll_entries().await?;
    Ok(Json(data))
}

pub async fn run_payroll_entry(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<RunPayrollEntryRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrPayrollEntry>>), AppError> {
    let data = state
        .hr_payroll_service
        .run_payroll(payload, Some(claims.user_id()))
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Proses kalkulasi penggajian bulanan selesai",
        )),
    ))
}

// ---- SALARY SLIPS ----
pub async fn list_salary_slips(
    State(state): State<AppState>,
    Query(params): Query<PayrollQueryParams>,
) -> Result<Json<Vec<HrSalarySlip>>, AppError> {
    let data = state.hr_payroll_service.list_salary_slips(params).await?;
    Ok(Json(data))
}

pub async fn get_salary_slip(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<HrSalarySlip>, AppError> {
    let data = state.hr_payroll_service.get_salary_slip(id).await?;
    Ok(Json(data))
}
