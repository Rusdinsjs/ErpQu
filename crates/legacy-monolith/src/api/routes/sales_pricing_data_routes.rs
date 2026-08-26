use axum::{
    routing::{get, post},
    Router,
};
use crate::api::handlers::SalesPricingDataHandler;

pub fn sales_pricing_data_routes(handler: SalesPricingDataHandler) -> Router {
    Router::new()
        // Price Lists
        .route("/price-lists", post(SalesPricingDataHandler::create_price_list).get(SalesPricingDataHandler::list_price_lists))
        // Item Prices
        .route("/item-prices", post(SalesPricingDataHandler::create_item_price).get(SalesPricingDataHandler::list_item_prices))
        // Product Bundles
        .route("/product-bundles", post(SalesPricingDataHandler::create_product_bundle).get(SalesPricingDataHandler::list_product_bundles))
        // Pricing Rules
        .route("/pricing-rules", post(SalesPricingDataHandler::create_pricing_rule).get(SalesPricingDataHandler::list_pricing_rules))
        // Promotional Schemes
        .route("/promotional-schemes", post(SalesPricingDataHandler::create_promotional_scheme).get(SalesPricingDataHandler::list_promotional_schemes))
        // Coupon Codes
        .route("/coupon-codes", post(SalesPricingDataHandler::create_coupon_code).get(SalesPricingDataHandler::list_coupon_codes))
        .with_state(handler)
}
