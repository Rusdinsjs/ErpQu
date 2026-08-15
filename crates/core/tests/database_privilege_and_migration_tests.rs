//! Database Privilege Separation & Migration Safety Invariant Tests
//!
//! Validates:
//! 1. Connection string sanitizer masks password with '***'.
//! 2. Production environment detection.

use management_system_core::shared::config::AppConfig;

#[test]
fn test_sanitized_db_url_never_exposes_password() {
    let raw_url = "postgres://erpqu_app:SuperSecretPass123!@localhost:5432/erpqu_db";
    let sample_sanitized = AppConfig {
        database_url: raw_url.to_string(),
        redis_url: None,
        server_host: "0.0.0.0".to_string(),
        server_port: 8181,
        jwt_secret: "a-very-long-secret-key-32-chars-minimum".to_string(),
        jwt_expiry_hours: 24,
        environment: "test".to_string(),
        smtp_host: "127.0.0.1".to_string(),
        smtp_user: None,
        smtp_pass: None,
        smtp_from: "noreply@example.com".to_string(),
    }.sanitized_db_url();

    assert!(!sample_sanitized.contains("SuperSecretPass123!"), "Password must be masked in sanitized URL");
    assert!(sample_sanitized.contains("postgres://erpqu_app:***@localhost:5432/erpqu_db"));
}

#[test]
fn test_production_environment_detection() {
    let mut config = AppConfig {
        database_url: "postgres://user:pass@localhost:5432/db".to_string(),
        redis_url: None,
        server_host: "0.0.0.0".to_string(),
        server_port: 8181,
        jwt_secret: "strong-secret-key-32-chars-long-here".to_string(),
        jwt_expiry_hours: 24,
        environment: "production".to_string(),
        smtp_host: "127.0.0.1".to_string(),
        smtp_user: None,
        smtp_pass: None,
        smtp_from: "noreply@example.com".to_string(),
    };

    assert!(config.is_production(), "Environment 'production' must be detected as production");
    config.environment = "development".to_string();
    assert!(!config.is_production(), "Environment 'development' must not be detected as production");
}
