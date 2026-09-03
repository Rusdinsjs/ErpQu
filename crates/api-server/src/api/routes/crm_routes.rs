//! CRM Pipeline & Opportunity Routes

use axum::{
    routing::{get, post},
    Router,
};

use crate::api::handlers::crm_pipeline_handler;
use crate::api::server::AppState;

pub fn crm_routes() -> Router<AppState> {
    Router::new()
        // Leads
        .route(
            "/leads",
            get(crm_pipeline_handler::list_leads).post(crm_pipeline_handler::create_lead),
        )
        .route(
            "/leads/:id",
            get(crm_pipeline_handler::get_lead)
                .put(crm_pipeline_handler::update_lead)
                .delete(crm_pipeline_handler::delete_lead),
        )
        .route(
            "/leads/:id/convert",
            post(crm_pipeline_handler::convert_lead),
        )
        // Opportunities
        .route(
            "/opportunities",
            get(crm_pipeline_handler::list_opportunities)
                .post(crm_pipeline_handler::create_opportunity),
        )
        .route(
            "/opportunities/:id",
            get(crm_pipeline_handler::get_opportunity)
                .put(crm_pipeline_handler::update_opportunity)
                .delete(crm_pipeline_handler::delete_opportunity),
        )
        // Pipeline Summary & Analytics
        .route(
            "/pipeline/summary",
            get(crm_pipeline_handler::get_pipeline_summary),
        )
        .route(
            "/analytics/win-loss",
            get(crm_pipeline_handler::get_win_loss_analytics),
        )
}
