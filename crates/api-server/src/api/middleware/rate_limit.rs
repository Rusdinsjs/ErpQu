use axum::extract::ConnectInfo;
use axum::{
    body::Body,
    http::{Request, Response, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::{
    sync::{Arc, Mutex, OnceLock},
    time::{Duration, Instant},
};

/// Sliding window rate limiter with configurable per-path limits
/// Supports X-Forwarded-For header extraction when behind reverse proxy
const DEFAULT_RATE_LIMIT_WINDOW: Duration = Duration::from_secs(60);
const DEFAULT_MAX_REQUESTS_PER_WINDOW: u32 = 300;
const AUTH_MAX_REQUESTS_PER_WINDOW: u32 = 10; // Stricter for auth endpoints

#[derive(Clone)]
struct RateLimitEntry {
    count: u32,
    window_start: Instant,
    limit: u32,
}

#[derive(Clone)]
struct RateLimiter {
    entries: Arc<Mutex<HashMap<String, RateLimitEntry>>>,
    last_cleanup: Arc<Mutex<Instant>>,
}

impl RateLimiter {
    fn new() -> Self {
        Self {
            entries: Arc::new(Mutex::new(HashMap::new())),
            last_cleanup: Arc::new(Mutex::new(Instant::now())),
        }
    }

    fn check_rate_limit(&self, key: String, max_requests: u32) -> Result<(u32, u32), ()> {
        let mut entries = self.entries.lock().unwrap_or_else(|e| e.into_inner());
        let now = Instant::now();

        // Periodic cleanup: every 5 minutes, remove expired entries
        {
            let mut last_cleanup = self.last_cleanup.lock().unwrap_or_else(|e| e.into_inner());
            if now.duration_since(*last_cleanup) > Duration::from_secs(300) {
                entries.retain(|_, entry| {
                    now.duration_since(entry.window_start) < DEFAULT_RATE_LIMIT_WINDOW
                });
                *last_cleanup = now;
            }
        }

        let entry = entries.entry(key).or_insert_with(|| RateLimitEntry {
            count: 0,
            window_start: now,
            limit: max_requests,
        });

        // Reset window if expired
        if now.duration_since(entry.window_start) > DEFAULT_RATE_LIMIT_WINDOW {
            entry.count = 0;
            entry.window_start = now;
            entry.limit = max_requests;
        }

        entry.count += 1;
        let remaining = max_requests.saturating_sub(entry.count);

        if entry.count <= max_requests {
            Ok((remaining, max_requests))
        } else {
            Err(())
        }
    }
}

// Global instance
static GLOBAL_RATE_LIMITER: OnceLock<RateLimiter> = OnceLock::new();

/// Extract real client IP, respecting X-Forwarded-For when behind a reverse proxy
fn extract_client_ip(req: &Request<Body>, addr: &SocketAddr) -> String {
    // Trust X-Forwarded-For if present (set by Nginx)
    if let Some(forwarded_for) = req.headers().get("x-forwarded-for") {
        if let Ok(value) = forwarded_for.to_str() {
            // X-Forwarded-For: client, proxy1, proxy2 — take the first (client)
            if let Some(client_ip) = value.split(',').next() {
                return client_ip.trim().to_string();
            }
        }
    }

    // Also check X-Real-IP (Nginx sometimes uses this)
    if let Some(real_ip) = req.headers().get("x-real-ip") {
        if let Ok(value) = real_ip.to_str() {
            return value.trim().to_string();
        }
    }

    // Fallback to socket address
    addr.ip().to_string()
}

/// Determine rate limit based on request path
fn get_rate_limit_for_path(path: &str) -> u32 {
    if path.starts_with("/api/auth/login") || path.starts_with("/api/auth/register") {
        AUTH_MAX_REQUESTS_PER_WINDOW
    } else if path.starts_with("/api/upload") {
        30 // Upload: 30 per minute
    } else {
        DEFAULT_MAX_REQUESTS_PER_WINDOW
    }
}

pub async fn rate_limit_middleware(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    req: Request<Body>,
    next: Next,
) -> Response<Body> {
    let ip = extract_client_ip(&req, &addr);
    let path = req.uri().path().to_string();
    let max_requests = get_rate_limit_for_path(&path);

    // Create a rate limit key combining IP and path category
    let rate_key = if path.starts_with("/api/auth/") {
        format!("{}:auth", ip)
    } else if path.starts_with("/api/upload") {
        format!("{}:upload", ip)
    } else {
        format!("{}:api", ip)
    };

    let limiter = GLOBAL_RATE_LIMITER.get_or_init(RateLimiter::new);

    match limiter.check_rate_limit(rate_key, max_requests) {
        Ok((remaining, limit)) => {
            let mut response = next.run(req).await;
            // Add rate limit headers for transparency
            let headers = response.headers_mut();
            if let Ok(v) = axum::http::HeaderValue::from_str(&limit.to_string()) {
                headers.insert("x-ratelimit-limit", v);
            }
            if let Ok(v) = axum::http::HeaderValue::from_str(&remaining.to_string()) {
                headers.insert("x-ratelimit-remaining", v);
            }
            response
        }
        Err(()) => {
            tracing::warn!(
                "RATE_LIMIT_EXCEEDED: IP={} Path={} Limit={}",
                ip, path, max_requests
            );
            let mut response = (
                StatusCode::TOO_MANY_REQUESTS,
                axum::Json(serde_json::json!({
                    "error": "Too Many Requests",
                    "message": "Rate limit exceeded. Please try again later.",
                    "retry_after_seconds": 60
                })),
            )
                .into_response();
            response.headers_mut().insert(
                "retry-after",
                axum::http::HeaderValue::from_static("60"),
            );
            response
        }
    }
}
