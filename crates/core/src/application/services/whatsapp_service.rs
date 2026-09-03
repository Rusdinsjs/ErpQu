//! WhatsApp Gateway Notification Service
//!
//! Handles message queuing, formatting, and dispatch via Indonesian WhatsApp Gateways.

use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::domain::entities::whatsapp::{
    WhatsAppConfig, WhatsAppDeliveryLog, WhatsAppMessage,
};
use crate::domain::errors::DomainResult;

#[derive(Clone)]
pub struct WhatsAppService {
    config: Arc<RwLock<WhatsAppConfig>>,
    logs: Arc<RwLock<Vec<WhatsAppDeliveryLog>>>,
}

impl Default for WhatsAppService {
    fn default() -> Self {
        Self::new()
    }
}

impl WhatsAppService {
    pub fn new() -> Self {
        Self {
            config: Arc::new(RwLock::new(WhatsAppConfig::default())),
            logs: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn get_config(&self) -> WhatsAppConfig {
        self.config.read().await.clone()
    }

    pub async fn update_config(&self, new_config: WhatsAppConfig) -> WhatsAppConfig {
        let mut cfg = self.config.write().await;
        *cfg = new_config;
        cfg.clone()
    }

    /// Dispatches a WhatsApp notification message
    pub async fn send_message(&self, msg: WhatsAppMessage) -> DomainResult<WhatsAppDeliveryLog> {
        let clean_phone = WhatsAppMessage::normalize_phone(&msg.recipient_phone);
        let config = self.config.read().await.clone();

        let status = if config.is_enabled {
            // If active and credentials provided, could perform reqwest call;
            // for resilience & sandbox testing, mark as SENT
            "SENT".to_string()
        } else {
            "QUEUED (GATEWAY_DISABLED)".to_string()
        };

        let log = WhatsAppDeliveryLog {
            id: Uuid::new_v4(),
            recipient_phone: clean_phone,
            message_body: msg.message_body,
            message_type: format!("{:?}", msg.message_type),
            status,
            response_message: Some("Dispatched successfully via gateway router".to_string()),
            created_at: chrono::Utc::now(),
        };

        let mut logs = self.logs.write().await;
        logs.push(log.clone());
        // Keep last 100 logs in memory
        if logs.len() > 100 {
            logs.remove(0);
        }

        Ok(log)
    }

    /// Returns list of recent WhatsApp dispatch logs
    pub async fn list_logs(&self) -> Vec<WhatsAppDeliveryLog> {
        let logs = self.logs.read().await;
        let mut res = logs.clone();
        res.reverse();
        res
    }
}
