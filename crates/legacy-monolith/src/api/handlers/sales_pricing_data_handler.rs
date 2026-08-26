use axum::{
    extract::{State},
    Json,
};
use std::sync::Arc;
use crate::{
    api::responses::{ApiResponse, AppError},
    domain::entities::{
        sales_pricing_data::*,
        UserClaims
    },
    infrastructure::repositories::SalesPricingDataRepository,
};

#[derive(Clone)]
pub struct SalesPricingDataHandler {
    repo: Arc<SalesPricingDataRepository>,
}

impl SalesPricingDataHandler {
    pub fn new(repo: Arc<SalesPricingDataRepository>) -> Self {
        Self { repo }
    }

    // --- Price Lists ---
    pub async fn create_price_list(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePriceListRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_price_list(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create price list: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Price List created successfully".to_string()),
        }))
    }

    pub async fn list_price_lists(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_price_lists(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list price lists: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Item Prices ---
    pub async fn create_item_price(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateItemPriceRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_item_price(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create item price: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Item Price created successfully".to_string()),
        }))
    }

    pub async fn list_item_prices(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_item_prices(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list item prices: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Product Bundles ---
    pub async fn create_product_bundle(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateProductBundleRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_product_bundle(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create product bundle: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Product Bundle created successfully".to_string()),
        }))
    }

    pub async fn list_product_bundles(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_product_bundles(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list product bundles: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Pricing Rules ---
    pub async fn create_pricing_rule(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePricingRuleRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_pricing_rule(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create pricing rule: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Pricing Rule created successfully".to_string()),
        }))
    }

    pub async fn list_pricing_rules(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_pricing_rules(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list pricing rules: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Promotional Schemes ---
    pub async fn create_promotional_scheme(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreatePromotionalSchemeRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_promotional_scheme(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create promotional scheme: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Promotional Scheme created successfully".to_string()),
        }))
    }

    pub async fn list_promotional_schemes(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_promotional_schemes(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list promotional schemes: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }

    // --- Coupon Codes ---
    pub async fn create_coupon_code(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
        Json(payload): Json<CreateCouponCodeRequest>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let result = handler.repo.create_coupon_code(payload, claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to create coupon code: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(result).unwrap(),
            message: Some("Coupon Code created successfully".to_string()),
        }))
    }

    pub async fn list_coupon_codes(
        State(handler): State<Self>,
        axum::Extension(claims): axum::Extension<UserClaims>,
    ) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
        let results = handler.repo.list_coupon_codes(claims.company_id).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to list coupon codes: {}", e))
        })?;

        Ok(Json(ApiResponse {
            success: true,
            data: serde_json::to_value(results).unwrap(),
            message: None,
        }))
    }
}
