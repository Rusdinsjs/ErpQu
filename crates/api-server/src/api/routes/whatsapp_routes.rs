use axum::{
    routing::{get, post, put},
    Router,
};

use crate::api::handlers::whatsapp_handler;
use crate::api::server::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/notifications/whatsapp/config", get(whatsapp_handler::get_config))
        .route("/notifications/whatsapp/config", put(whatsapp_handler::update_config))
        .route("/notifications/whatsapp/send", post(whatsapp_handler::send_message))
        .route("/notifications/whatsapp/logs", get(whatsapp_handler::list_logs))
}
