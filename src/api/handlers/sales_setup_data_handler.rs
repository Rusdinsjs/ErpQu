use axum::{
    extract::{State},
    Json,
};
use std::sync::Arc;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::{
        sales_setup_data::*,
        UserClaims
    },
    infrastructure::repositories::SalesSetupDataRepository,
};

#[derive(Clone)]
pub struct SalesSetupDataHandler {
    repo: Arc<SalesSetupDataRepository>,
}

impl SalesSetupDataHandler {
    pub fn new(repo: Arc<SalesSetupDataRepository>) -> Self {
        Self { repo }
    }

    // --- Blanket Orders ---
    pub async fn create_blanket_order(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateBlanketOrderRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_blanket_order(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create blanket order: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Blanket Order created successfully".to_string()),
        }))
    }

    pub async fn list_blanket_orders(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_blanket_orders(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list blanket orders: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Shipping Rules ---
    pub async fn create_shipping_rule(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateShippingRuleRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_shipping_rule(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create shipping rule: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Shipping Rule created successfully".to_string()),
        }))
    }

    pub async fn list_shipping_rules(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_shipping_rules(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list shipping rules: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Selling Settings ---
    pub async fn create_selling_settings(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSellingSettingsRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_selling_settings(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create selling settings: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Selling Settings created successfully".to_string()),
        }))
    }

    pub async fn list_selling_settings(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_selling_settings(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list selling settings: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Terms and Conditions Templates ---
    pub async fn create_terms_and_conditions_template(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateTermsAndConditionsTemplateRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_terms_and_conditions_template(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create terms and conditions template: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Terms and Conditions Template created successfully".to_string()),
        }))
    }

    pub async fn list_terms_and_conditions_templates(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_terms_and_conditions_templates(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list terms and conditions templates: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Sales Taxes Templates ---
    pub async fn create_sales_taxes_template(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSalesTaxesTemplateRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_sales_taxes_template(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create sales taxes template: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Sales Taxes Template created successfully".to_string()),
        }))
    }

    pub async fn list_sales_taxes_templates(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_sales_taxes_templates(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list sales taxes templates: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- UTM Sources ---
    pub async fn create_utm_source(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateUtmSourceRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_utm_source(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create UTM source: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("UTM Source created successfully".to_string()),
        }))
    }

    pub async fn list_utm_sources(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_utm_sources(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list UTM sources: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Campaigns ---
    pub async fn create_campaign(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateCampaignRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_campaign(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create campaign: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Campaign created successfully".to_string()),
        }))
    }

    pub async fn list_campaigns(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_campaigns(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list campaigns: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }
}
