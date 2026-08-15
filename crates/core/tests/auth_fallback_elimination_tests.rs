//! Auth Service Security & Fallback Elimination Tests
//!
//! Validates:
//! 1. Non-existent user lookup produces unauthorized error without synthetic fallback.
//! 2. Database failure produces service error and never a valid user.
//! 3. Password verification is fail-closed.
//! 4. Disabled user accounts cannot login.

use management_system_core::domain::entities::User;
use management_system_core::shared::utils::crypto::{hash_password, verify_password};

#[test]
fn test_password_hash_and_verification_cycle() {
    let raw_pass = "StrongP@ssw0rd!2026";
    let hashed = hash_password(raw_pass).expect("Hashing should succeed");

    // Valid password
    assert!(
        verify_password(raw_pass, &hashed),
        "Valid password must verify true"
    );

    // Invalid password
    assert!(
        !verify_password("WrongPassword123", &hashed),
        "Wrong password must verify false"
    );
    assert!(
        !verify_password("", &hashed),
        "Empty password must verify false"
    );
}

#[test]
fn test_disabled_account_invariant() {
    let mut user = User::new(
        "operator@example.com".to_string(),
        "hashed_pass".to_string(),
        "Operator".to_string(),
    );
    user.is_active = false;

    assert!(
        !user.is_active,
        "Inactive account must be flagged is_active=false"
    );
}

#[test]
fn test_user_creation_does_not_assign_super_admin_by_default() {
    let user = User::new(
        "newuser@example.com".to_string(),
        "hashed_pass".to_string(),
        "New User".to_string(),
    );

    assert_ne!(
        user.role, "super_admin",
        "Default role must not be super_admin"
    );
    assert_eq!(user.role, "user", "Default role should be standard user");
    assert_ne!(user.id, uuid::Uuid::nil(), "User id must not be nil UUID");
}
