//! RBAC Middleware (Granular Route-Action & Segregation of Duties Enforcement)

use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};
use management_system_core::domain::entities::UserClaims;

use crate::api::middleware::route_action_registry::resolve_route_permission;

pub fn extract_user_claims(request: &Request) -> Option<UserClaims> {
    request.extensions().get::<UserClaims>().cloned()
}

pub struct RequirePermission;

impl RequirePermission {
    pub fn new(
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

                let has_permission = claims.permissions.iter().any(|p| {
                    if *p == "*"
                        && !permission.ends_with(".approve")
                        && !permission.ends_with(".post")
                        && !permission.ends_with(".disburse")
                    {
                        return true;
                    }
                    if *p == permission {
                        return true;
                    }
                    if let Some(p_prefix) = p.strip_suffix(".*") {
                        if permission.starts_with(p_prefix)
                            && !permission.ends_with(".approve")
                            && !permission.ends_with(".post")
                            && !permission.ends_with(".disburse")
                        {
                            return true;
                        }
                    }
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
}

pub fn require_permission(
    permission: &'static str,
) -> impl Fn(
    Request,
    Next,
) -> std::pin::Pin<
    Box<dyn std::future::Future<Output = Result<Response, StatusCode>> + Send>,
> + Clone {
    RequirePermission::new(permission)
}

/// Admin-only middleware
pub async fn admin_only_middleware(request: Request, next: Next) -> Result<Response, StatusCode> {
    let claims = extract_user_claims(&request).ok_or(StatusCode::UNAUTHORIZED)?;

    if claims.role == "admin" || claims.role == "super_admin" || claims.role.starts_with("admin_") {
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

    // Resolve explicit action permission from RouteActionRegistry (create, submit, approve, reject, post, reverse, release, disburse, cancel)
    if let Some(required_perm) = resolve_route_permission(request.method(), &matched_path) {
        let is_sensitive_action = required_perm.ends_with(".approve")
            || required_perm.ends_with(".post")
            || required_perm.ends_with(".disburse")
            || required_perm.ends_with(".release");

        let has_permission = claims.permissions.iter().any(|p| {
            if *p == "*" && !is_sensitive_action {
                return true;
            }
            if *p == required_perm {
                return true;
            }
            if let Some(p_prefix) = p.strip_suffix(".*") {
                if required_perm.starts_with(p_prefix) && !is_sensitive_action {
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
