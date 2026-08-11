use axum::{
    extract::{State, Path},
    Json,
};
use uuid::Uuid;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::quotation::CreateQuotationRequest,
    infrastructure::repositories::QuotationRepository,
};
use std::sync::Arc;

#[derive(Clone)]
pub struct QuotationHandler {
    repo: Arc<QuotationRepository>,
}

impl QuotationHandler {
    pub fn new(repo: Arc<QuotationRepository>) -> Self {
        Self { repo }
    }

    pub async fn create_quotation(
        State(handler): State<Self>,
        Json(payload): Json<CreateQuotationRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let quotation = handler.repo.create_quotation(payload).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create quotation: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(quotation).unwrap(),
            message: Some("Quotation created successfully".to_string()),
        }))
    }

    pub async fn list_quotations(
        State(handler): State<Self>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let quotations = handler.repo.list_quotations().await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list quotations: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(quotations).unwrap(),
            message: None,
        }))
    }
}
