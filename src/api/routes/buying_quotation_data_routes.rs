use axum::{
    routing::{get, post},
    Router,
};
use crate::api::handlers::BuyingQuotationDataHandler;

pub fn buying_quotation_data_routes(handler: BuyingQuotationDataHandler) -> Router {
    Router::new()
        // Requests for Quotation
        .route("/requests-for-quotation", post(BuyingQuotationDataHandler::create_request_for_quotation).get(BuyingQuotationDataHandler::list_requests_for_quotation))
        // Supplier Quotations
        .route("/supplier-quotations", post(BuyingQuotationDataHandler::create_supplier_quotation).get(BuyingQuotationDataHandler::list_supplier_quotations))
        // Subcontracting Orders
        .route("/subcontracting-orders", post(BuyingQuotationDataHandler::create_subcontracting_order).get(BuyingQuotationDataHandler::list_subcontracting_orders))
        .with_state(handler)
}
