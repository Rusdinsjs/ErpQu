//! Tenant Middleware (QTEN-001 / QTEN-005)
//!
//! Provides multi-tenant resolution via:
//! 1. `X-Company-ID` HTTP header (explicit selection)
//! 2. Subdomain resolution (`acme.erpqu.com` → resolves `acme` to company_id via `domain_slug`)
//! 3. Mandatory UserClaims token tenant context extraction
//! 4. Non-admin membership validation (prevents cross-tenant data access)

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
    "app", "api", "admin", "www", "mail", "localhost", "127", "staging", "dev", "prod",
];

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

    let is_super_admin = claims.role == "super_admin" || claims.role_level <= 1;
    let mut resolved_company_id: Option<Uuid> = None;

    // Method 1: Explicit X-Company-ID header
    if let Some(company_header) = request.headers().get("x-company-id") {
        if let Ok(company_str) = company_header.to_str() {
            if let Ok(company_uuid) = Uuid::parse_str(company_str) {
                resolved_company_id = Some(company_uuid);
            }
        }
    }

    // Method 2: Subdomain resolution from Host header if no X-Company-ID header
    if resolved_company_id.is_none() {
        if let Some(host_header) = request.headers().get("host") {
            if let Ok(host_str) = host_header.to_str() {
                // E.g. "acme.erpqu.com:443" or "acme.localhost:3000"
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
                            tracing::debug!("Subdomain '{}' resolved to company {}", subdomain, c_id);
                        }
                    }
                }
            }
        }
    }

    // Validate membership if a specific company was requested/resolved
    if let Some(company_uuid) = resolved_company_id {
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
                    "Tenant Middleware: Blocked user {} from selecting company {} outside membership",
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
