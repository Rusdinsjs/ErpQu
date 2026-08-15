use crate::api::server::AppState;
use axum::{
    extract::{Path, Query, State},
    Json,
};
use management_system_core::application::dto::ApiResponse;
use management_system_core::shared::errors::AppError;
use management_system_ops::{
    CreateDeliveryTripRequest, CreateQualityInspectionRequest, DeliveryTrip, DeliveryTripStop,
    QualityInspection,
};
use uuid::Uuid;

// --- Quality Inspections ---

pub async fn create_quality_inspection(
    State(state): State<AppState>,
    Json(payload): Json<CreateQualityInspectionRequest>,
) -> Result<Json<ApiResponse<QualityInspection>>, AppError> {
    let result = state
        .quality_service
        .create_quality_inspection(payload)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn get_quality_inspection(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Option<QualityInspection>>>, AppError> {
    let result = state.quality_service.get_quality_inspection(id).await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn list_quality_inspections(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<QualityInspection>>>, AppError> {
    let result = state
        .quality_service
        .list_quality_inspections(company_id)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

#[derive(serde::Deserialize)]
pub struct UpdateQualityStatusPayload {
    pub status: String,
}

pub async fn update_quality_inspection_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateQualityStatusPayload>,
) -> Result<Json<ApiResponse<QualityInspection>>, AppError> {
    let result = state
        .quality_service
        .update_quality_inspection_status(id, payload.status)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

// --- Delivery Trips ---

pub async fn create_delivery_trip(
    State(state): State<AppState>,
    Json(payload): Json<CreateDeliveryTripRequest>,
) -> Result<Json<ApiResponse<(DeliveryTrip, Vec<DeliveryTripStop>)>>, AppError> {
    let result = state
        .delivery_trip_service
        .create_delivery_trip(payload)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn get_delivery_trip(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Option<(DeliveryTrip, Vec<DeliveryTripStop>)>>>, AppError> {
    let result = state.delivery_trip_service.get_delivery_trip(id).await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn list_delivery_trips(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<DeliveryTrip>>>, AppError> {
    let result = state
        .delivery_trip_service
        .list_delivery_trips(company_id)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

#[derive(serde::Deserialize)]
pub struct UpdateTripStatusPayload {
    pub status: String,
    pub departure_time: Option<chrono::DateTime<chrono::Utc>>,
    pub arrival_time: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn update_delivery_trip_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateTripStatusPayload>,
) -> Result<Json<ApiResponse<DeliveryTrip>>, AppError> {
    let result = state
        .delivery_trip_service
        .update_delivery_trip_status(
            id,
            payload.status,
            payload.departure_time,
            payload.arrival_time,
        )
        .await?;
    Ok(Json(ApiResponse::success(result)))
}

pub async fn update_delivery_trip_stop_status(
    State(state): State<AppState>,
    Path((_trip_id, stop_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateQualityStatusPayload>, // Reuses status string payload
) -> Result<Json<ApiResponse<DeliveryTripStop>>, AppError> {
    let result = state
        .delivery_trip_service
        .update_delivery_trip_stop_status(stop_id, payload.status)
        .await?;
    Ok(Json(ApiResponse::success(result)))
}
