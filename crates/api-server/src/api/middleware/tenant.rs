//! Tenant Middleware (QTEN-001 / QTEN-005)
//!
//! Provides strict multi-tenant resolution via:
//! 1. `X-Company-ID` HTTP header (rejects malformed header with 400 Bad Request)
//! 2. Subdomain resolution (`acme.erpqu.com` → resolves `acme` to company_id via `domain_slug`)
//! 3. Mandatory UserClaims token tenant context extraction
//! 4. Strict company context enforcement: non-exempt routes MUST carry company context
//! 5. Only super_admin bypasses company membership checks (A2 enforcement)

use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::entities::UserClaims;
use management_system_core::domain::tenant::TenantContext;

/// List of reserved subdomains that do NOT represent tenant slugs
const RESERVED_SUBDOMAINS: &[&str] = &[
    "app",
    "api",
    "admin",
    "www",
    "mail",
    "localhost",
    "127",
    "staging",
    "dev",
    "prod",
];

/// Paths that are exempt from mandatory company context requirement.
/// These are system-level or user-personal endpoints that operate outside company scope.
const COMPANY_EXEMPT_PREFIXES: &[&str] = &[
    "/api/setup-wizard",
    "/api/companies/accessible",
    "/api/companies/tree",
    "/api/auth",
    "/api/me",
    "/api/settings",
    "/api/public-settings",
    "/api/rbac",
    "/api/lookups",
    "/api/uploads",
    "/api/upload",
    "/api/users",
    "/api/roles",
    "/api/doctypes",
    "/api/docperms",
    "/api/notifications",
    "/api/audit/sessions",
    "/api/loans/my",
];

/// Check if a path is exempt from mandatory company context
fn is_company_exempt(path: &str) -> bool {
    // Exact matches for company list endpoint (but not company CRUD with ID)
    if path == "/api/companies" {
        return true;
    }
    COMPANY_EXEMPT_PREFIXES.iter().any(|prefix| path.starts_with(prefix))
}

pub async fn tenant_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let claims = request
        .extensions()
        .get::<UserClaims>()
        .cloned()
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let mut tenant_ctx = TenantContext::from_claims(&claims).map_err(|e| {
        tracing::warn!("Tenant Middleware Error: {:?}", e);
        StatusCode::UNAUTHORIZED
    })?;

    let request_path = request.uri().path().to_string();
    let mut resolved_company_id: Option<Uuid> = None;

    // Method 1: Explicit X-Company-ID header (Strict Validation: Malformed header returns 400 Bad Request)
    if let Some(company_header) = request.headers().get("x-company-id") {
        let company_str = company_header.to_str().map_err(|_| {
            tracing::warn!("Tenant Middleware: Malformed X-Company-ID header characters");
            StatusCode::BAD_REQUEST
        })?;

        let company_uuid = Uuid::parse_str(company_str).map_err(|_| {
            tracing::warn!(
                "Tenant Middleware: Malformed X-Company-ID UUID format: {}",
                company_str
            );
            StatusCode::BAD_REQUEST
        })?;

        resolved_company_id = Some(company_uuid);
    }

    // Method 2: Subdomain resolution from Host header if no X-Company-ID header
    if resolved_company_id.is_none() {
        if let Some(host_header) = request.headers().get("host") {
            if let Ok(host_str) = host_header.to_str() {
                let host_only = host_str.split(':').next().unwrap_or(host_str);
                let parts: Vec<&str> = host_only.split('.').collect();

                if parts.len() >= 2 {
                    let subdomain = parts[0].to_lowercase();
                    if !RESERVED_SUBDOMAINS.contains(&subdomain.as_str()) {
                        let company: Option<Uuid> = sqlx::query_scalar(
                            "SELECT id FROM companies WHERE LOWER(domain_slug) = $1 AND status = 'ACTIVE'",
                        )
                        .bind(&subdomain)
                        .fetch_optional(&state.pool)
                        .await
                        .ok()
                        .flatten();

                        if let Some(c_id) = company {
                            resolved_company_id = Some(c_id);
                            tracing::debug!(
                                "Subdomain '{}' resolved to company {}",
                                subdomain,
                                c_id
                            );
                        }
                    }
                }
            }
        }
    }

    // A1 ENFORCEMENT: Mandatory company context for non-exempt paths
    if resolved_company_id.is_none() && !is_company_exempt(&request_path) {
        tracing::warn!(
            "Tenant Middleware: Rejected request to {} — missing company context (no X-Company-ID header)",
            request_path
        );
        return Err(StatusCode::BAD_REQUEST);
    }

    // A2 ENFORCEMENT: Validate company membership (only super_admin bypasses membership check)
    if let Some(company_uuid) = resolved_company_id {
        let is_super_admin = claims.role == "super_admin";

        if !is_super_admin {
            let has_emp = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM hr.employees WHERE user_id = $1 AND company_id = $2)",
            )
            .bind(claims.user_id())
            .bind(company_uuid)
            .fetch_one(&state.pool)
            .await
            .unwrap_or(false);

            let has_perm = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM public.user_permissions WHERE user_id = $1 AND allow_doctype = 'Company' AND for_value = $2)",
            )
            .bind(claims.user_id())
            .bind(company_uuid.to_string())
            .fetch_one(&state.pool)
            .await
            .unwrap_or(false);

            if !has_emp && !has_perm {
                tracing::warn!(
                    "Tenant Middleware: Blocked user {} from selecting company {} — no membership (A2 enforced)",
                    claims.sub,
                    company_uuid
                );
                return Err(StatusCode::FORBIDDEN);
            }
        }

        tenant_ctx.company_id = Some(company_uuid);
    }

    request.extensions_mut().insert(tenant_ctx);

    Ok(next.run(request).await)
}

