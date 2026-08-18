//! Asset Router Module

use axum::{
    handler::Handler,
    routing::{get, post},
    Router,
};

use crate::api::handlers::lifecycle_handler;
use crate::api::handlers::*;
use crate::api::middleware::rbac::require_permission;
use crate::api::server::AppState;
use axum::middleware as axum_middleware;

pub fn asset_routes() -> Router<AppState> {
    Router::new()
        // Core Assets
        .route(
            "/expiring",
            get(get_expiring_assets
                .layer(axum_middleware::from_fn(require_permission("asset.view")))),
        )
        .route(
            "/",
            get(list_assets.layer(axum_middleware::from_fn(require_permission("asset.view"))))
                .post(
                    create_asset
                        .layer(axum_middleware::from_fn(require_permission("asset.create"))),
                ),
        )
        .route(
            "/bulk",
            post(
                bulk_create_assets
                    .layer(axum_middleware::from_fn(require_permission("asset.create"))),
            )
            .layer(tower_http::limit::RequestBodyLimitLayer::new(
                10 * 1024 * 1024,
            )),
        )
        .route(
            "/bulk-update",
            post(
                bulk_update_assets
                    .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
            )
            .layer(tower_http::limit::RequestBodyLimitLayer::new(
                10 * 1024 * 1024,
            )),
        )
        .route(
            "/capitalization",
            post(asset_lifecycle_handler::capitalize_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/transfer",
            post(asset_lifecycle_handler::transfer_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/impairment",
            post(asset_lifecycle_handler::impair_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/disposal",
            post(asset_lifecycle_handler::dispose_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/:id/capitalize",
            post(asset_lifecycle_handler::capitalize_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/:id/transfer",
            post(asset_lifecycle_handler::transfer_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/:id/impairment",
            post(asset_lifecycle_handler::impair_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/:id/disposal",
            post(asset_lifecycle_handler::dispose_asset)
                .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
        )
        .route(
            "/:id/custody-history",
            get(asset_lifecycle_handler::get_custody_history)
                .layer(axum_middleware::from_fn(require_permission("asset.view"))),
        )
        .route(
            "/search",
            get(search_assets.layer(axum_middleware::from_fn(require_permission("asset.view")))),
        )
        .route(
            "/:id",
            get(get_asset.layer(axum_middleware::from_fn(require_permission("asset.view"))))
                .put(update_asset.layer(axum_middleware::from_fn(require_permission("asset.edit"))))
                .delete(
                    delete_asset
                        .layer(axum_middleware::from_fn(require_permission("asset.delete"))),
                ),
        )
        .route(
            "/:id/sell",
            post(sell_asset.layer(axum_middleware::from_fn(require_permission("asset.edit")))),
        )
        .route(
            "/export",
            get(export_assets.layer(axum_middleware::from_fn(require_permission("asset.view")))),
        )
        .route(
            "/:id/documents",
            get(get_asset_documents
                .layer(axum_middleware::from_fn(require_permission("asset.view"))))
            .post(
                add_document_to_asset
                    .layer(axum_middleware::from_fn(require_permission("asset.edit"))),
            ),
        )
        // IoT Sensors & Telemetry
        .route(
            "/:asset_id/sensors/readings",
            post(record_reading).get(get_latest_readings),
        )
        .route(
            "/:asset_id/sensors/readings/range",
            get(get_readings_in_range),
        )
        .route("/:asset_id/sensors/thresholds", post(set_threshold))
        // Lifecycle Tracking
        .route(
            "/:id/lifecycle/transition",
            post(lifecycle_handler::transition_asset),
        )
        .route(
            "/:id/lifecycle/request-transition",
            post(lifecycle_handler::request_transition),
        )
        .route(
            "/:id/lifecycle/history",
            get(lifecycle_handler::get_lifecycle_history),
        )
        .route(
            "/:id/lifecycle/valid-transitions",
            get(lifecycle_handler::get_valid_transitions),
        )
        .route(
            "/:id/lifecycle/valid-transitions-with-approval",
            get(lifecycle_handler::get_valid_transitions_with_approval),
        )
        .route(
            "/:id/lifecycle/status",
            get(lifecycle_handler::get_current_status),
        )
}
