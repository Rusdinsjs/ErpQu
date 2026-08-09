use crate::api::handlers::ops_quality_trip_handler;
use crate::api::server::AppState;
use axum::{
    routing::{get, post, put},
    Router,
};

pub fn ops_quality_trip_routes() -> Router<AppState> {
    Router::new()
        // Quality Inspections
        .route(
            "/quality-inspections",
            post(ops_quality_trip_handler::create_quality_inspection),
        )
        .route(
            "/quality-inspections/:id",
            get(ops_quality_trip_handler::get_quality_inspection),
        )
        .route(
            "/quality-inspections/company/:company_id",
            get(ops_quality_trip_handler::list_quality_inspections),
        )
        .route(
            "/quality-inspections/:id/status",
            put(ops_quality_trip_handler::update_quality_inspection_status),
        )
        // Delivery Trips
        .route(
            "/delivery-trips",
            post(ops_quality_trip_handler::create_delivery_trip),
        )
        .route(
            "/delivery-trips/:id",
            get(ops_quality_trip_handler::get_delivery_trip),
        )
        .route(
            "/delivery-trips/company/:company_id",
            get(ops_quality_trip_handler::list_delivery_trips),
        )
        .route(
            "/delivery-trips/:id/status",
            put(ops_quality_trip_handler::update_delivery_trip_status),
        )
        .route(
            "/delivery-trips/:trip_id/stops/:stop_id/status",
            put(ops_quality_trip_handler::update_delivery_trip_stop_status),
        )
}
