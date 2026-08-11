use axum::{
    extract::{State},
    Json,
};
use std::sync::Arc;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::{
        sales_pos_data::*,
        UserClaims
    },
    infrastructure::repositories::SalesPosDataRepository,
};

#[derive(Clone)]
pub struct SalesPosDataHandler {
    repo: Arc<SalesPosDataRepository>,
}

impl SalesPosDataHandler {
    pub fn new(repo: Arc<SalesPosDataRepository>) -> Self {
        Self { repo }
    }

    // --- POS Profiles ---
    pub async fn create_pos_profile(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePosProfileRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_pos_profile(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create POS profile: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("POS Profile created successfully".to_string()),
        }))
    }

    pub async fn list_pos_profiles(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_pos_profiles(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list POS profiles: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- POS Settings ---
    pub async fn create_pos_settings(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePosSettingsRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_pos_settings(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create POS settings: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("POS Settings created successfully".to_string()),
        }))
    }

    pub async fn list_pos_settings(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_pos_settings(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list POS settings: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- POS Opening Entries ---
    pub async fn create_pos_opening_entry(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePosOpeningEntryRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_pos_opening_entry(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create POS opening entry: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("POS Opening Entry created successfully".to_string()),
        }))
    }

    pub async fn list_pos_opening_entries(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_pos_opening_entries(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list POS opening entries: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- POS Closing Entries ---
    pub async fn create_pos_closing_entry(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePosClosingEntryRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_pos_closing_entry(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create POS closing entry: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("POS Closing Entry created successfully".to_string()),
        }))
    }

    pub async fn list_pos_closing_entries(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_pos_closing_entries(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list POS closing entries: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Loyalty Programs ---
    pub async fn create_loyalty_program(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateLoyaltyProgramRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_loyalty_program(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create loyalty program: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Loyalty Program created successfully".to_string()),
        }))
    }

    pub async fn list_loyalty_programs(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_loyalty_programs(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list loyalty programs: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Loyalty Point Entries ---
    pub async fn create_loyalty_point_entry(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateLoyaltyPointEntryRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_loyalty_point_entry(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create loyalty point entry: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Loyalty Point Entry created successfully".to_string()),
        }))
    }

    pub async fn list_loyalty_point_entries(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_loyalty_point_entries(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list loyalty point entries: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }
}
