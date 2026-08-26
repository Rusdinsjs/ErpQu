use axum::{routing::{post, get}, Router};
use std::sync::Arc;
use crate::api::handlers::SalesMasterDataHandler;
use crate::infrastructure::repositories::SalesMasterDataRepository;
use sqlx::PgPool;

pub fn routes(pool: PgPool) -> Router {
    let repo = Arc::new(SalesMasterDataRepository::new(pool));
    let handler = SalesMasterDataHandler::new(repo);

    Router::new()
        // Customer Groups
        .route("/customer-groups", post(SalesMasterDataHandler::create_customer_group))
        .route("/customer-groups", get(SalesMasterDataHandler::list_customer_groups))
        
        // Contacts
        .route("/contacts", post(SalesMasterDataHandler::create_customer_contact))
        .route("/contacts", get(SalesMasterDataHandler::list_customer_contacts))
        
        // Addresses
        .route("/addresses", post(SalesMasterDataHandler::create_customer_address))
        .route("/addresses", get(SalesMasterDataHandler::list_customer_addresses))
        
        // Territories
        .route("/territories", post(SalesMasterDataHandler::create_territory))
        .route("/territories", get(SalesMasterDataHandler::list_territories))
        
        // Sales Partners
        .route("/sales-partners", post(SalesMasterDataHandler::create_sales_partner))
        .route("/sales-partners", get(SalesMasterDataHandler::list_sales_partners))
        
        // Sales Persons
        .route("/sales-persons", post(SalesMasterDataHandler::create_sales_person))
        .route("/sales-persons", get(SalesMasterDataHandler::list_sales_persons))
        
        .with_state(handler)
}
