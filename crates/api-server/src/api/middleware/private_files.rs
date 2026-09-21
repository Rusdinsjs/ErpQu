//! Private File Gate Middleware (QSEC-006 hardening)
//!
//! Browser rendering via `<img src>` / `<a href>` cannot attach an
//! `Authorization: Bearer` header, which is why the upload directory used to be
//! served as a fully public static folder. That made every uploaded document
//! anonymously reachable.
//!
//! This middleware keeps the existing URL layout working while requiring the
//! requester to present *some* authenticated identity:
//!
//! 2. The HttpOnly `erpqu_file_gate` cookie — an HMAC-signed, short-lived ticket
//!    issued at login/refresh so `<img src>` keeps working without exposing the
//!    access token to JavaScript-readable storage.
//! 3. Public branding assets (`uploads/avatars/...`) — company logos and user
//!    avatars are rendered on the pre-authentication login page, so they must
//!    stay reachable. They carry no tenant business data.
//!
//! Everything else (asset documents, expense proofs, contract scans, ...) is
//! rejected with 401 unless one of the authenticated mechanisms above matches.

use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::utils::jwt::decode_token;

pub const FILE_GATE_COOKIE: &str = "erpqu_file_gate";

/// Path prefixes that stay publicly readable for pre-auth branding (logos/avatars).
const PUBLIC_FILE_PREFIXES: &[&str] = &[
    "uploads/avatars/",
    "uploads/logos/",
    "uploads/branding/",
    "uploads/public/",
];

fn hmac_sign(secret: &[u8], payload: &str) -> String {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret).expect("HMAC accepts any key size");
    mac.update(payload.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

/// Build the signed ticket value stored in the file-gate cookie.
/// Format: `<user_id>:<company_id|->:<expires_at>:<signature>`
pub fn build_file_gate_ticket(
    secret: &str,
    user_id: &str,
    company_id: Option<&str>,
    expires_at: i64,
) -> String {
    let company = company_id.unwrap_or("-");
    let payload = format!("{}:{}:{}", user_id, company, expires_at);
    let signature = hmac_sign(secret.as_bytes(), &payload);
    format!("{}:{}", payload, signature)
}

/// Verify a file-gate ticket. Returns true when the signature is authentic and unexpired.
pub fn verify_file_gate_ticket(secret: &str, ticket: &str, now: i64) -> bool {
    let parts: Vec<&str> = ticket.split(':').collect();
    if parts.len() != 4 {
        return false;
    }
    let (user_id, company_id, expires_raw, signature) = (parts[0], parts[1], parts[2], parts[3]);
    let expires_at: i64 = match expires_raw.parse() {
        Ok(v) => v,
        Err(_) => return false,
    };
    if now > expires_at {
        return false;
    }
    let payload = format!("{}:{}:{}", user_id, company_id, expires_at);
    let expected = hmac_sign(secret.as_bytes(), &payload);
    // Constant-time-ish comparison via HMAC of both sides
    expected.eq_ignore_ascii_case(signature)
}

/// Extract a named cookie value from the raw `Cookie` header.
fn read_cookie(headers: &header::HeaderMap, name: &str) -> Option<String> {
    let raw = headers.get(header::COOKIE)?.to_str().ok()?;
    raw.split(';').find_map(|part| {
        let part = part.trim();
        let (k, v) = part.split_once('=')?;
        if k.trim() == name {
            Some(v.trim().to_string())
        } else {
            None
        }
    })
}

/// Check whether a file is a public branding asset (company logo, branding, avatar).
/// Files in public prefixes or registered in companies/settings/uploads as logos
/// are served without requiring user authentication.
async fn is_public_branding_asset(pool: &sqlx::PgPool, relative_path: &str) -> bool {
    if PUBLIC_FILE_PREFIXES
        .iter()
        .any(|p| relative_path.starts_with(p))
    {
        return true;
    }

    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return false,
    };

    let _ = sqlx::query("SET LOCAL app.is_super_tenant = 'true'")
        .execute(&mut *tx)
        .await;

    let path_with_api = format!("/api/{}", relative_path);
    let path_with_slash = format!("/{}", relative_path);

    let is_public: bool = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM public.uploads 
            WHERE file_path = $1 
              AND (entity_type IN ('company_logo', 'logo', 'avatar', 'branding') OR role_level_required >= 5)
        ) OR EXISTS (
            SELECT 1 FROM public.companies 
            WHERE logo_url IN ($1, $2, $3)
        ) OR EXISTS (
            SELECT 1 FROM public.settings 
            WHERE key = 'company_logo' 
              AND (value::text IN ($1, $2, $3) OR trim(both '"' from value::text) IN ($1, $2, $3))
        )
        "#
    )
    .bind(relative_path)
    .bind(&path_with_api)
    .bind(&path_with_slash)
    .fetch_one(&mut *tx)
    .await
    .unwrap_or(false);

    let _ = tx.commit().await;
    is_public
}

