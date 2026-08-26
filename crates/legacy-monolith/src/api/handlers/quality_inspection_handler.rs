use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use rust_decimal::Decimal;

use crate::api::server::AppState;
use crate::domain::entities::quality_inspection::QualityInspection;

#[derive(Deserialize)]
pub struct CreateQualityInspectionRequest {
    pub company_id: Uuid,
    pub inspection_number: String,
    pub inspection_type: String,
    pub item_id: Uuid,
    pub batch_no: Option<String>,
    pub sample_size: Decimal,
}

pub async fn create_inspection(
    State(state): State<AppState>,
    Json(payload): Json<CreateQualityInspectionRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let inspection = QualityInspection {
        id: Uuid::new_v4(),
        company_id: payload.company_id,
        inspection_number: payload.inspection_number,
        inspection_type: payload.inspection_type,
        item_id: payload.item_id,
        batch_no: payload.batch_no,
        sample_size: payload.sample_size,
        status: "PENDING".to_string(),
        inspected_by: None,
        created_at: chrono::Utc::now(),
        item_name: None,
    };

    match state.quality_inspection_service.create_inspection(inspection).await {
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

pub async fn list_inspections(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.quality_inspection_service.list_inspections(company_id).await {
        Ok(inspections) => Ok(Json(serde_json::json!({
            "status": "success",
            "data": inspections
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

#[derive(Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
}

pub async fn update_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    match state.quality_inspection_service.update_status(id, &payload.status).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Status updated"
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
