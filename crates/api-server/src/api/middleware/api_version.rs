//! API Version Compatibility Middleware (QAPI-004)
//!
//! Provides backward-compatible API versioning by rewriting `/api/v1/...` to `/api/...`.
//! This allows clients to start using versioned URLs immediately while the backend
//! continues serving from `/api/` routes internally.
//!
//! When a breaking change requires a v2 API, new routes can be added under `/api/v2/`
//! while v1 routes remain stable.

use axum::{
    body::Body,
    http::{Request, Uri},
    middleware::Next,
    response::Response,
};

/// Middleware that rewrites `/api/v1/...` requests to `/api/...`
/// This provides URL-level API versioning without duplicating route definitions.
///
/// Clients can use either:
///   - `GET /api/assets`     (current, always works)
///   - `GET /api/v1/assets`  (versioned, forwards to /api/assets)
///
/// The `X-API-Version` response header indicates the actual API version served.
pub async fn api_version_rewrite_middleware(
    mut req: Request<Body>,
    next: Next,
) -> Response<Body> {
    let original_uri = req.uri().clone();
    let path = original_uri.path();

    // Check if path starts with /api/v1/
    if path.starts_with("/api/v1/") {
        // Rewrite: /api/v1/assets → /api/assets
        let new_path = format!("/api/{}", &path[8..]); // Skip "/api/v1/"
        let new_uri = build_uri(&original_uri, &new_path);
        if let Ok(uri) = new_uri {
            *req.uri_mut() = uri;
        }
    }

    let mut response = next.run(req).await;

    // Always add the API version header
    response.headers_mut().insert(
        axum::http::HeaderName::from_static("x-api-version"),
        axum::http::HeaderValue::from_static("v1"),
    );

    response
}

/// Build a new URI preserving query string and other components
fn build_uri(original: &Uri, new_path: &str) -> Result<Uri, axum::http::uri::InvalidUri> {
    if let Some(query) = original.query() {
        format!("{}?{}", new_path, query).parse()
    } else {
        new_path.parse()
    }
}
