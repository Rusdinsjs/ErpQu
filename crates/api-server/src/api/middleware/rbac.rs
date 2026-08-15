//! RBAC Middleware with Permission Checking

use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::utils::jwt::{decode_token, JwtConfig};

/// Extract user claims from request
pub fn extract_user_claims(request: &Request) -> Option<UserClaims> {
    // Try to get from extensions first (if auth_middleware ran)
    if let Some(claims) = request.extensions().get::<UserClaims>() {
        tracing::debug!("Found claims in extensions: {:?}", claims.sub);
        return Some(claims.clone());
    } else {
        tracing::warn!("No claims in extensions!");
    }

    // Fallback: parse header manually (if middleware didn't run or order is different)
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)?
        .to_str()
        .ok()?;

    let token = auth_header.strip_prefix("Bearer ")?;
    let config = JwtConfig::from_env();
    decode_token(token, &config).ok()
}

// Note: auth_middleware is in auth.rs to avoid duplication

/// Permission check middleware factory
pub fn require_permission(
    permission: &'static str,
) -> impl Fn(
    Request,
    Next,
) -> std::pin::Pin<
    Box<dyn std::future::Future<Output = Result<Response, StatusCode>> + Send>,
> + Clone {
    move |request: Request, next: Next| {
        Box::pin(async move {
            let claims = extract_user_claims(&request).ok_or(StatusCode::UNAUTHORIZED)?;

            // Check if user has permission (supporting wildcards and view/read, edit/update aliases)
            let has_permission = claims.permissions.iter().any(|p| {
                if *p == "*" || *p == permission {
                    return true;
                }
                if let Some(prefix) = p.strip_suffix(".*") {
                    if permission.starts_with(prefix) {
                        return true;
                    }
                }
                // Support aliases between .view/.read and .edit/.update
                let norm_user = p.replace(".view", ".read").replace(".edit", ".update");
                let norm_req = permission
                    .replace(".view", ".read")
                    .replace(".edit", ".update");
                norm_user == norm_req
            });

            if has_permission {
                Ok(next.run(request).await)
            } else {
                tracing::warn!(
                    "Permission denied. Required: {}, User Has: {:?}",
                    permission,
                    claims.permissions
                );

                let body = serde_json::json!({
                    "error": format!("Permission denied: {}", permission),
                    "code": "FORBIDDEN"
                });

                let response = axum::response::Response::builder()
                    .status(StatusCode::FORBIDDEN)
                    .header(axum::http::header::CONTENT_TYPE, "application/json")
                    .body(axum::body::Body::from(
                        serde_json::to_string(&body).unwrap(),
                    ))
                    .unwrap();

                Ok(response)
            }
        })
    }
}

/// Admin-only middleware
pub async fn admin_only_middleware(request: Request, next: Next) -> Result<Response, StatusCode> {
    let claims = extract_user_claims(&request).ok_or(StatusCode::UNAUTHORIZED)?;

    if claims.role == "admin"
        || claims.role == "super_admin"
        || claims.role.starts_with("admin_")
        || claims.role_level <= 2
    {
        Ok(next.run(request).await)
    } else {
        let body = serde_json::json!({
            "error": "Admin access required",
            "code": "FORBIDDEN_ADMIN"
        });

        let response = axum::response::Response::builder()
            .status(StatusCode::FORBIDDEN)
            .header(axum::http::header::CONTENT_TYPE, "application/json")
            .body(axum::body::Body::from(
                serde_json::to_string(&body).unwrap(),
            ))
            .unwrap();

        Ok(response)
    }
}

