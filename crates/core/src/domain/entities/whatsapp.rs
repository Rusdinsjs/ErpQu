//! WhatsApp Notification Gateway Entities & Formatting
//!
//! Provides Indonesian mobile phone normalization (e.g. 0812 -> 62812)
//! and message payload formatting for enterprise business events.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WhatsAppProvider {
    Wablas,
    Fonnte,
    UltraMsg,
    GenericWebhook,
}

impl Default for WhatsAppProvider {
    fn default() -> Self {
        Self::Fonnte
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatsAppConfig {
    pub provider: WhatsAppProvider,
    pub api_url: String,
    pub api_token: String,
    pub sender_phone: Option<String>,
    pub is_enabled: bool,
}

impl Default for WhatsAppConfig {
    fn default() -> Self {
        Self {
            provider: WhatsAppProvider::Fonnte,
            api_url: "https://api.fonnte.com/send".to_string(),
            api_token: String::new(),
            sender_phone: None,
            is_enabled: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WhatsAppMessageType {
    LowStockAlert,
    ProductionOrderCompleted,
    InvoicePaymentReminder,
    General,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatsAppMessage {
    pub recipient_phone: String,
    pub message_body: String,
    pub message_type: WhatsAppMessageType,
}

impl WhatsAppMessage {
    /// Normalizes Indonesian phone numbers into international 62 format
    /// E.g. "0812-3456-7890" -> "6281234567890"
    ///      "+62 811 987654" -> "62811987654"
    pub fn normalize_phone(raw: &str) -> String {
        let digits: String = raw.chars().filter(|c| c.is_ascii_digit()).collect();

        if digits.starts_with("0") {
            format!("62{}", &digits[1..])
        } else if digits.starts_with("8") {
            format!("62{}", digits)
        } else {
            digits
        }
    }

    /// Smart Template: Format Low Stock Alert Message
    pub fn format_low_stock_alert(sku: &str, name: &str, current: f64, min: f64) -> String {
        format!(
            "⚠️ *[PERINGATAN STOK MENIPIS - ERPQu]*\n\n\
            Item: *{} - {}*\n\
            Sisa Stok: *{} unit*\n\
            Batas Minimum: *{} unit*\n\
            Defisit: *{} unit*\n\n\
            Harap segera buat Material Request / Purchase Order untuk mencegah kekosongan stok operasional.",
            sku, name, current, min, min - current
        )
    }

    /// Smart Template: Format Production Order Completion Message
    pub fn format_production_completed(order_num: &str, bom_name: &str, target_qty: f64) -> String {
        format!(
            "✅ *[SPK PRODUKSI TUNTAS - ERPQu]*\n\n\
            No. SPK: *{}*\n\
            Formula/BOM: *{}*\n\
            Kuantitas Selesai: *{} unit*\n\n\
            Barang jadi telah selesai dirakit dan siap untuk proses Quality Control (QC) & serah terima ke gudang.",
            order_num, bom_name, target_qty
        )
    }

    /// Smart Template: Format Sales Invoice Payment Reminder
    pub fn format_invoice_reminder(
        invoice_num: &str,
        client_name: &str,
        amount_str: &str,
        due_date: &str,
    ) -> String {
        format!(
            "📄 *[PENGINGAT TAGIHAN INVOICE - ERPQu]*\n\n\
            Kepada Yth. *{}*,\n\
            Tagihan No: *{}*\n\
            Total Pembayaran: *{}*\n\
            Jatuh Tempo: *{}*\n\n\
            Mohon konfirmasi pembayaran sebelum tanggal jatuh tempo. Terima kasih atas kerja sama Anda.",
            client_name, invoice_num, amount_str, due_date
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatsAppDeliveryLog {
    pub id: Uuid,
    pub recipient_phone: String,
    pub message_body: String,
    pub message_type: String,
    pub status: String, // SENT, QUEUED, FAILED
    pub response_message: Option<String>,
    pub created_at: DateTime<Utc>,
}
