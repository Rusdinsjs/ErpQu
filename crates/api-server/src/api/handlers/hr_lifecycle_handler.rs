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
use management_system_hr::dto::hr_lifecycle_dto::{
    CreateDesignationRequest, CreateEmployeeDocumentRequest, CreateEmployeeEducationRequest,
    CreateEmploymentTypeRequest, CreateLifecycleEventRequest, LifecycleQueryParams,
    UpdateDesignationRequest,
};

// ---- DESIGNATIONS ----

pub async fn list_designations(
    State(state): State<AppState>,
) -> Result<Json<Vec<management_system_hr::domain::entities::HrDesignation>>, AppError> {
    let data = state.hr_lifecycle_service.list_designations().await?;
    Ok(Json(data))
}

pub async fn get_designation(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<management_system_hr::domain::entities::HrDesignation>, AppError> {
    let data = state.hr_lifecycle_service.get_designation(id).await?;
    Ok(Json(data))
}

pub async fn create_designation(
    State(state): State<AppState>,
    Json(payload): Json<CreateDesignationRequest>,
) -> Result<
    (
        StatusCode,
        Json<ApiResponse<management_system_hr::domain::entities::HrDesignation>>,
    ),
    AppError,
> {
    let data = state
        .hr_lifecycle_service
        .create_designation(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Jabatan berhasil dibuat",
        )),
    ))
}

pub async fn update_designation(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateDesignationRequest>,
) -> Result<Json<ApiResponse<management_system_hr::domain::entities::HrDesignation>>, AppError> {
    let data = state
        .hr_lifecycle_service
        .update_designation(id, payload)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Jabatan berhasil diperbarui",
    )))
}

pub async fn delete_designation(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.hr_lifecycle_service.delete_designation(id).await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Jabatan berhasil dihapus",
    )))
}

// ---- EMPLOYMENT TYPES ----

pub async fn list_employment_types(
    State(state): State<AppState>,
) -> Result<Json<Vec<management_system_hr::domain::entities::HrEmploymentType>>, AppError> {
    let data = state.hr_lifecycle_service.list_employment_types().await?;
    Ok(Json(data))
}

pub async fn create_employment_type(
    State(state): State<AppState>,
    Json(payload): Json<CreateEmploymentTypeRequest>,
) -> Result<
    (
        StatusCode,
        Json<ApiResponse<management_system_hr::domain::entities::HrEmploymentType>>,
    ),
    AppError,
> {
    let data = state
        .hr_lifecycle_service
        .create_employment_type(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Tipe kepegawaian berhasil dibuat",
        )),
    ))
}

// ---- LIFECYCLE EVENTS ----

pub async fn list_lifecycle_events(
    State(state): State<AppState>,
    Query(params): Query<LifecycleQueryParams>,
) -> Result<Json<Vec<management_system_hr::domain::entities::HrEmployeeLifecycle>>, AppError> {
    let data = state
        .hr_lifecycle_service
        .list_lifecycle_events(params.employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_lifecycle_event(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<CreateLifecycleEventRequest>,
) -> Result<
    (
        StatusCode,
        Json<ApiResponse<management_system_hr::domain::entities::HrEmployeeLifecycle>>,
    ),
    AppError,
> {
    // Actor identity is taken from the authenticated session, never from the payload.
    let data = state
        .hr_lifecycle_service
        .create_lifecycle_event(payload, Some(claims.user_id()))
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Kejadian karir berhasil dicatat",
        )),
    ))
}

// ---- EMPLOYEE DOCUMENTS ----

pub async fn list_employee_documents(
    State(state): State<AppState>,
    Path(employee_id): Path<Uuid>,
) -> Result<Json<Vec<management_system_hr::domain::entities::HrEmployeeDocument>>, AppError> {
    let data = state
        .hr_lifecycle_service
        .list_employee_documents(employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_employee_document(
    State(state): State<AppState>,
    Json(payload): Json<CreateEmployeeDocumentRequest>,
) -> Result<
    (
        StatusCode,
        Json<ApiResponse<management_system_hr::domain::entities::HrEmployeeDocument>>,
    ),
    AppError,
> {
    let data = state
        .hr_lifecycle_service
        .create_employee_document(payload, None)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Dokumen berhasil diunggah",
        )),
    ))
}

pub async fn delete_employee_document(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state
        .hr_lifecycle_service
        .delete_employee_document(id)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Dokumen berhasil dihapus",
    )))
}

// ---- EMPLOYEE EDUCATION ----

pub async fn list_employee_education(
    State(state): State<AppState>,
    Path(employee_id): Path<Uuid>,
) -> Result<Json<Vec<management_system_hr::domain::entities::HrEmployeeEducation>>, AppError> {
    let data = state
        .hr_lifecycle_service
        .list_employee_education(employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_employee_education(
    State(state): State<AppState>,
    Json(payload): Json<CreateEmployeeEducationRequest>,
) -> Result<
    (
        StatusCode,
        Json<ApiResponse<management_system_hr::domain::entities::HrEmployeeEducation>>,
    ),
    AppError,
> {
    let data = state
        .hr_lifecycle_service
        .create_employee_education(payload)
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Riwayat pendidikan berhasil ditambahkan",
        )),
    ))
}

pub async fn delete_employee_education(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state
        .hr_lifecycle_service
        .delete_employee_education(id)
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Riwayat pendidikan berhasil dihapus",
    )))
}

// ---- EMPLOYEE 360 VIEW ----

pub async fn get_employee_360(
    State(state): State<AppState>,
    Path(employee_id): Path<Uuid>,
) -> Result<Json<management_system_hr::dto::hr_lifecycle_dto::Employee360Response>, AppError> {
    let data = state
        .hr_lifecycle_service
        .get_employee_360(employee_id)
        .await?;
    Ok(Json(data))
}
