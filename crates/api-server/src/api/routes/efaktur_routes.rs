use axum::{
    routing::{get, post},
    Router,
};

use crate::api::handlers::efaktur_handler;
use crate::api::server::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/tax/e-faktur", get(efaktur_handler::list_tax_invoices))
        .route("/tax/e-faktur", post(efaktur_handler::create_tax_invoice))
        .route("/tax/e-faktur/export", get(efaktur_handler::export_djp_csv))
}
