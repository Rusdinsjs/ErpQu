use axum::{
    routing::{get, post},
    Router,
};
use crate::api::handlers::SalesPosDataHandler;

pub fn sales_pos_data_routes(handler: SalesPosDataHandler) -> Router {
    Router::new()
        // POS Profiles
        .route("/pos-profiles", post(SalesPosDataHandler::create_pos_profile).get(SalesPosDataHandler::list_pos_profiles))
        // POS Settings
        .route("/pos-settings", post(SalesPosDataHandler::create_pos_settings).get(SalesPosDataHandler::list_pos_settings))
        // POS Opening Entries
        .route("/pos-opening-entries", post(SalesPosDataHandler::create_pos_opening_entry).get(SalesPosDataHandler::list_pos_opening_entries))
        // POS Closing Entries
        .route("/pos-closing-entries", post(SalesPosDataHandler::create_pos_closing_entry).get(SalesPosDataHandler::list_pos_closing_entries))
        // Loyalty Programs
        .route("/loyalty-programs", post(SalesPosDataHandler::create_loyalty_program).get(SalesPosDataHandler::list_loyalty_programs))
        // Loyalty Point Entries
        .route("/loyalty-point-entries", post(SalesPosDataHandler::create_loyalty_point_entry).get(SalesPosDataHandler::list_loyalty_point_entries))
        .with_state(handler)
}
