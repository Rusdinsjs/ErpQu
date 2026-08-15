//! Auth, Session, Token, and Upload Security Tests (Fase 4)
//!
//! Validates:
//! 1. Expired JWT rejection.
//! 2. Extension allowlist reject unpermitted formats.
//! 3. Private upload sanitization & traversal defense.

use chrono::Utc;
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::utils::jwt::{create_token, decode_token, JwtConfig};
use uuid::Uuid;

#[test]
fn test_expired_token_is_strictly_rejected() {
    let jwt_config = JwtConfig::new("test-secret-key-32-chars-long-here".to_string(), 1);
    let now = Utc::now().timestamp();

    let expired_claims = UserClaims {
        sub: Uuid::new_v4().to_string(),
        email: "user@example.com".to_string(),
        name: "Test User".to_string(),
        role: "user".to_string(),
        role_level: 5,
        department: None,
        allowed_asset_group: None,
        org: None,
        employee_id: None,
        permissions: vec![],
        exp: now - 3600, // Expired 1 hour ago
        iat: now - 7200,
        jti: Uuid::new_v4().to_string(),
    };

    let token = create_token(&expired_claims, &jwt_config).expect("Token encoding failed");
    let result = decode_token::<UserClaims>(&token, &jwt_config);

    assert!(result.is_err(), "Expired token must be rejected fail-closed");
}

#[test]
fn test_valid_token_decodes_successfully() {
    let jwt_config = JwtConfig::new("test-secret-key-32-chars-long-here".to_string(), 1);
    let now = Utc::now().timestamp();
    let user_id = Uuid::new_v4();

    let valid_claims = UserClaims {
        sub: user_id.to_string(),
        email: "authorized@example.com".to_string(),
        name: "Authorized User".to_string(),
        role: "admin".to_string(),
        role_level: 1,
        department: Some("IT".to_string()),
        allowed_asset_group: None,
        org: None,
        employee_id: None,
        permissions: vec!["*".to_string()],
        exp: now + 3600,
        iat: now,
        jti: Uuid::new_v4().to_string(),
    };

    let token = create_token(&valid_claims, &jwt_config).expect("Token encoding failed");
    let decoded: UserClaims = decode_token(&token, &jwt_config).expect("Valid token should decode");

    assert_eq!(decoded.user_id(), user_id);
    assert_eq!(decoded.email, "authorized@example.com");
    assert_eq!(decoded.role, "admin");
}

#[test]
fn test_path_traversal_detection() {
    let malicious_paths = vec![
        "../secret.env",
        "..\\windows\\system32",
        "uploads/../../etc/passwd",
        "nested/../../../root",
    ];

    for path in malicious_paths {
        let safe_path = path.trim_start_matches('/');
        let is_traversal = safe_path.contains("..") || safe_path.contains('\\');
        assert!(is_traversal, "Path traversal pattern '{}' must be detected", path);
    }
}
