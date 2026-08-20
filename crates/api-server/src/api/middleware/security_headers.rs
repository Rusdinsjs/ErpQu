use axum::http::header;
use axum::{
    body::Body,
    http::{HeaderValue, Request, Response},
    middleware::Next,
};
use uuid::Uuid;

/// Middleware to add comprehensive security headers to all responses.
/// These headers complement Nginx security headers (defense in depth).
pub async fn security_headers_middleware(req: Request<Body>, next: Next) -> Response<Body> {
    // Generate request ID for distributed tracing
    let request_id = req
        .headers()
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let mut response = next.run(req).await;
    let headers = response.headers_mut();

    // Prevent clickjacking
    headers.insert(header::X_FRAME_OPTIONS, HeaderValue::from_static("DENY"));

    // Prevent MIME type sniffing
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );

    // Enable XSS filtering
    headers.insert(
        header::X_XSS_PROTECTION,
        HeaderValue::from_static("1; mode=block"),
    );

    // Strict Transport Security (HSTS) - 1 year with preload
    headers.insert(
        header::STRICT_TRANSPORT_SECURITY,
        HeaderValue::from_static("max-age=31536000; includeSubDomains; preload"),
    );

    // Referrer-Policy: Only send origin on cross-origin requests
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );

    // Permissions-Policy: Disable unnecessary browser features
    if let Ok(val) =
        HeaderValue::from_str("camera=(), microphone=(), geolocation=(self), payment=(), usb=()")
    {
        headers.insert(
            axum::http::HeaderName::from_static("permissions-policy"),
            val,
        );
    }

    // Content Security Policy
    // Permissive enough for the SPA frontend but enforcing basics
    headers.insert(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static(
            "default-src 'self'; \
             img-src 'self' data: https: blob:; \
             script-src 'self' 'unsafe-inline' 'unsafe-eval'; \
             style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; \
             font-src 'self' data: https://fonts.gstatic.com; \
             connect-src 'self' ws: wss:; \
             frame-ancestors 'none'",
        ),
    );

    // X-Request-ID for distributed tracing
    if let Ok(val) = HeaderValue::from_str(&request_id) {
        headers.insert(axum::http::HeaderName::from_static("x-request-id"), val);
    }

    response
}
