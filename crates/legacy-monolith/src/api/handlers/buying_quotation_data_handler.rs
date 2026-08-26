use axum::{
    extract::{State},
    Json,
};
use std::sync::Arc;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::{
        buying_quotation_data::*,
        UserClaims
    },
    infrastructure::repositories::BuyingQuotationDataRepository,
};

#[derive(Clone)]
pub struct BuyingQuotationDataHandler {
    repo: Arc<BuyingQuotationDataRepository>,
}

impl BuyingQuotationDataHandler {
    pub fn new(repo: Arc<BuyingQuotationDataRepository>) -> Self {
        Self { repo }
    }

    // --- Request For Quotation ---
    pub async fn create_request_for_quotation(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateRequestForQuotationRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_request_for_quotation(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create RFQ: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("RFQ created successfully".to_string()),
        }))
    }

    pub async fn list_requests_for_quotation(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_requests_for_quotation(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list RFQs: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Supplier Quotation ---
    pub async fn create_supplier_quotation(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSupplierQuotationRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_quotation(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create Supplier Quotation: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Quotation created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_quotations(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_quotations(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list Supplier Quotations: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Subcontracting Order ---
    pub async fn create_subcontracting_order(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSubcontractingOrderRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_subcontracting_order(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create Subcontracting Order: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Subcontracting Order created successfully".to_string()),
        }))
    }

    pub async fn list_subcontracting_orders(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_subcontracting_orders(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list Subcontracting Orders: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }
}
