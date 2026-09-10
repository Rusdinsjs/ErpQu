//! Log Redaction & Sensitive Data Scrubbing Middleware (N6)
//!
//! Redacts passwords, secret keys, tokens, authorization headers, cookies,
//! and PII from outgoing log streams and request payloads.

#![allow(dead_code)]

use regex::Regex;
use std::sync::LazyLock;

static SENSITIVE_PATTERN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(password|token|secret|authorization|bearer|cookie|ssn|credit_card)\s*[:=]\s*([^&\s,]+)")
        .unwrap()
});

/// Redacts sensitive information from a string message before logging
pub fn redact_sensitive_str(input: &str) -> String {
    SENSITIVE_PATTERN
        .replace_all(input, "$1=[REDACTED]")
        .to_string()
}
