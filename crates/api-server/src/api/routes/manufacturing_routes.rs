//! Manufacturing & Production Order Routes

use axum::{
    routing::{get, post, put},
    Router,
};

use crate::api::handlers::manufacturing_handler;
use crate::api::server::AppState;

pub fn manufacturing_routes() -> Router<AppState> {
    Router::new()
        // BOM
        .route(
            "/boms",
            get(manufacturing_handler::list_boms).post(manufacturing_handler::create_bom),
        )
        .route("/boms/:id", get(manufacturing_handler::get_bom))
        .route(
            "/boms/:id/requirements",
            get(manufacturing_handler::calculate_material_requirements),
        )
        // Production Orders
        .route(
            "/production-orders",
            get(manufacturing_handler::list_production_orders)
                .post(manufacturing_handler::create_production_order),
        )
        .route(
            "/production-orders/:id",
            get(manufacturing_handler::get_production_order),
        )
        .route(
            "/production-orders/:id/status",
            put(manufacturing_handler::update_production_order_status),
        )
}
