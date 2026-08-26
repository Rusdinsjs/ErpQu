use axum::{routing::{post, get}, Router};
use std::sync::Arc;
use crate::api::handlers::QuotationHandler;
use crate::infrastructure::repositories::QuotationRepository;
use sqlx::PgPool;

pub fn routes(pool: PgPool) -> Router {
    let repo = Arc::new(QuotationRepository::new(pool));
    let handler = QuotationHandler::new(repo);

    Router::new()
        .route("/", post(QuotationHandler::create_quotation))
        .route("/", get(QuotationHandler::list_quotations))
        .with_state(handler)
}
