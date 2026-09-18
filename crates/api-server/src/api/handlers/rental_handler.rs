//! Rental Handler
//!
//! API handlers for Rented-Out (external asset rental) operations.

use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::api::server::AppState;
use chrono::NaiveDate;
use management_system_core::application::dto::{
    ApiResponse, ApproveRentalRequest, CreateRentalRateRequest, CreateRentalRequest,
    DispatchRentalRequest, PaginationParams, RejectRentalRequest, RentalScheduleItem,
    ReturnRentalRequest, UpdateRentalRateRequest,
};
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::errors::AppError;
use management_system_rental::domain::entities::{Rental, RentalRate};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ScheduleParams {
    pub start: NaiveDate,
    pub end: NaiveDate,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRentalPayload {
    pub start_date: Option<NaiveDate>,
    pub expected_end_date: Option<NaiveDate>,
    pub deposit_amount: Option<rust_decimal::Decimal>,
    pub notes: Option<String>,
}

// ==================== RENTAL ENDPOINTS ====================

/// List all rentals
///
/// Pagination is applied in-memory after the service filters by the caller's
/// tenant/asset scope, so the response contract stays a plain array (as the web
/// client expects) while `page`/`per_page` still bound the payload size.
pub async fn list_rentals(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<Vec<Rental>>, AppError> {
    let rentals = state.rental_service.list_rentals(&claims).await?;

    let per_page = params.per_page() as usize;
    let offset = ((params.page() - 1) as usize).saturating_mul(per_page);
    let page_items = rentals.into_iter().skip(offset).take(per_page).collect();

    Ok(Json(page_items))
}

/// Get rental by ID
pub async fn get_rental(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Rental>, AppError> {
    let rental = state.rental_service.find_rental(id).await?;
    Ok(Json(rental))
}

/// Update rental order by ID
pub async fn update_rental(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateRentalPayload>,
) -> Result<Json<ApiResponse<Rental>>, AppError> {
    let rental = state
        .rental_service
        .update_rental(
            id,
            payload.start_date,
            payload.expected_end_date,
            payload.deposit_amount,
            payload.notes,
        )
        .await?;

    Ok(Json(ApiResponse::success_with_message(
        rental,
        "Rental order updated successfully",
    )))
}

/// Delete rental order by ID
pub async fn delete_rental(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.rental_service.delete_rental(id).await?;
    Ok(Json(ApiResponse::success_with_message(
        (),
        "Rental order deleted successfully",
    )))
}

/// Create a new rental request
pub async fn create_rental(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Json(payload): Json<CreateRentalRequest>,
) -> Result<(StatusCode, Json<ApiResponse<Rental>>), AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;
    let rental = state.rental_service.create_rental(payload, user_id).await?;
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success_with_message(
            rental,
            "Rental request created",
        )),
    ))
}

/// Approve a rental
pub async fn approve_rental(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ApproveRentalRequest>,
) -> Result<Json<ApiResponse<Rental>>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;

    // Perform approval
    state
        .rental_service
        .approve_rental(id, payload, user_id)
        .await?;

    // Fetch updated rental
    let rental = state.rental_service.find_rental(id).await?;

    Ok(Json(ApiResponse::success_with_message(
        rental,
        "Rental approved",
    )))
}

/// Reject a rental
pub async fn reject_rental(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<RejectRentalRequest>,
) -> Result<Json<ApiResponse<Rental>>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;

    state
        .rental_service
        .reject_rental(id, payload, user_id)
        .await?;

    let rental = state.rental_service.find_rental(id).await?;

    Ok(Json(ApiResponse::success_with_message(
        rental,
        "Rental rejected",
    )))
}

/// Dispatch rental (handover out)
pub async fn dispatch_rental(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<DispatchRentalRequest>,
) -> Result<Json<ApiResponse<Rental>>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;

    state
        .rental_service
        .dispatch_rental(id, payload, user_id)
        .await?;

    let rental = state.rental_service.find_rental(id).await?;

    Ok(Json(ApiResponse::success_with_message(
        rental,
        "Rental dispatched",
    )))
}

/// Return rental (handover in)
pub async fn return_rental(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ReturnRentalRequest>,
) -> Result<Json<ApiResponse<Rental>>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub)?;

    state
        .rental_service
        .return_rental(id, payload, user_id)
        .await?;

    let rental = state.rental_service.find_rental(id).await?;

    Ok(Json(ApiResponse::success_with_message(
        rental,
        "Rental returned",
    )))
}

// ==================== LISTS ====================

pub async fn list_pending_rentals(
    State(state): State<AppState>,
) -> Result<Json<Vec<Rental>>, AppError> {
    let rentals = state.rental_service.list_pending_rentals().await?;
    Ok(Json(rentals))
}

pub async fn list_overdue_rentals(
    State(state): State<AppState>,
) -> Result<Json<Vec<Rental>>, AppError> {
    let rentals = state.rental_service.list_overdue_rentals().await?;
    Ok(Json(rentals))
}