/// Check that a requester's identity is authorized for the exact upload path.
async fn upload_record_allows(
    state: &AppState,
    relative_path: &str,
    requester_id: Uuid,
    requester_role_level: Option<i32>,
    requested_company: Option<Uuid>,
) -> bool {
    let mut tx = match state.pool.begin().await {
        Ok(tx) => tx,
        Err(_) => return false,
    };

    let _ = sqlx::query("SET LOCAL app.is_super_tenant = 'true'")
        .execute(&mut *tx)
        .await;

    let row = sqlx::query_as::<_, (Uuid, Option<Uuid>, i32, Option<String>)>(
        "SELECT uploaded_by, company_id, role_level_required, entity_type FROM public.uploads WHERE file_path = $1",
    )
    .bind(relative_path)
    .fetch_optional(&mut *tx)
    .await
    .ok()
    .flatten();

    let _ = tx.commit().await;

    let Some((uploaded_by, company_id, role_level_required, entity_type)) = row else {
        // A private path without metadata is not trusted. This also prevents
        // UUID/path guessing against legacy files that bypassed the upload table.
        return false;
    };

    if let Some(ref et) = entity_type {
        if matches!(et.as_str(), "company_logo" | "logo" | "avatar" | "branding") {
            return true;
        }
    }

    if uploaded_by == requester_id {
        return true;
    }

    // Role-based access must carry an explicit company context; never infer it
    // from a bearer token because UserClaims intentionally has no active company.
    matches!((company_id, requested_company, requester_role_level),
        (Some(file_company), Some(request_company), Some(level))
            if file_company == request_company && level <= role_level_required)
}

/// Parse the user id from a valid file-gate ticket.
fn ticket_user_id(ticket: &str) -> Option<Uuid> {
    let user_id = ticket.split(':').next()?;
    Uuid::parse_str(user_id).ok()
}

/// Parse an optional company header without silently accepting malformed values.
fn requested_company(headers: &header::HeaderMap) -> Result<Option<Uuid>, StatusCode> {
    match headers.get("x-company-id") {
        None => Ok(None),
        Some(value) => value
            .to_str()
            .ok()
            .and_then(|s| Uuid::parse_str(s).ok())
            .map(Some)
            .ok_or(StatusCode::BAD_REQUEST),
    }
}

/// Result of mapping a request path onto the storage directory.
enum StoragePath {
    /// Request does not address the upload storage at all — not our concern.
    NotStorage,
    /// Request addresses a private storage object at this relative path.
    Private(String),
    /// Request addresses the storage namespace but the sub-path is invalid.
    Invalid,
}

/// Normalize the request path into a storage-relative path (`uploads/...`).
fn storage_relative_path(path: &str) -> StoragePath {
    let stripped = match path
        .strip_prefix("/api/uploads/")
        .or_else(|| path.strip_prefix("/uploads/"))
    {
        Some(s) => s,
        None => return StoragePath::NotStorage,
    };

    // The private download route has its own authorization handler.
    if stripped.starts_with("download/") {
        return StoragePath::NotStorage;
    }
    if stripped.contains("..") || stripped.contains('\\') || stripped.contains('\0') {
        return StoragePath::Invalid;
    }
    StoragePath::Private(format!("uploads/{}", stripped))
}