/// Default-deny middleware: Enforces explicit permission contract on every protected route.
pub async fn default_deny_middleware(request: Request, next: Next) -> Result<Response, StatusCode> {
    let matched_path =
        if let Some(matched) = request.extensions().get::<axum::extract::MatchedPath>() {
            matched.as_str().to_string()
        } else {
            request.uri().path().to_string()
        };

    let claims = extract_user_claims(&request).ok_or(StatusCode::UNAUTHORIZED)?;

    // Admin / Super Admin or low role_level bypass
    if claims.role == "super_admin"
        || claims.role == "admin"
        || claims.role.starts_with("admin_")
        || claims.role_level <= 2
    {
        return Ok(next.run(request).await);
    }

    // Explicitly allowed personal or utility paths
    if matched_path == "/api/me"
        || matched_path == "/api/me/password"
        || matched_path == "/api/me/avatar"
        || matched_path.starts_with("/api/uploads")
        || matched_path.starts_with("/api/upload")
        || matched_path == "/api/loans/my"
    {
        return Ok(next.run(request).await);
    }

    // Determine action suffix
    let method = request.method();
    let action_suffix = if method == axum::http::Method::GET {
        ".view"
    } else if method == axum::http::Method::POST {
        ".create"
    } else if method == axum::http::Method::PUT || method == axum::http::Method::PATCH {
        ".edit"
    } else if method == axum::http::Method::DELETE {
        ".delete"
    } else {
        ".view"
    };

    // Map path prefix to permission module
    let permission_prefix = if matched_path.starts_with("/api/assets") {
        Some("asset")
    } else if matched_path.starts_with("/api/categories") {
        Some("asset_category")
    } else if matched_path.starts_with("/api/locations") {
        Some("location")
    } else if matched_path.starts_with("/api/conversions") {
        Some("asset_conversion")
    } else if matched_path.starts_with("/api/work-orders") {
        Some("work_order")
    } else if matched_path.starts_with("/api/maintenance-templates") {
        Some("maintenance_template")
    } else if matched_path.starts_with("/api/maintenance-teams") {
        Some("maintenance_team")
    } else if matched_path.starts_with("/api/loans") {
        Some("asset_loan")
    } else if matched_path.starts_with("/api/notifications")
        || matched_path.contains("/notifications")
    {
        Some("notification")
    } else if matched_path.starts_with("/api/users") {
        Some("user")
    } else if matched_path.starts_with("/api/employees") {
        Some("employee")
    } else if matched_path.starts_with("/api/departments") {
        Some("department")
    } else if matched_path.starts_with("/api/hrd/attendance")
        || matched_path.starts_with("/api/attendance")
    {
        Some("attendance")
    } else if matched_path.starts_with("/api/hrd/leaves") {
        Some("leave")
    } else if matched_path.starts_with("/api/hr") {
        Some("hr")
    } else if matched_path.starts_with("/api/finance") {
        Some("finance")
    } else if matched_path.starts_with("/api/rental") {
        Some("rental")
    } else if matched_path.starts_with("/api/client") {
        Some("customer")
    } else if matched_path.starts_with("/api/timesheet") {
        Some("timesheet")
    } else if matched_path.starts_with("/api/billing") {
        Some("billing")
    } else if matched_path.starts_with("/api/asset-expenses") {
        Some("asset_expense")
    } else if matched_path.starts_with("/api/fuel") {
        Some("fuel")
    } else if matched_path.starts_with("/api/contracts") {
        Some("contract")
    } else if matched_path.starts_with("/api/inventory") {
        Some("inventory")
    } else if matched_path.starts_with("/api/ops") {
        Some("ops")
    } else if matched_path.starts_with("/api/maintenance") {
        Some("maintenance")
    } else if matched_path.starts_with("/api/metadata") {
        Some("metadata")
    } else if matched_path.starts_with("/api/tax-renewals") {
        Some("tax_renewal")
    } else if matched_path.starts_with("/api/companies") {
        Some("company")
    } else if matched_path.starts_with("/api/reports") {
        Some("report")
    } else if matched_path.starts_with("/api/analytics") {
        Some("analytics")
    } else if matched_path.starts_with("/api/dashboard") {
        Some("dashboard")
    } else if matched_path.starts_with("/api/audit") {
        Some("audit")
    } else if matched_path.starts_with("/api/workflows") {
        Some("workflow")
    } else if matched_path.starts_with("/api/data-imports") {
        Some("data_import")
    } else if matched_path.starts_with("/api/sensors") {
        Some("sensor")
    } else {
        None
    };

    if let Some(prefix) = permission_prefix {
        let required_perm = format!("{}{}", prefix, action_suffix);

        let has_permission = claims.permissions.iter().any(|p| {
            if *p == "*" || *p == required_perm {
                return true;
            }
            if let Some(p_prefix) = p.strip_suffix(".*") {
                if required_perm.starts_with(p_prefix) {
                    return true;
                }
            }
            let norm_user = p.replace(".view", ".read").replace(".edit", ".update");
            let norm_req = required_perm
                .replace(".view", ".read")
                .replace(".edit", ".update");
            norm_user == norm_req
        });

        if has_permission {
            Ok(next.run(request).await)
        } else {
            tracing::warn!(
                "Default-deny: Access denied for route {}. Required permission: {}, User Has: {:?}",
                matched_path,
                required_perm,
                claims.permissions
            );
            Err(StatusCode::FORBIDDEN)
        }
    } else {
        tracing::warn!(
            "Default-deny: Fail-closed block on unmapped route {}",
            matched_path
        );
        Err(StatusCode::FORBIDDEN)
    }
}
