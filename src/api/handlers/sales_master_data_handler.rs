use axum::{
    extract::{State},
    Json,
};
use std::sync::Arc;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::{
        sales_master_data::*,
        UserClaims
    },
    infrastructure::repositories::SalesMasterDataRepository,
};

#[derive(Clone)]
pub struct SalesMasterDataHandler {
    repo: Arc<SalesMasterDataRepository>,
}

impl SalesMasterDataHandler {
    pub fn new(repo: Arc<SalesMasterDataRepository>) -> Self {
        Self { repo }
    }

    // --- Customer Groups ---
    pub async fn create_customer_group(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateCustomerGroupRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_customer_group(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create customer group: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Customer Group created successfully".to_string()),
        }))
    }

    pub async fn list_customer_groups(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_customer_groups(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list customer groups: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Customer Contacts ---
    pub async fn create_customer_contact(
        State(handler): State<Self>,
        Json(payload): Json<CreateCustomerContactRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_customer_contact(payload).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create contact: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Contact created successfully".to_string()),
        }))
    }

    pub async fn list_customer_contacts(
        State(handler): State<Self>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_customer_contacts().await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list contacts: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Customer Addresses ---
    pub async fn create_customer_address(
        State(handler): State<Self>,
        Json(payload): Json<CreateCustomerAddressRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_customer_address(payload).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create address: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Address created successfully".to_string()),
        }))
    }

    pub async fn list_customer_addresses(
        State(handler): State<Self>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_customer_addresses().await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list addresses: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Territories ---
    pub async fn create_territory(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateTerritoryRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_territory(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create territory: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Territory created successfully".to_string()),
        }))
    }

    pub async fn list_territories(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_territories(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list territories: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Sales Partners ---
    pub async fn create_sales_partner(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSalesPartnerRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_sales_partner(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create sales partner: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Sales Partner created successfully".to_string()),
        }))
    }

    pub async fn list_sales_partners(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_sales_partners(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list sales partners: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Sales Persons ---
    pub async fn create_sales_person(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateSalesPersonRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_sales_person(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create sales person: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Sales Person created successfully".to_string()),
        }))
    }

    pub async fn list_sales_persons(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_sales_persons(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list sales persons: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }
}
