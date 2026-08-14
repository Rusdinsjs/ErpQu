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
    HrDisciplinaryAction, HrEmployeeCertification, HrJobApplicant, HrJobOpening,
    HrTrainingEvent, HrTrainingParticipant, HrTrainingProgram,
};
use management_system_hr::dto::{
    AddTrainingParticipantRequest, ConvertApplicantRequest, CreateEmployeeCertificationRequest,
    CreateJobApplicantRequest, CreateJobOpeningRequest, CreateTrainingEventRequest,
    CreateTrainingProgramRequest, IssueDisciplinaryActionRequest, UpdateApplicantStageRequest,
};

#[derive(Debug, Deserialize)]
pub struct JobFilterParams {
    pub job_opening_id: Option<Uuid>,
    pub employee_id: Option<Uuid>,
}

// ---- RECRUITMENT ATS ----
pub async fn list_job_openings(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrJobOpening>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.list_job_openings().await?;
    Ok(Json(data))
}

pub async fn create_job_opening(
    State(state): State<AppState>,
    Json(payload): Json<CreateJobOpeningRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrJobOpening>>), AppError> {
    let data = state.hr_recruitment_training_discipline_service.create_job_opening(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Lowongan pekerjaan berhasil dibuat"))))
}

pub async fn list_job_applicants(
    State(state): State<AppState>,
    Query(params): Query<JobFilterParams>,
) -> Result<Json<Vec<HrJobApplicant>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.list_job_applicants(params.job_opening_id).await?;
    Ok(Json(data))
}

pub async fn create_job_applicant(
    State(state): State<AppState>,
    Json(payload): Json<CreateJobApplicantRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrJobApplicant>>), AppError> {
    let data = state.hr_recruitment_training_discipline_service.create_job_applicant(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Kandidat pelamar berhasil didaftarkan"))))
}

pub async fn update_applicant_stage(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateApplicantStageRequest>,
) -> Result<Json<ApiResponse<HrJobApplicant>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.update_applicant_stage(id, payload).await?;
    Ok(Json(ApiResponse::success_with_message(data, "Tahap seleksi pelamar berhasil diperbarui")))
}

pub async fn convert_applicant_to_employee(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ConvertApplicantRequest>,
) -> Result<Json<ApiResponse<Uuid>>, AppError> {
    let emp_id = state.hr_recruitment_training_discipline_service.convert_applicant_to_employee(id, payload).await?;
    Ok(Json(ApiResponse::success_with_message(emp_id, "Kandidat berhasil diangkat menjadi Karyawan Baru")))
}

// ---- TRAINING & CERTIFICATIONS ----
pub async fn list_training_programs(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrTrainingProgram>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.list_training_programs().await?;
    Ok(Json(data))
}

pub async fn create_training_program(
    State(state): State<AppState>,
    Json(payload): Json<CreateTrainingProgramRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrTrainingProgram>>), AppError> {
    let data = state.hr_recruitment_training_discipline_service.create_training_program(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Program pelatihan berhasil dibuat"))))
}

pub async fn list_training_events(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrTrainingEvent>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.list_training_events().await?;
    Ok(Json(data))
}

pub async fn create_training_event(
    State(state): State<AppState>,
    Json(payload): Json<CreateTrainingEventRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrTrainingEvent>>), AppError> {
    let data = state.hr_recruitment_training_discipline_service.create_training_event(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Event jadwal pelatihan berhasil dibuat"))))
}

pub async fn list_training_participants(
    State(state): State<AppState>,
    Path(event_id): Path<Uuid>,
) -> Result<Json<Vec<HrTrainingParticipant>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.list_training_participants(event_id).await?;
    Ok(Json(data))
}

pub async fn add_training_participant(
    State(state): State<AppState>,
    Path(event_id): Path<Uuid>,
    Json(payload): Json<AddTrainingParticipantRequest>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.hr_recruitment_training_discipline_service.add_training_participant(event_id, payload.employee_id).await?;
    Ok(Json(ApiResponse::success_with_message((), "Peserta berhasil didaftarkan ke event pelatihan")))
}

pub async fn list_employee_certifications(
    State(state): State<AppState>,
    Query(params): Query<JobFilterParams>,
) -> Result<Json<Vec<HrEmployeeCertification>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.list_employee_certifications(params.employee_id).await?;
    Ok(Json(data))
}

pub async fn create_employee_certification(
    State(state): State<AppState>,
    Json(payload): Json<CreateEmployeeCertificationRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrEmployeeCertification>>), AppError> {
    let data = state.hr_recruitment_training_discipline_service.create_employee_certification(payload).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Sertifikat / lisensi karyawan berhasil dicatat"))))
}

// ---- DISCIPLINARY ACTIONS ----
pub async fn list_disciplinary_actions(
    State(state): State<AppState>,
    Query(params): Query<JobFilterParams>,
) -> Result<Json<Vec<HrDisciplinaryAction>>, AppError> {
    let data = state.hr_recruitment_training_discipline_service.list_disciplinary_actions(params.employee_id).await?;
    Ok(Json(data))
}

pub async fn issue_disciplinary_action(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<IssueDisciplinaryActionRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrDisciplinaryAction>>), AppError> {
    let data = state.hr_recruitment_training_discipline_service.issue_disciplinary_action(payload, Some(claims.user_id())).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success_with_message(data, "Surat Peringatan / Tindakan Disiplin berhasil diterbitkan"))))
}
