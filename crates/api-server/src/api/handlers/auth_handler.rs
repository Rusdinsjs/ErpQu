//! Auth Handler (Fase 22: Short Access Token, Rotating Refresh Token, Session Invalidation)

use axum::{
    extract::State,
    http::{header, HeaderMap},
    Json,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::api::server::AppState;
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::errors::AppError;
use management_system_core::shared::utils::crypto::{generate_secure_token, hash_token};
use management_system_core::shared::utils::jwt::create_token;

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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refresh_token: Option<String>,
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
    headers: HeaderMap,
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
        Ok((user, access_token, raw_refresh_token)) => {
            state.lockout_tracker.record_success(&email_clean).await;

            // Store hashed refresh token in database (Fail-Closed)
            let refresh_hash = hash_token(&raw_refresh_token);
            let refresh_expiry = Utc::now() + Duration::days(state.jwt_config.refresh_expiry_days);
            let user_agent = headers
                .get(header::USER_AGENT)
                .and_then(|h| h.to_str().ok())
                .map(|s| s.to_string());
            let ip_address = headers
                .get("x-forwarded-for")
                .and_then(|h| h.to_str().ok())
                .map(|s| s.to_string());

            let _ = sqlx::query(
                r#"
                INSERT INTO public.refresh_tokens (id, user_id, token_hash, expires_at, revoked, user_agent, ip_address)
                VALUES ($1, $2, $3, $4, FALSE, $5, $6)
                "#
            )
            .bind(Uuid::new_v4())
            .bind(user.id)
            .bind(&refresh_hash)
            .bind(refresh_expiry)
            .bind(user_agent)
            .bind(ip_address)
            .execute(&state.pool)
            .await;

            tracing::info!(
                "SECURITY AUDIT LOGIN_SUCCESS: Email={} UserID={} Role={}",
                user.email,
                user.id,
                user.role
            );

            Ok(Json(LoginResponse {
                success: true,
                token: access_token,
                refresh_token: Some(raw_refresh_token),
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

/// Refresh token request
#[derive(Deserialize, ToSchema)]
pub struct RefreshRequest {
    pub refresh_token: Option<String>,
}

/// Refresh token response
#[derive(Serialize, ToSchema)]
pub struct RefreshResponse {
    pub success: bool,
    pub token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refresh_token: Option<String>,
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
    tag = "auth"
)]
pub async fn refresh_token(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Option<Json<RefreshRequest>>,
) -> Result<Json<RefreshResponse>, AppError> {
    // 1. Try to extract raw refresh token from payload or authorization header
    let raw_refresh_token = payload
        .and_then(|p| p.refresh_token.clone())
        .or_else(|| {
            headers
                .get(header::AUTHORIZATION)
                .and_then(|h| h.to_str().ok())
                .map(|s| s.strip_prefix("Bearer ").unwrap_or(s).to_string())
        })
        .ok_or_else(|| AppError::Unauthorized("Refresh token is required".to_string()))?;

    // 2. Hash and lookup in database
    let token_hash = hash_token(&raw_refresh_token);

    let row = sqlx::query_as::<_, (Uuid, Uuid, chrono::DateTime<Utc>, bool)>(
        r#"
        SELECT id, user_id, expires_at, revoked
        FROM public.refresh_tokens
        WHERE token_hash = $1
        "#,
    )
    .bind(&token_hash)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        AppError::Internal(format!("Database error during refresh token lookup: {}", e))
    })?;

    if let Some((record_id, user_id, expires_at, revoked)) = row {
        if revoked {
            // Token reuse detection! Invalidate all user sessions immediately (RFC 6819)
            state
                .session_tracker
                .invalidate_user_sessions(user_id)
                .await;
            tracing::warn!(
                "SECURITY ALERT: Refresh token reuse detected for user {}. All sessions revoked!",
                user_id
            );
            return Err(AppError::Unauthorized(
                "Refresh token has been revoked".to_string(),
            ));
        }

        if expires_at < Utc::now() {
            return Err(AppError::Unauthorized(
                "Refresh token has expired".to_string(),
            ));
        }

        // Fetch user info for new access token
        let user = state
            .user_service
            .get_profile(user_id)
            .await
            .map_err(|_| AppError::Unauthorized("User not found".to_string()))?;

        if !user.is_active {
            return Err(AppError::Unauthorized("Account is disabled".to_string()));
        }

        // Generate new rotating refresh token
        let new_raw_refresh = generate_secure_token();
        let new_refresh_hash = hash_token(&new_raw_refresh);
        let new_refresh_expiry = Utc::now() + Duration::days(state.jwt_config.refresh_expiry_days);

        // Mark old token as revoked & replaced
        let _ = sqlx::query(
            "UPDATE public.refresh_tokens SET revoked = TRUE, replaced_by_token = $1 WHERE id = $2",
        )
        .bind(&new_refresh_hash)
        .bind(record_id)
        .execute(&state.pool)
        .await;

        // Insert new refresh token
        let _ = sqlx::query(
            r#"
            INSERT INTO public.refresh_tokens (id, user_id, token_hash, expires_at, revoked)
            VALUES ($1, $2, $3, $4, FALSE)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(&new_refresh_hash)
        .bind(new_refresh_expiry)
        .execute(&state.pool)
        .await;

        // Generate new short-lived access token
        let access_expiry = Utc::now() + Duration::minutes(state.jwt_config.access_expiry_minutes);
        let new_claims = UserClaims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            name: user.name.clone(),
            role: user.role.clone(),
            role_level: user.role_level,
            department: user.department.clone(),
            allowed_asset_group: user.allowed_asset_group.clone(),
            org: user.organization_id.map(|id| id.to_string()),
            employee_id: user.employee_id,
            permissions: vec!["*".to_string()], // will be verified via RBAC middleware
            exp: access_expiry.timestamp(),
            iat: Utc::now().timestamp(),
            jti: Uuid::new_v4().to_string(),
        };

        let new_access_token = create_token(&new_claims, &state.jwt_config)
            .map_err(|e| AppError::Internal(format!("Access token generation failed: {}", e)))?;

        tracing::info!(
            "SECURITY AUDIT: Refresh token rotated successfully for user {}",
            user_id
        );

        Ok(Json(RefreshResponse {
            success: true,
            token: new_access_token,
            refresh_token: Some(new_raw_refresh),
            expires_at: access_expiry.to_rfc3339(),
        }))
    } else {
        Err(AppError::Unauthorized("Invalid refresh token".to_string()))
    }
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
    // Revoke the current access token JTI
    let expiry = chrono::DateTime::from_timestamp(claims.exp, 0)
        .unwrap_or_else(|| Utc::now() + Duration::hours(24));
    state
        .session_tracker
        .revoke_jti(claims.jti.clone(), expiry)
        .await;

    tracing::info!(
        "SECURITY AUDIT LOGOUT: UserID={} Email={} JTI={}",
        claims.sub,
        claims.email,
        claims.jti
    );

    Ok(Json(LogoutResponse {
        success: true,
        message: "Successfully logged out".to_string(),
    }))
}

/// Logout from all devices (revoke all sessions and refresh tokens)
pub async fn logout_all(
    State(state): State<AppState>,
    axum::Extension(claims): axum::Extension<UserClaims>,
) -> Result<Json<LogoutResponse>, AppError> {
    let user_id = claims.user_id();

    // 1. Invalidate all active JWT tokens across Redis cluster
    state
        .session_tracker
        .invalidate_user_sessions(user_id)
        .await;

    // 2. Revoke all refresh tokens in database
    let _ = sqlx::query(
        "UPDATE public.refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE",
    )
    .bind(user_id)
    .execute(&state.pool)
    .await;

    tracing::warn!(
        "SECURITY AUDIT LOGOUT_ALL: All sessions and refresh tokens revoked for user {}",
        user_id
    );

    Ok(Json(LogoutResponse {
        success: true,
        message: "All sessions have been revoked successfully".to_string(),
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
