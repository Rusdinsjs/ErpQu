//! API Middleware

pub mod api_version;
pub mod auth;
pub mod rate_limit;
pub mod rbac;
pub mod route_action_registry;
pub mod request_context;
pub mod security_headers;
pub mod tenant;
pub mod log_redaction;

// Explicitly export to avoid ambiguity
pub use auth::auth_middleware;