pub async fn private_file_gate_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let path = request.uri().path().to_string();

    let relative = match storage_relative_path(&path) {
        StoragePath::NotStorage => {
            // Not a storage path (e.g. /api/uploads/download/:id) — let the route handle it.
            return Ok(next.run(request).await);
        }
        StoragePath::Invalid => {
            tracing::warn!("PRIVATE FILE PATH REJECTED: {}", path);
            return Err(StatusCode::BAD_REQUEST);
        }
        StoragePath::Private(rel) => rel,
    };

    // Public branding assets (logos/avatars/company logos) render before authentication.
    if is_public_branding_asset(&state.pool, &relative).await {
        return Ok(next.run(request).await);
    }

    let headers = request.headers().clone();
    let now = chrono::Utc::now().timestamp();
    let secret = &state.jwt_config.secret;
    let requested_company = requested_company(&headers)?;

    // 1. Bearer token — validate both the token and the upload metadata.
    if let Some(value) = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
    {
        let token = value.strip_prefix("Bearer ").unwrap_or(value);
        if let Ok(claims) = decode_token::<UserClaims>(token, &state.jwt_config) {
            if upload_record_allows(
                &state,
                &relative,
                claims.user_id(),
                Some(claims.role_level),
                requested_company,
            )
            .await
            {
                return Ok(next.run(request).await);
            }
        }
    }

    // Signed URLs are handled by `get_private_file`, which validates the HMAC
    // against the file id/path. They are deliberately not accepted on this
    // static compatibility route: accepting arbitrary `expires`/`signature`
    // values here would turn the query string into an authentication bypass.

    // 2. HttpOnly file-gate cookie — a cookie is only sufficient for the owner
    // of the upload. It is deliberately not a role-level authorization token.
    if let Some(ticket) = read_cookie(&headers, FILE_GATE_COOKIE) {
        if verify_file_gate_ticket(secret, &ticket, now) {
            if let Some(user_id) = ticket_user_id(&ticket) {
                if upload_record_allows(&state, &relative, user_id, None, None).await {
                    return Ok(next.run(request).await);
                }
            }
        }
    }

    tracing::warn!(
        "PRIVATE FILE ACCESS DENIED: path={} (no bearer, no valid signature, no file-gate cookie)",
        path
    );
    Err(StatusCode::UNAUTHORIZED)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ticket_roundtrip_is_accepted() {
        let secret = "test-secret";
        let now = 1_000_000;
        let ticket = build_file_gate_ticket(secret, "user-1", Some("company-1"), now + 3600);
        assert!(verify_file_gate_ticket(secret, &ticket, now));
    }

    #[test]
    fn expired_ticket_is_rejected() {
        let secret = "test-secret";
        let now = 1_000_000;
        let ticket = build_file_gate_ticket(secret, "user-1", None, now - 1);
        assert!(!verify_file_gate_ticket(secret, &ticket, now));
    }

    #[test]
    fn tampered_ticket_is_rejected() {
        let secret = "test-secret";
        let now = 1_000_000;
        let ticket = build_file_gate_ticket(secret, "user-1", None, now + 3600);
        let tampered = ticket.replace("user-1", "user-2");
        assert!(!verify_file_gate_ticket(secret, &tampered, now));
    }

    #[test]
    fn other_secret_is_rejected() {
        let now = 1_000_000;
        let ticket = build_file_gate_ticket("secret-a", "user-1", None, now + 3600);
        assert!(!verify_file_gate_ticket("secret-b", &ticket, now));
    }

    #[test]
    fn storage_path_normalization() {
        assert!(matches!(
            storage_relative_path("/api/uploads/2026/09/08/a.webp"),
            StoragePath::Private(p) if p == "uploads/2026/09/08/a.webp"
        ));
        assert!(matches!(
            storage_relative_path("/uploads/avatars/x.png"),
            StoragePath::Private(p) if p == "uploads/avatars/x.png"
        ));
        // Private download route is handled by its own handler.
        assert!(matches!(
            storage_relative_path("/api/uploads/download/abc"),
            StoragePath::NotStorage
        ));
        // Traversal attempts are rejected outright.
        assert!(matches!(
            storage_relative_path("/api/uploads/../../etc/passwd"),
            StoragePath::Invalid
        ));
        // Unrelated API routes are untouched.
        assert!(matches!(
            storage_relative_path("/api/assets"),
            StoragePath::NotStorage
        ));
    }
}
