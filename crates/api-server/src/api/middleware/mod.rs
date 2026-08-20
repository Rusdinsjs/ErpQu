//! API Middleware

pub mod api_version;
pub mod auth;
pub mod log_redaction;
pub mod rate_limit;
pub mod rbac;
pub mod request_context;
pub mod route_action_registry;
pub mod security_headers;
pub mod tenant;

// Explicitly export to avoid ambiguity
pub use auth::auth_middleware;
