use axum::{extract::State, Json};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::api::server::AppState;
use management_system_core::domain::entities::whatsapp::{
    WhatsAppConfig, WhatsAppMessage, WhatsAppMessageType,
};
use management_system_core::shared::errors::AppError;

#[derive(Debug, Deserialize)]
pub struct SendWhatsAppRequest {
    pub recipient_phone: String,
    pub message_body: String,
    pub message_type: Option<WhatsAppMessageType>,
}

pub async fn get_config(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let cfg = state.whatsapp_service.get_config().await;
    Ok(Json(json!({
        "success": true,
        "data": cfg
    })))
}

pub async fn update_config(
    State(state): State<AppState>,
    Json(payload): Json<WhatsAppConfig>,
) -> Result<Json<Value>, AppError> {
    let updated = state.whatsapp_service.update_config(payload).await;
    Ok(Json(json!({
        "success": true,
        "data": updated
    })))
}

pub async fn send_message(
    State(state): State<AppState>,
    Json(payload): Json<SendWhatsAppRequest>,
) -> Result<Json<Value>, AppError> {
    let msg = WhatsAppMessage {
        recipient_phone: payload.recipient_phone,
        message_body: payload.message_body,
        message_type: payload.message_type.unwrap_or(WhatsAppMessageType::General),
    };

    let log = state.whatsapp_service.send_message(msg).await?;
    Ok(Json(json!({
        "success": true,
        "data": log
    })))
}

pub async fn list_logs(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let logs = state.whatsapp_service.list_logs().await;
    Ok(Json(json!({
        "success": true,
        "data": logs
    })))
}
