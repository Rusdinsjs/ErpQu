//! Real Security Containment Unit Tests (Phase 15 Security Containment)
//!
//! Validates:
//! 1. AppConfig::from_env panics when mandatory JWT_SECRET is missing.
//! 2. AppConfig::from_env panics when mandatory DATABASE_URL is missing.
//! 3. DatabaseConfig::default panics when DATABASE_URL is missing.
//! 4. JwtConfig::from_env panics when JWT_SECRET is missing.
//! 5. Connection string sanitizer properly masks raw passwords.
//! 6. Production mode validation rejects insecure/default JWT secrets.

use management_system_core::infrastructure::database::connection::DatabaseConfig;
use management_system_core::shared::config::{sanitize_connection_string, AppConfig};
use management_system_core::shared::utils::jwt::JwtConfig;
use std::sync::Mutex;

static ENV_LOCK: Mutex<()> = Mutex::new(());

#[test]
fn test_sanitize_connection_string_masks_password() {
    let raw_url = "postgres://admin_user:SuperSecretPassword123!@localhost:5432/erpqu_prod";
    let sanitized = sanitize_connection_string(raw_url);

    assert!(
        !sanitized.contains("SuperSecretPassword123!"),
        "Raw password must never remain in sanitized connection string"
    );
    assert!(
        sanitized.contains("postgres://admin_user:***@localhost:5432/erpqu_prod"),
        "Password must be replaced with ***"
    );
}

#[test]
fn test_app_config_panics_without_jwt_secret() {
    let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    std::env::set_var("DATABASE_URL", "postgres://user:pass@localhost:5432/db");
    std::env::set_var("JWT_SECRET", "");

    let result = std::panic::catch_unwind(|| {
        let _ = AppConfig::from_env();
    });
    assert!(result.is_err());
    let panic_msg = result.unwrap_err();
    let msg = panic_msg
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| panic_msg.downcast_ref::<String>().map(|s| s.as_str()))
        .unwrap_or("");
    assert!(msg.contains("JWT_SECRET environment variable is required"));
}

#[test]
fn test_app_config_panics_without_database_url() {
    let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    std::env::set_var("JWT_SECRET", "valid-secret-key-32-chars-long-secure");
    std::env::set_var("DATABASE_URL", "");

    let result = std::panic::catch_unwind(|| {
        let _ = AppConfig::from_env();
    });
    assert!(result.is_err());
    let panic_msg = result.unwrap_err();
    let msg = panic_msg
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| panic_msg.downcast_ref::<String>().map(|s| s.as_str()))
        .unwrap_or("");
    assert!(msg.contains("DATABASE_URL must be set"));
}

#[test]
fn test_database_config_default_panics_without_database_url() {
    let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    std::env::set_var("DATABASE_URL", "");

    let result = std::panic::catch_unwind(|| {
        let _ = DatabaseConfig::default();
    });
    assert!(result.is_err());
    let panic_msg = result.unwrap_err();
    let msg = panic_msg
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| panic_msg.downcast_ref::<String>().map(|s| s.as_str()))
        .unwrap_or("");
    assert!(msg.contains("DATABASE_URL environment variable is required"));
}

#[test]
fn test_jwt_config_from_env_panics_without_jwt_secret() {
    let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    std::env::set_var("JWT_SECRET", "");

    let result = std::panic::catch_unwind(|| {
        let _ = JwtConfig::from_env();
    });
    assert!(result.is_err());
    let panic_msg = result.unwrap_err();
    let msg = panic_msg
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| panic_msg.downcast_ref::<String>().map(|s| s.as_str()))
        .unwrap_or("");
    assert!(msg.contains("JWT_SECRET environment variable is required"));
}

#[test]
#[should_panic(expected = "FATAL SECURITY ERROR")]
fn test_production_mode_rejects_weak_jwt_secret() {
    let config = AppConfig {
        database_url: "postgres://user:pass@localhost:5432/db".to_string(),
        redis_url: None,
        server_host: "0.0.0.0".to_string(),
        server_port: 8181,
        jwt_secret: "change-this-jwt-secret-in-production-min-32-chars".to_string(),
        jwt_expiry_hours: 24,
        environment: "production".to_string(),
        smtp_host: "127.0.0.1".to_string(),
        smtp_user: None,
        smtp_pass: None,
        smtp_from: "noreply@example.com".to_string(),
    };

    config.validate_production_secrets();
}
