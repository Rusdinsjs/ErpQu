//! Tenant Middleware (QTEN-001)

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

/// Tenant middleware: extracts mandatory TenantContext from UserClaims and X-Company-ID header,
/// and validates company membership for non-admin users.
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

    // Optional X-Company-ID header extraction for multi-company context
    if let Some(company_header) = request.headers().get("x-company-id") {
        if let Ok(company_str) = company_header.to_str() {
            if let Ok(company_uuid) = Uuid::parse_str(company_str) {
                // Validate company membership if user is not super_admin or admin
                let is_admin = claims.role == "super_admin"
                    || claims.role == "admin"
                    || claims.role.starts_with("admin_")
                    || claims.role_level <= 2;

                if !is_admin {
                    let has_emp = sqlx::query_scalar::<_, bool>(
                        "SELECT EXISTS(SELECT 1 FROM public.employees WHERE user_id = $1 AND company_id = $2)"
                    )
                    .bind(claims.user_id())
                    .bind(company_uuid)
                    .fetch_one(&state.pool)
                    .await
                    .unwrap_or(false);

                    let has_perm = sqlx::query_scalar::<_, bool>(
                        "SELECT EXISTS(SELECT 1 FROM public.user_permissions WHERE user_id = $1 AND allow_doctype = 'Company' AND for_value = $2)"
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
        }
    }

    request.extensions_mut().insert(tenant_ctx);

    Ok(next.run(request).await)
}
