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
    HrAppraisalTemplate, HrAppraisalTemplateItem, HrEmployeeAppraisal, HrEmployeeLoan,
    HrExpenseClaim, HrExpenseClaimType, HrLoanRepaymentSchedule, HrLoanType,
};
use management_system_hr::dto::{
    CreateAppraisalRequest, CreateExpenseClaimRequest, CreateLoanRequest,
    ReviewExpenseClaimRequest, ReviewLoanRequest,
};

#[derive(Debug, Deserialize)]
pub struct EmployeeFilterParams {
    pub employee_id: Option<Uuid>,
}

// ---- LOAN TYPES ----
pub async fn list_loan_types(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrLoanType>>, AppError> {
    let data = state.hr_loans_claims_kpi_service.list_loan_types().await?;
    Ok(Json(data))
}

// ---- EMPLOYEE LOANS ----
pub async fn list_employee_loans(
    State(state): State<AppState>,
    Query(params): Query<EmployeeFilterParams>,
) -> Result<Json<Vec<HrEmployeeLoan>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .list_employee_loans(params.employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn apply_loan(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<CreateLoanRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrEmployeeLoan>>), AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .apply_loan(payload, Some(claims.user_id()))
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Pengajuan pinjaman / kasbon berhasil dikirim",
        )),
    ))
}

pub async fn review_loan(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<ReviewLoanRequest>,
) -> Result<Json<ApiResponse<HrEmployeeLoan>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .review_loan(id, payload, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Status pinjaman berhasil diperbarui",
    )))
}

pub async fn list_repayment_schedules(
    State(state): State<AppState>,
    Path(loan_id): Path<Uuid>,
) -> Result<Json<Vec<HrLoanRepaymentSchedule>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .list_repayment_schedules(loan_id)
        .await?;
    Ok(Json(data))
}

// ---- EXPENSE CLAIM TYPES ----
pub async fn list_expense_claim_types(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrExpenseClaimType>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .list_expense_claim_types()
        .await?;
    Ok(Json(data))
}

// ---- EXPENSE CLAIMS ----
pub async fn list_expense_claims(
    State(state): State<AppState>,
    Query(params): Query<EmployeeFilterParams>,
) -> Result<Json<Vec<HrExpenseClaim>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .list_expense_claims(params.employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn create_expense_claim(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<CreateExpenseClaimRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrExpenseClaim>>), AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .create_expense_claim(payload, Some(claims.user_id()))
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Klaim reimbursement berhasil diajukan",
        )),
    ))
}

pub async fn review_expense_claim(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<ReviewExpenseClaimRequest>,
) -> Result<Json<ApiResponse<HrExpenseClaim>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .review_expense_claim(id, payload, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success_with_message(
        data,
        "Status klaim berhasil diperbarui",
    )))
}

// ---- APPRAISAL & KPI ----
pub async fn list_appraisal_templates(
    State(state): State<AppState>,
) -> Result<Json<Vec<HrAppraisalTemplate>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .list_appraisal_templates()
        .await?;
    Ok(Json(data))
}

pub async fn list_template_items(
    State(state): State<AppState>,
    Path(template_id): Path<Uuid>,
) -> Result<Json<Vec<HrAppraisalTemplateItem>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .list_template_items(template_id)
        .await?;
    Ok(Json(data))
}

pub async fn list_employee_appraisals(
    State(state): State<AppState>,
    Query(params): Query<EmployeeFilterParams>,
) -> Result<Json<Vec<HrEmployeeAppraisal>>, AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .list_employee_appraisals(params.employee_id)
        .await?;
    Ok(Json(data))
}

pub async fn submit_employee_appraisal(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<CreateAppraisalRequest>,
) -> Result<(StatusCode, Json<ApiResponse<HrEmployeeAppraisal>>), AppError> {
    let data = state
        .hr_loans_claims_kpi_service
        .submit_appraisal(payload, Some(claims.user_id()))
        .await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            data,
            "Penilaian kinerja KPI berhasil disimpan",
        )),
    ))
}
