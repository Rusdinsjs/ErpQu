use crate::api::server::AppState;
use axum::{
    extract::{Path, State},
    Extension, Json,
};
use management_system_core::application::dto::common::ApiResponse;
use management_system_core::domain::entities::setting::{Setting, UpdateSettingRequest};
use management_system_core::domain::entities::UserClaims;
use management_system_core::shared::errors::AppError;

/// List all settings (Admin Only)
#[utoipa::path(
    get,
    path = "/api/settings",
    tag = "Settings",
    responses(
        (status = 200, description = "List of all settings", body = ApiResponse<Vec<Setting>>)
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn get_all_settings(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<Setting>>>, AppError> {
    let settings = state.settings_service.list_settings().await?;

    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(settings),
    }))
}

/// Update a setting (Admin Only)
#[utoipa::path(
    put,
    path = "/api/settings/{key}",
    tag = "Settings",
    params(
        ("key" = String, Path, description = "Setting Key (e.g. app_name)")
    ),
    request_body = UpdateSettingRequest,
    responses(
        (status = 200, description = "Setting updated successfully", body = ApiResponse<Setting>)
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn update_setting(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
    Path(key): Path<String>,
    Json(payload): Json<UpdateSettingRequest>,
) -> Result<Json<ApiResponse<Setting>>, AppError> {
    let user_id = uuid::Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::BadRequest("Invalid user ID in token".to_string()))?;

    let setting = state
        .settings_service
        .update_setting(&key, payload.value, payload.description, user_id)
        .await?;

    Ok(Json(ApiResponse {
        success: true,
        message: Some("Setting updated successfully".to_string()),
        data: Some(setting),
    }))
}

/// Get public settings (No Auth)
#[utoipa::path(
    get,
    path = "/api/public-settings",
    tag = "Settings",
    responses(
        (status = 200, description = "Public configuration", body = ApiResponse<serde_json::Value>)
    )
)]
pub async fn get_public_settings(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let config = state.settings_service.get_public_settings().await?;

    Ok(Json(ApiResponse {
        success: true,
        message: None,
        data: Some(config),
    }))
}

/// Reset Database (Super Admin Only)
#[utoipa::path(
    post,
    path = "/api/settings/reset-database",
    tag = "Settings",
    responses(
        (status = 200, description = "Database reset successfully", body = ApiResponse<serde_json::Value>)
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn reset_database(
    State(state): State<AppState>,
    Extension(claims): Extension<UserClaims>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    if claims.role != "super_admin" {
        return Err(AppError::Forbidden(
            "Only super_admin can reset the database".to_string(),
        ));
    }

    let sql = r#"
DO $$
DECLARE
    row RECORD;
    truncate_stmt TEXT := '';
BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_organization_id_fkey;
    
    UPDATE public.users SET department_id = NULL, organization_id = NULL;
    UPDATE public.user_roles SET organization_id = NULL;

    FOR row IN
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('public', 'hr', 'crm', 'rental', 'inventory', 'commercial')
          AND tablename NOT IN ('users', 'roles', 'user_roles', '_sqlx_migrations')
    LOOP
        truncate_stmt := truncate_stmt || quote_ident(row.schemaname) || '.' || quote_ident(row.tablename) || ', ';
    END LOOP;

    IF length(truncate_stmt) > 0 THEN
        truncate_stmt := 'TRUNCATE ' || rtrim(truncate_stmt, ', ') || ' CASCADE;';
        EXECUTE truncate_stmt;
    END IF;

    ALTER TABLE public.users ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;
    ALTER TABLE public.users ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
END $$;
"#;

    sqlx::query(sql)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Internal(format!("Database reset failed: {}", e)))?;

    Ok(Json(ApiResponse {
        success: true,
        message: Some("Database reset successfully".to_string()),
        data: None,
    }))
}
