use chrono::Utc;
use management_system_core::domain::outbox::{OutboxEntry, OutboxStatus};
use uuid::Uuid;

#[test]
fn test_outbox_status_variants() {
    assert_eq!(OutboxStatus::Pending.as_str(), "PENDING");
    assert_eq!(OutboxStatus::Processing.as_str(), "PROCESSING");
    assert_eq!(OutboxStatus::Completed.as_str(), "COMPLETED");
    assert_eq!(OutboxStatus::Failed.as_str(), "FAILED");
    assert_eq!(OutboxStatus::DeadLetter.as_str(), "DEAD_LETTER");
}

#[test]
fn test_outbox_entry_creation() {
    let payload = serde_json::json!({"amount": 1000});
    let entry = OutboxEntry::new(
        "journal.posted".to_string(),
        &payload,
        "JOURNAL".to_string(),
        Uuid::new_v4(),
        Uuid::new_v4(),
        Some(Uuid::new_v4()),
        "corr-123".to_string(),
    );

    assert_eq!(entry.event_type, "journal.posted");
    assert_eq!(entry.status, "PENDING");
    assert_eq!(entry.attempt_count, 0);
    assert_eq!(entry.max_attempts, 5);
}
