use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::{
    api::server::AppState,
    domain::entities::outbound_logistics::{
        DeliveryNote, PickList, DeliveryTrip, InstallationNote, StockReconciliation,
    },
};

// 1. Delivery Notes
pub async fn create_delivery_note(
    State(state): State<AppState>,
    Json(payload): Json<DeliveryNote>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.create_delivery_note(payload).await {
        Ok(note) => (StatusCode::CREATED, Json(note)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn list_delivery_notes(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.list_delivery_notes(company_id).await {
        Ok(notes) => (StatusCode::OK, Json(notes)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn delete_delivery_note(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.delete_delivery_note(id).await {
        Ok(rows) if rows > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn submit_delivery_note(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.submit_delivery_note(id).await {
        Ok(note) => (StatusCode::OK, Json(note)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

// 2. Pick Lists
pub async fn create_pick_list(
    State(state): State<AppState>,
    Json(payload): Json<PickList>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.create_pick_list(payload).await {
        Ok(pl) => (StatusCode::CREATED, Json(pl)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn list_pick_lists(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.list_pick_lists(company_id).await {
        Ok(pls) => (StatusCode::OK, Json(pls)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn delete_pick_list(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.delete_pick_list(id).await {
        Ok(rows) if rows > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

// 3. Delivery Trips
pub async fn create_delivery_trip(
    State(state): State<AppState>,
    Json(payload): Json<DeliveryTrip>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.create_delivery_trip(payload).await {
        Ok(trip) => (StatusCode::CREATED, Json(trip)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn list_delivery_trips(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.list_delivery_trips(company_id).await {
        Ok(trips) => (StatusCode::OK, Json(trips)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn delete_delivery_trip(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.delete_delivery_trip(id).await {
        Ok(rows) if rows > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

// 4. Installation Notes
pub async fn create_installation_note(
    State(state): State<AppState>,
    Json(payload): Json<InstallationNote>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.create_installation_note(payload).await {
        Ok(note) => (StatusCode::CREATED, Json(note)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn list_installation_notes(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.list_installation_notes(company_id).await {
        Ok(notes) => (StatusCode::OK, Json(notes)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn delete_installation_note(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.delete_installation_note(id).await {
        Ok(rows) if rows > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

// 5. Stock Reconciliations
pub async fn create_stock_reconciliation(
    State(state): State<AppState>,
    Json(payload): Json<StockReconciliation>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.create_stock_reconciliation(payload).await {
        Ok(rec) => (StatusCode::CREATED, Json(rec)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn list_stock_reconciliations(
    State(state): State<AppState>,
    Path(company_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.list_stock_reconciliations(company_id).await {
        Ok(recs) => (StatusCode::OK, Json(recs)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}

pub async fn delete_stock_reconciliation(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.outbound_logistics_service.delete_stock_reconciliation(id).await {
        Ok(rows) if rows > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}