// ==================== HANDOVERS ====================

/// Handover record shaped to match `public.rental_handovers`.
///
/// The previous entity (`RentalHandover` in the rental crate) declares columns
/// such as `handover_date` / `conducted_by` / `notes` that do not exist in the
/// table, which is why the list endpoint had to return an empty vector. This
/// struct mirrors the actual schema used by the web client.
#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct RentalHandoverRecord {
    pub id: Uuid,
    pub rental_id: Uuid,
    pub rental_item_id: Option<Uuid>,
    pub handover_type: String,
    pub condition_rating: Option<String>,
    pub condition_notes: Option<String>,
    pub photos: Option<serde_json::Value>,
    pub has_damage: Option<bool>,
    pub damage_description: Option<String>,
    pub damage_photos: Option<serde_json::Value>,
    pub recorded_by: Option<Uuid>,
    pub recorded_at: Option<chrono::DateTime<chrono::Utc>>,
    pub signature_data: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct AddHandoverPhotoRequest {
    pub photo_url: String,
    /// Optional caption. Kept for API compatibility with the web client.
    #[allow(dead_code)]
    pub description: Option<String>,
}

pub async fn get_rental_handovers(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<RentalHandoverRecord>>, AppError> {
    let handovers = sqlx::query_as::<_, RentalHandoverRecord>(
        r#"
        SELECT id, rental_id, rental_item_id, handover_type, condition_rating,
               condition_notes, photos, has_damage, damage_description, damage_photos,
               recorded_by, recorded_at, signature_data, created_at
        FROM public.rental_handovers
        WHERE rental_id = $1
        ORDER BY recorded_at DESC NULLS LAST, created_at DESC
        "#,
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to load rental handovers: {}", e)))?;

    Ok(Json(handovers))
}

pub async fn add_handover_photo(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AddHandoverPhotoRequest>,
) -> Result<Json<ApiResponse<RentalHandoverRecord>>, AppError> {
    let photo_url = payload.photo_url.trim();
    if photo_url.is_empty() {
        return Err(AppError::BadRequest("photo_url is required".to_string()));
    }
    // Only accept server-managed upload paths; block external URLs and traversal.
    if !photo_url.starts_with("/api/uploads/") || photo_url.contains("..") {
        return Err(AppError::BadRequest(
            "photo_url must reference an uploaded file under /api/uploads/".to_string(),
        ));
    }

    let photo = serde_json::json!({
        "url": photo_url,
        "uploaded_by": claims.sub,
        "uploaded_at": chrono::Utc::now().to_rfc3339(),
    });

    let record = sqlx::query_as::<_, RentalHandoverRecord>(
        r#"
        UPDATE public.rental_handovers
        SET photos = COALESCE(photos, '[]'::jsonb) || $2::jsonb
        WHERE id = $1
        RETURNING id, rental_id, rental_item_id, handover_type, condition_rating,
                  condition_notes, photos, has_damage, damage_description, damage_photos,
                  recorded_by, recorded_at, signature_data, created_at
        "#,
    )
    .bind(id)
    .bind(serde_json::json!([photo]))
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to add handover photo: {}", e)))?
    .ok_or_else(|| AppError::NotFound("Rental handover not found".to_string()))?;

    tracing::info!(
        "SECURITY AUDIT HANDOVER_PHOTO_ADDED: HandoverID={} RentalID={} UserID={}",
        id,
        record.rental_id,
        claims.sub
    );

    Ok(Json(ApiResponse::success_with_message(
        record,
        "Handover photo added",
    )))
}

// ==================== RATES ====================

pub async fn list_rental_rates(
    State(state): State<AppState>,
) -> Result<Json<Vec<RentalRate>>, AppError> {
    let rates = state.rental_service.list_rental_rates().await?;
    Ok(Json(rates))
}

pub async fn create_rental_rate(
    State(state): State<AppState>,
    Json(payload): Json<CreateRentalRateRequest>,
) -> Result<Json<ApiResponse<RentalRate>>, AppError> {
    let rate = state.rental_service.create_rental_rate(payload).await?;
    Ok(Json(ApiResponse::success(rate)))
}

pub async fn update_rental_rate(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateRentalRateRequest>,
) -> Result<Json<ApiResponse<RentalRate>>, AppError> {
    let rate = state.rental_service.update_rental_rate(id, payload).await?;
    Ok(Json(ApiResponse::success(rate)))
}

pub async fn delete_rental_rate(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    state.rental_service.delete_rental_rate(id).await?;
    Ok(Json(ApiResponse::success(())))
}

/// Get schedule for Gantt
pub async fn get_schedule(
    State(state): State<AppState>,
    Query(params): Query<ScheduleParams>,
) -> Result<Json<Vec<RentalScheduleItem>>, AppError> {
    let items = state
        .rental_service
        .get_schedule(params.start, params.end)
        .await?;
    Ok(Json(items))
}
