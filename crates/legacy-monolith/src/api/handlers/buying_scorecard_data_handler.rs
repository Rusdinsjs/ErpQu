use axum::{
    extract::{State},
    Json,
};
use std::sync::Arc;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::{
        buying_scorecard_data::*,
        UserClaims
    },
    infrastructure::repositories::BuyingScorecardDataRepository,
};

#[derive(Clone)]
pub struct BuyingScorecardDataHandler {
    repo: Arc<BuyingScorecardDataRepository>,
}

impl BuyingScorecardDataHandler {
    pub fn new(repo: Arc<BuyingScorecardDataRepository>) -> Self {
        Self { repo }
    }

    // --- Supplier Scorecard ---
    pub async fn create_supplier_scorecard(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSupplierScorecardRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_scorecard(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create Supplier Scorecard: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Scorecard created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_scorecards(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_scorecards(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list Supplier Scorecards: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Supplier Scorecard Variable ---
    pub async fn create_supplier_scorecard_variable(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSupplierScorecardVariableRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_scorecard_variable(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create Supplier Scorecard Variable: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Scorecard Variable created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_scorecard_variables(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_scorecard_variables(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list Supplier Scorecard Variables: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Supplier Scorecard Criteria ---
    pub async fn create_supplier_scorecard_criteria(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSupplierScorecardCriteriaRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_scorecard_criteria(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create Supplier Scorecard Criteria: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Scorecard Criteria created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_scorecard_criteria(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_scorecard_criteria(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list Supplier Scorecard Criteria: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Supplier Scorecard Standing ---
    pub async fn create_supplier_scorecard_standing(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSupplierScorecardStandingRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_scorecard_standing(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create Supplier Scorecard Standing: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Scorecard Standing created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_scorecard_standings(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_scorecard_standings(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list Supplier Scorecard Standings: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }
}
