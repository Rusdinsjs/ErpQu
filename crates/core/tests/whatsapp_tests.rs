use management_system_core::domain::entities::whatsapp::{WhatsAppMessage, WhatsAppMessageType};

#[test]
fn test_indonesian_phone_normalization() {
    // Leading 0
    assert_eq!(
        WhatsAppMessage::normalize_phone("0812-3456-7890"),
        "6281234567890"
    );
    // Leading +62
    assert_eq!(
        WhatsAppMessage::normalize_phone("+62 811 987654"),
        "62811987654"
    );
    // Leading 8
    assert_eq!(
        WhatsAppMessage::normalize_phone("813-8888-9999"),
        "6281388889999"
    );
}

#[test]
fn test_whatsapp_smart_template_formatting() {
    let alert = WhatsAppMessage::format_low_stock_alert("ITEM-001", "Bearing SKF", 2.0, 10.0);
    assert!(alert.contains("PERINGATAN STOK MENIPIS"));
    assert!(alert.contains("Defisit: *8 unit*"));

    let spk = WhatsAppMessage::format_production_completed("SPK-2026-001", "Bucket Excavator", 5.0);
    assert!(spk.contains("SPK PRODUKSI TUNTAS"));
    assert!(spk.contains("Kuantitas Selesai: *5 unit*"));

    let invoice = WhatsAppMessage::format_invoice_reminder(
        "INV/001",
        "PT Adhi Karya",
        "Rp 100.000.000",
        "15/09/2026",
    );
    assert!(invoice.contains("PENGINGAT TAGIHAN INVOICE"));
    assert!(invoice.contains("PT Adhi Karya"));
}
