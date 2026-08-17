//! Auth Handler

use axum::{
    extract::State,
    http::header,
    Json,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::errors::AppError;
use management_system_core::shared::utils::jwt::{create_token, decode_token};

use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct LoginRequest {
    #[schema(example = "admin@example.com")]
    pub email: String,
    #[schema(example = "password")]
    pub password: String,
}

#[derive(Serialize, ToSchema)]
pub struct LoginResponse {
    pub success: bool,
    pub token: String,
    pub user: UserInfo,
}

#[derive(Serialize, ToSchema)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: String,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 401, description = "Unauthorized")
    ),
    tag = "auth"
)]
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let email_clean = payload.email.trim().to_lowercase();

    // QSEC-009: Check lockout status before proceeding with authentication
    if let Err(msg) = state.lockout_tracker.check_lockout(&email_clean).await {
        tracing::warn!(
            "SECURITY AUDIT LOGIN_BLOCKED: Email={} Reason=AccountLocked",
            email_clean
        );
        return Err(AppError::Forbidden(msg));
    }

    // Attempt authentication
    match state
        .auth_service
        .login(&email_clean, &payload.password)
        .await
    {
        Ok((user, token)) => {
            state.lockout_tracker.record_success(&email_clean).await;

            tracing::info!(
                "SECURITY AUDIT LOGIN_SUCCESS: Email={} UserID={} Role={}",
                user.email,
                user.id,
                user.role
            );

            Ok(Json(LoginResponse {
                success: true,
                token,
                user: UserInfo {
                    id: user.id.to_string(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                    avatar_url: user.avatar_url,
                },
            }))
        }
        Err(err) => {
            let (count, is_locked) = state
                .lockout_tracker
                .record_failed_attempt(&email_clean)
                .await;
            tracing::warn!(
                "SECURITY AUDIT LOGIN_FAILED: Email={} FailedCount={} Locked={} Error={:?}",
                email_clean,
                count,
                is_locked,
                err
            );
            Err(AppError::Domain(err))
        }
    }
}

/// Refresh token response
#[derive(Serialize, ToSchema)]
pub struct RefreshResponse {
    pub success: bool,
    pub token: String,
    pub expires_at: String,
}

/// Logout response
#[derive(Serialize, ToSchema)]
pub struct LogoutResponse {
    pub success: bool,
    pub message: String,
}

#[utoipa::path(
    post,
    path = "/api/auth/refresh",
    responses(
        (status = 200, description = "Token refreshed", body = RefreshResponse),
        (status = 401, description = "Invalid or expired token")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "auth"
)]
pub async fn refresh_token(
    State(state): State<AppState>,
    request: axum::http::Request<axum::body::Body>,
) -> Result<Json<RefreshResponse>, AppError> {
    // Extract current token from Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .unwrap_or(auth_header);

    // Decode the existing token (allow expired tokens within a grace window)
    let claims: UserClaims = decode_token(token, &state.jwt_config)
        .map_err(|e| {
            tracing::warn!("SECURITY AUDIT REFRESH_FAILED: Token decode error={}", e);
            AppError::Unauthorized("Invalid token".to_string())
        })?;

    // Check if token JTI has been revoked (logout was called)
    if state.session_tracker.is_jti_revoked(&claims.jti).await {
        return Err(AppError::Unauthorized("Token has been revoked".to_string()));
    }

    // Check if user sessions have been invalidated (role/password change)
    if state.session_tracker.is_user_token_invalidated(claims.user_id(), claims.iat).await {
        return Err(AppError::Unauthorized("Session invalidated due to security change".to_string()));
    }

    // Revoke the old token JTI to prevent reuse
    let old_expiry = chrono::DateTime::from_timestamp(claims.exp, 0)
        .unwrap_or_else(|| Utc::now() + Duration::hours(24));
    state.session_tracker.revoke_jti(claims.jti.clone(), old_expiry).await;

    // Issue a new token with fresh expiry and new JTI
    let new_expiry = Utc::now() + Duration::hours(state.jwt_config.expiry_hours);
    let new_claims = UserClaims {
        sub: claims.sub,
        email: claims.email,
        name: claims.name,
        role: claims.role,
        role_level: claims.role_level,
        department: claims.department,
        allowed_asset_group: claims.allowed_asset_group,
        org: claims.org,
        employee_id: claims.employee_id,
        permissions: claims.permissions,
        exp: new_expiry.timestamp(),
        iat: Utc::now().timestamp(),
        jti: Uuid::new_v4().to_string(),
    };

    let new_token = create_token(&new_claims, &state.jwt_config)
        .map_err(|e| AppError::Internal(format!("Token generation failed: {}", e)))?;

    tracing::info!(
        "SECURITY AUDIT TOKEN_REFRESHED: UserID={} NewJTI={}",
        new_claims.sub, new_claims.jti
    );

    Ok(Json(RefreshResponse {
        success: true,
        token: new_token,
        expires_at: new_expiry.to_rfc3339(),
    }))
}

#[utoipa::path(
    post,
    path = "/api/auth/logout",
    responses(
        (status = 200, description = "Logged out successfully", body = LogoutResponse),
        (status = 401, description = "Not authenticated")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "auth"
)]
pub async fn logout(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<UserClaims>,
) -> Result<Json<LogoutResponse>, AppError> {
    // Revoke the current token JTI
    let expiry = chrono::DateTime::from_timestamp(claims.exp, 0)
        .unwrap_or_else(|| Utc::now() + Duration::hours(24));
    state.session_tracker.revoke_jti(claims.jti.clone(), expiry).await;

    tracing::info!(
        "SECURITY AUDIT LOGOUT: UserID={} Email={} JTI={}",
        claims.sub, claims.email, claims.jti
    );

    Ok(Json(LogoutResponse {
        success: true,
        message: "Successfully logged out".to_string(),
    }))
}

#[utoipa::path(
    post,
    path = "/api/auth/register",
    request_body = management_system_core::application::dto::user_dto::CreateUserRequest,
    responses(
        (status = 201, description = "User created", body = management_system_core::domain::entities::User),
        (status = 400, description = "Bad Request")
    ),
    tag = "auth"
)]
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<management_system_core::application::dto::user_dto::CreateUserRequest>,
) -> Result<
    (
        axum::http::StatusCode,
        Json<management_system_core::domain::entities::User>,
    ),
    AppError,
> {
    if !state.allow_public_registration {
        return Err(AppError::Forbidden(
            "Public self-registration is disabled in production. Please contact an administrator for an invitation.".to_string(),
        ));
    }

    let user = state
        .auth_service
        .register(&payload.email, &payload.password, &payload.name)
        .await?;

    Ok((axum::http::StatusCode::CREATED, Json(user)))
}
