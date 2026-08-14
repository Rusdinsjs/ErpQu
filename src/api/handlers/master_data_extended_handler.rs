use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use rust_decimal::Decimal;

use crate::api::server::AppState;
use crate::domain::entities::master_data_extended::{Brand, ItemAttribute, ItemAlternative, ProductBundle, ProductBundleItem, Manufacturer};

// Brands
#[derive(Deserialize)]
pub struct CreateBrandRequest {
    pub company_id: Uuid,
    pub brand_name: String,
    pub description: Option<String>,
}

pub async fn create_brand(
    State(state): State<AppState>,
    Json(payload): Json<CreateBrandRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let brand = Brand {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        brand_name: payload.brand_name,
        description: payload.description,
        created_at: chrono::Utc::now(),
    };

    match state.master_data_extended_service.create_brand(brand).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_brands(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.list_brands(company_id).await {
        Ok(brands) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": brands
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn delete_brand(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.delete_bundle(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Deleted successfully"
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

// Item Tax Templates
#[derive(Deserialize)]
pub struct CreateItemTaxTemplateRequest {
    pub company_id: Uuid,
    pub title: String,
    pub tax_rate: Option<rust_decimal::Decimal>,
}

pub async fn create_item_tax_template(
    State(state): State<AppState>,
    Json(payload): Json<CreateItemTaxTemplateRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    use crate::domain::entities::master_data_extended::ItemTaxTemplate;
    let template = ItemTaxTemplate {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        title: payload.title,
        tax_rate: payload.tax_rate,
        created_at: chrono::Utc::now(),
    };

    match state.master_data_extended_service.create_item_tax_template(template).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_item_tax_templates(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.list_item_tax_templates(company_id).await {
        Ok(templates) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": templates
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn delete_item_tax_template(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.delete_item_tax_template(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Deleted successfully"
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

// Item Manufacturers
#[derive(Deserialize)]
pub struct CreateItemManufacturerRequest {
    pub item_id: Uuid,
    pub manufacturer_id: Uuid,
    pub manufacturer_part_no: Option<String>,
}

pub async fn create_item_manufacturer(
    State(state): State<AppState>,
    Json(payload): Json<CreateItemManufacturerRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    use crate::domain::entities::master_data_extended::ItemManufacturer;
    let mfg = ItemManufacturer {
        id: Uuid::new_v4(),
        item_id: payload.item_id,
        manufacturer_id: payload.manufacturer_id,
        manufacturer_part_no: payload.manufacturer_part_no,
        created_at: chrono::Utc::now(),
        item_name: None,
        manufacturer_name: None,
    };

    match state.master_data_extended_service.create_item_manufacturer(mfg).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_item_manufacturers(
    State(state): State<AppState>,
    Path(item_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.list_item_manufacturers(item_id).await {
        Ok(mfgs) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": mfgs
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn delete_item_manufacturer(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.delete_item_manufacturer(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Deleted successfully"
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

// Manufacturers
#[derive(Deserialize)]
pub struct CreateManufacturerRequest {
    pub company_id: Uuid,
    pub name: String,
    pub website: Option<String>,
}

pub async fn create_manufacturer(
    State(state): State<AppState>,
    Json(payload): Json<CreateManufacturerRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let manufacturer = Manufacturer {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        name: payload.name,
        website: payload.website,
        created_at: chrono::Utc::now(),
    };

    match state.master_data_extended_service.create_manufacturer(manufacturer).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_manufacturers(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.list_manufacturers(company_id).await {
        Ok(manufacturers) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": manufacturers
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn delete_manufacturer(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.delete_manufacturer(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Manufacturer deleted"
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

// Item Attributes
#[derive(Deserialize)]
pub struct CreateItemAttributeRequest {
    pub company_id: Uuid,
    pub attribute_name: String,
}

pub async fn create_attribute(
    State(state): State<AppState>,
    Json(payload): Json<CreateItemAttributeRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let attr = ItemAttribute {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        attribute_name: payload.attribute_name,
        created_at: chrono::Utc::now(),
    };

    match state.master_data_extended_service.create_attribute(attr).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_attributes(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.list_attributes(company_id).await {
        Ok(attrs) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": attrs
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn delete_attribute(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.delete_attribute(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Item Attribute deleted"
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

// Item Alternatives
#[derive(Deserialize)]
pub struct CreateItemAlternativeRequest {
    pub item_id: Uuid,
    pub alternative_item_id: Uuid,
    pub two_way: Option<bool>,
}

pub async fn create_alternative(
    State(state): State<AppState>,
    Json(payload): Json<CreateItemAlternativeRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let alt = ItemAlternative {
        id: Uuid::new_v4(),
        item_id: payload.item_id,
        alternative_item_id: payload.alternative_item_id,
        two_way: payload.two_way,
        created_at: chrono::Utc::now(),
        item_name: None,
        alternative_item_name: None,
    };

    match state.master_data_extended_service.create_alternative(alt).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_alternatives(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.list_alternatives(company_id).await {
        Ok(alts) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": alts
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn delete_alternative(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.delete_alternative(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Item Alternative deleted"
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

// Product Bundles
#[derive(Deserialize)]
pub struct CreateProductBundleRequest {
    pub company_id: Uuid,
    pub new_item_code: String,
    pub description: Option<String>,
    pub items: Vec<CreateProductBundleItemRequest>,
}

#[derive(Deserialize)]
pub struct CreateProductBundleItemRequest {
    pub item_code: String,
    pub qty: Option<Decimal>,
}

pub async fn create_product_bundle(
    State(state): State<AppState>,
    Json(payload): Json<CreateProductBundleRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let bundle_id = Uuid::new_v4();
    let bundle = ProductBundle {
        id: bundle_id,
        company_id: payload.company_id,
        new_item_code: payload.new_item_code,
        description: payload.description,
        created_at: chrono::Utc::now(),
        items: payload.items.into_iter().map(|item| ProductBundleItem {
            id: Uuid::new_v4(),
            bundle_id,
            item_code: item.item_code,
            qty: item.qty,
            created_at: chrono::Utc::now(),
        }).collect(),
    };

    match state.master_data_extended_service.create_product_bundle(bundle).await {
        Ok(created) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": created
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn list_product_bundles(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.list_product_bundles(company_id).await {
        Ok(bundles) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": bundles
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}

pub async fn delete_product_bundle(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.master_data_extended_service.delete_product_bundle(id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Product Bundle deleted"
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "message": e
            })),
        )),
    }
}
