use crate::api::server::AppState;
use axum::{
    extract::{Path, State},
    Extension, Json,
};
use management_system_core::application::dto::ApiResponse;
use management_system_core::domain::entities::UserClaims as Claims;
use management_system_core::shared::errors::AppError;
use management_system_inventory::{
    CreateMaterialRequest, CreateStockEntryRequest, MaterialRequest, MaterialRequestItem,
    StockEntry, StockEntryItem,
};
use uuid::Uuid;

// --- Stock Entries ---

pub async fn create_stock_entry(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateStockEntryRequest>,
) -> Result<Json<ApiResponse<(StockEntry, Vec<StockEntryItem>)>>, AppError> {
    let result = state
        .stock_document_service
        .create_stock_entry(payload, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn get_stock_entry(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<(StockEntry, Vec<StockEntryItem>)>>, AppError> {
    let result = state.stock_document_service.get_stock_entry(id).await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn list_stock_entries(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<StockEntry>>>, AppError> {
    let entries = state
        .stock_document_service
        .list_stock_entries(company_id)
        .await?;
    Ok(Json(ApiResponse::success(entries)))
}

pub async fn submit_stock_entry(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<(StockEntry, Vec<StockEntryItem>)>>, AppError> {
    let result = state
        .stock_document_service
        .submit_stock_entry(id, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

// --- Material Requests ---

pub async fn create_material_request(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateMaterialRequest>,
) -> Result<Json<ApiResponse<(MaterialRequest, Vec<MaterialRequestItem>)>>, AppError> {
    let result = state
        .stock_document_service
        .create_material_request(payload, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn get_material_request(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<(MaterialRequest, Vec<MaterialRequestItem>)>>, AppError> {
    let result = state
        .stock_document_service
        .get_material_request(id)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn list_material_requests(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<MaterialRequest>>>, AppError> {
    let requests = state
        .stock_document_service
        .list_material_requests(company_id)
        .await?;
    Ok(Json(ApiResponse::success(requests)))
}

pub async fn approve_material_request(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<MaterialRequest>>, AppError> {
    let result = state
        .stock_document_service
        .approve_material_request(id, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success(result)))
}
