use axum::{
    routing::{get, post},
    Router,
};
use crate::api::handlers::SalesSetupDataHandler;

pub fn sales_setup_data_routes(handler: SalesSetupDataHandler) -> Router {
    Router::new()
        // Blanket Orders
        .route("/blanket-orders", post(SalesSetupDataHandler::create_blanket_order).get(SalesSetupDataHandler::list_blanket_orders))
        // Shipping Rules
        .route("/shipping-rules", post(SalesSetupDataHandler::create_shipping_rule).get(SalesSetupDataHandler::list_shipping_rules))
        // Selling Settings
        .route("/selling-settings", post(SalesSetupDataHandler::create_selling_settings).get(SalesSetupDataHandler::list_selling_settings))
        // Terms and Conditions Templates
        .route("/terms-templates", post(SalesSetupDataHandler::create_terms_and_conditions_template).get(SalesSetupDataHandler::list_terms_and_conditions_templates))
        // Sales Taxes Templates
        .route("/tax-templates", post(SalesSetupDataHandler::create_sales_taxes_template).get(SalesSetupDataHandler::list_sales_taxes_templates))
        // UTM Sources
        .route("/utm-sources", post(SalesSetupDataHandler::create_utm_source).get(SalesSetupDataHandler::list_utm_sources))
        // Campaigns
        .route("/campaigns", post(SalesSetupDataHandler::create_campaign).get(SalesSetupDataHandler::list_campaigns))
        .with_state(handler)
}
