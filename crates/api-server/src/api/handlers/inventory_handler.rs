use crate::api::server::AppState;
use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use management_system_core::application::dto::{
    ApiResponse, CreateInventoryCategoryRequest, CreateInventoryItemRequest,
    CreateWarehouseRequest, InventoryAdjustmentRequest, UpdateInventoryCategoryRequest,
    UpdateInventoryItemRequest,
};
use management_system_core::domain::entities::UserClaims as Claims;
use management_system_core::domain::request_context::RequestContext;
use management_system_core::shared::errors::AppError;
use management_system_inventory::{
    AddItemAlternativeRequest, CreateProductBundleRequest, CreateWarehouseBinRequest,
    InventoryCategory, InventoryItem, InventoryMovement, ItemAlternative, ItemBinBalance,
    ProductBundle, ProductBundleItem, WarehouseBin,
};
use uuid::Uuid;

pub async fn create_inventory_category(
    State(state): State<AppState>,
    Json(payload): Json<CreateInventoryCategoryRequest>,
) -> Result<Json<ApiResponse<InventoryCategory>>, AppError> {
    let category = state.inventory_service.create_category(payload).await?;
    Ok(Json(ApiResponse::success(category)))
}

pub async fn list_inventory_categories(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<InventoryCategory>>>, AppError> {
    let categories = state.inventory_service.list_categories().await?;
    Ok(Json(ApiResponse::success(categories)))
}

pub async fn get_inventory_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<InventoryCategory>>, AppError> {
    let category = state
        .inventory_service
        .get_category(id)
        .await?
        .ok_or(AppError::NotFound(format!(
            "Category with id {} not found",
            id
        )))?;
    Ok(Json(ApiResponse::success(category)))
}

pub async fn update_inventory_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateInventoryCategoryRequest>,
) -> Result<Json<ApiResponse<InventoryCategory>>, AppError> {
    let category = state.inventory_service.update_category(id, payload).await?;
    Ok(Json(ApiResponse::success(category)))
}

pub async fn delete_inventory_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<bool>>, AppError> {
    let success = state.inventory_service.delete_category(id).await?;
    Ok(Json(ApiResponse::success(success)))
}

pub async fn create_item(
    State(state): State<AppState>,
    Json(payload): Json<CreateInventoryItemRequest>,
) -> Result<Json<ApiResponse<InventoryItem>>, AppError> {
    let item = state.inventory_service.create_item(payload).await?;
    Ok(Json(ApiResponse::success(item)))
}

