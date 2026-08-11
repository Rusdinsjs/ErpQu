use axum::{
    extract::{State},
    Json,
};
use std::sync::Arc;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::{
        buying_master_data::*,
        UserClaims
    },
    infrastructure::repositories::BuyingMasterDataRepository,
};

#[derive(Clone)]
pub struct BuyingMasterDataHandler {
    repo: Arc<BuyingMasterDataRepository>,
}

impl BuyingMasterDataHandler {
    pub fn new(repo: Arc<BuyingMasterDataRepository>) -> Self {
        Self { repo }
    }

    // --- Supplier Groups ---
    pub async fn create_supplier_group(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSupplierGroupRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_group(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create supplier group: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Group created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_groups(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_groups(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list supplier groups: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Supplier Contacts ---
    pub async fn create_supplier_contact(
        State(handler): State<Self>,
        Json(payload): Json<CreateSupplierContactRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_contact(payload).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create supplier contact: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Contact created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_contacts(
        State(handler): State<Self>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_contacts().await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list supplier contacts: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Supplier Addresses ---
    pub async fn create_supplier_address(
        State(handler): State<Self>,
        Json(payload): Json<CreateSupplierAddressRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_supplier_address(payload).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create supplier address: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Supplier Address created successfully".to_string()),
        }))
    }

    pub async fn list_supplier_addresses(
        State(handler): State<Self>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_supplier_addresses().await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list supplier addresses: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Buying Settings ---
    pub async fn create_buying_settings(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateBuyingSettingsRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_buying_settings(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create buying settings: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Buying Settings created successfully".to_string()),
        }))
    }

    pub async fn list_buying_settings(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_buying_settings(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list buying settings: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Purchase Taxes Templates ---
    pub async fn create_purchase_taxes_template(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePurchaseTaxesTemplateRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_purchase_taxes_template(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create purchase taxes template: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Purchase Taxes Template created successfully".to_string()),
        }))
    }

    pub async fn list_purchase_taxes_templates(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_purchase_taxes_templates(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list purchase taxes templates: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }
}
