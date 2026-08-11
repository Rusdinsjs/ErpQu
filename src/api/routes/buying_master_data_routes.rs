use axum::{
    routing::{get, post},
    Router,
};
use crate::api::handlers::BuyingMasterDataHandler;

pub fn buying_master_data_routes(handler: BuyingMasterDataHandler) -> Router {
    Router::new()
        // Supplier Groups
        .route("/supplier-groups", post(BuyingMasterDataHandler::create_supplier_group).get(BuyingMasterDataHandler::list_supplier_groups))
        // Supplier Contacts
        .route("/supplier-contacts", post(BuyingMasterDataHandler::create_supplier_contact).get(BuyingMasterDataHandler::list_supplier_contacts))
        // Supplier Addresses
        .route("/supplier-addresses", post(BuyingMasterDataHandler::create_supplier_address).get(BuyingMasterDataHandler::list_supplier_addresses))
        // Buying Settings
        .route("/buying-settings", post(BuyingMasterDataHandler::create_buying_settings).get(BuyingMasterDataHandler::list_buying_settings))
        // Purchase Taxes Templates
        .route("/purchase-taxes-templates", post(BuyingMasterDataHandler::create_purchase_taxes_template).get(BuyingMasterDataHandler::list_purchase_taxes_templates))
        .with_state(handler)
}