pub async fn list_items(
    State(state): State<AppState>,
    Query(query): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<ApiResponse<Vec<InventoryItem>>>, AppError> {
    let category_id = query
        .get("category_id")
        .and_then(|id| Uuid::parse_str(id).ok());
    let search = query.get("search").cloned();
    let items = state
        .inventory_service
        .list_items(category_id, search)
        .await?;
    Ok(Json(ApiResponse::success(items)))
}

pub async fn get_item(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<InventoryItem>>, AppError> {
    let item = state
        .inventory_service
        .get_item(id)
        .await?
        .ok_or(AppError::NotFound(format!("Item with id {} not found", id)))?;
    Ok(Json(ApiResponse::success(item)))
}

pub async fn update_item(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateInventoryItemRequest>,
) -> Result<Json<ApiResponse<InventoryItem>>, AppError> {
    let item = state.inventory_service.update_item(id, payload).await?;
    Ok(Json(ApiResponse::success(item)))
}

pub async fn delete_item(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<bool>>, AppError> {
    let success = state.inventory_service.delete_item(id).await?;
    Ok(Json(ApiResponse::success(success)))
}

pub async fn adjust_stock(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<InventoryAdjustmentRequest>,
) -> Result<Json<ApiResponse<bool>>, AppError> {
    let success = state
        .inventory_service
        .adjust_stock(id, payload, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success(success)))
}

pub async fn batch_adjust_stock(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<management_system_core::application::dto::BatchInventoryAdjustmentRequest>,
) -> Result<Json<ApiResponse<bool>>, AppError> {
    let success = state
        .inventory_service
        .adjust_stock_batch(payload, Some(claims.user_id()))
        .await?;
    Ok(Json(ApiResponse::success(success)))
}

pub async fn list_movements_history(
    State(state): State<AppState>,
    Query(query): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<ApiResponse<Vec<InventoryMovement>>>, AppError> {
    let item_id = query.get("item_id").and_then(|id| Uuid::parse_str(id).ok());
    let limit = query
        .get("limit")
        .and_then(|l| l.parse::<i64>().ok())
        .unwrap_or(50);

    let movements = state
        .inventory_service
        .list_movements(item_id, limit)
        .await?;
    Ok(Json(ApiResponse::success(movements)))
}

pub async fn list_warehouses(
    State(state): State<AppState>,
    Extension(req_ctx): Extension<RequestContext>,
) -> Result<Json<ApiResponse<Vec<management_system_inventory::Warehouse>>>, AppError> {
    let tenant_id = req_ctx.tenant_context.tenant_id;
    let warehouses = state.inventory_service.list_warehouses(tenant_id).await?;
    Ok(Json(ApiResponse::success(warehouses)))
}

pub async fn create_warehouse(
    State(state): State<AppState>,
    Extension(req_ctx): Extension<RequestContext>,
    Json(payload): Json<CreateWarehouseRequest>,
) -> Result<Json<ApiResponse<management_system_inventory::Warehouse>>, AppError> {
    // Enforce tenant boundary for the company the warehouse is being created under
    // If company_id is provided, check if user's tenant owns that company
    req_ctx
        .tenant_context
        .enforce_company_boundary(Some(payload.company_id))?;

    let warehouse = state.inventory_service.create_warehouse(payload).await?;
    Ok(Json(ApiResponse::success(warehouse)))
}

pub async fn delete_warehouse(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.inventory_service.delete_warehouse(id).await?;
    Ok(Json(ApiResponse::success(())))
}

pub async fn create_product_bundle(
    State(state): State<AppState>,
    Json(payload): Json<CreateProductBundleRequest>,
) -> Result<Json<ApiResponse<(ProductBundle, Vec<ProductBundleItem>)>>, AppError> {
    let result = state
        .inventory_service
        .create_product_bundle(payload)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn get_product_bundle(
    State(state): State<AppState>,
    Path(parent_item_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Option<(ProductBundle, Vec<ProductBundleItem>)>>>, AppError> {
    let result = state
        .inventory_service
        .get_product_bundle(parent_item_id)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn add_item_alternative(
    State(state): State<AppState>,
    Json(payload): Json<AddItemAlternativeRequest>,
) -> Result<Json<ApiResponse<ItemAlternative>>, AppError> {
    let result = state
        .inventory_service
        .add_item_alternative(payload)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn get_item_alternatives(
    State(state): State<AppState>,
    Path(item_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<ItemAlternative>>>, AppError> {
    let result = state
        .inventory_service
        .get_item_alternatives(item_id)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

// --- Warehouse Bins & Location Ledger ---

pub async fn create_warehouse_bin(
    State(state): State<AppState>,
    Json(payload): Json<CreateWarehouseBinRequest>,
) -> Result<Json<ApiResponse<WarehouseBin>>, AppError> {
    let bin = state
        .inventory_service
        .create_warehouse_bin(payload)
        .await?;
    Ok(Json(ApiResponse::success(bin)))
}

pub async fn get_warehouse_bin(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Option<WarehouseBin>>>, AppError> {
    let bin = state.inventory_service.get_warehouse_bin(id).await?;
    Ok(Json(ApiResponse::success(bin)))
}

pub async fn list_warehouse_bins(
    State(state): State<AppState>,
    Path(warehouse_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<WarehouseBin>>>, AppError> {
    let bins = state
        .inventory_service
        .list_warehouse_bins(warehouse_id)
        .await?;
    Ok(Json(ApiResponse::success(bins)))
}

pub async fn delete_warehouse_bin(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<bool>>, AppError> {
    let success = state.inventory_service.delete_warehouse_bin(id).await?;
    Ok(Json(ApiResponse::success(success)))
}

pub async fn list_bin_balances(
    State(state): State<AppState>,
    Path(warehouse_bin_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<ItemBinBalance>>>, AppError> {
    let balances = state
        .inventory_service
        .list_bin_balances(warehouse_bin_id)
        .await?;
    Ok(Json(ApiResponse::success(balances)))
}

pub async fn list_bin_balances_by_item(
    State(state): State<AppState>,
    Path(item_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<ItemBinBalance>>>, AppError> {
    let balances = state
        .inventory_service
        .list_bin_balances_by_item(item_id)
        .await?;
    Ok(Json(ApiResponse::success(balances)))
}

pub async fn list_low_stock_items(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<InventoryItem>>>, AppError> {
    let items = state.inventory_service.list_low_stock_items().await?;
    Ok(Json(ApiResponse::success(items)))
}

pub async fn get_abc_analysis(
    State(state): State<AppState>,
) -> Result<
    Json<ApiResponse<management_system_inventory::domain::abc_analysis::AbcAnalysisReport>>,
    AppError,
> {
    let report = state.inventory_service.get_abc_analysis().await?;
    Ok(Json(ApiResponse::success(report)))
}
