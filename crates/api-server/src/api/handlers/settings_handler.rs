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

    // Tables to preserve during factory reset
    // users, roles, user_roles: user accounts & RBAC
    // settings: system configuration
    // _sqlx_migrations: migration tracking
    // refresh_tokens, user_sessions: active auth sessions (so current user stays logged in)
    // uploads: uploaded file metadata
    let sql = r#"
DO $$
DECLARE
    row RECORD;
    fk RECORD;
    truncate_stmt TEXT := '';
    preserved_tables TEXT[] := ARRAY[
        'users', 'roles', 'user_roles', '_sqlx_migrations',
        'settings', 'refresh_tokens', 'user_sessions',
        'tenant_storage_quotas', 'uploads'
    ];
    dropped_fks TEXT[][] := ARRAY[]::TEXT[][];
BEGIN
    -- Phase 1: Discover and drop all FK constraints from preserved tables
    -- that reference tables which WILL be truncated
    FOR fk IN
        SELECT
            tc.table_schema AS src_schema,
            tc.table_name AS src_table,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema AS ref_schema,
            ccu.table_name AS ref_table,
            ccu.column_name AS ref_column,
            rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
            AND tc.table_schema = ccu.table_schema
        JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
            AND tc.table_schema = rc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = ANY(preserved_tables)
          AND NOT (ccu.table_name = ANY(preserved_tables))
          AND tc.table_schema IN ('public', 'hr', 'crm', 'rental', 'inventory', 'commercial')
    LOOP
        -- Null out the FK column in the preserved table
        EXECUTE format(
            'UPDATE %I.%I SET %I = NULL WHERE %I IS NOT NULL',
            fk.src_schema, fk.src_table, fk.column_name, fk.column_name
        );
        -- Drop the FK constraint
        EXECUTE format(
            'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
            fk.src_schema, fk.src_table, fk.constraint_name
        );
        -- Remember for re-creation
        dropped_fks := dropped_fks || ARRAY[[
            fk.src_schema, fk.src_table, fk.constraint_name,
            fk.column_name, fk.ref_schema, fk.ref_table, fk.ref_column,
            fk.delete_rule
        ]];
    END LOOP;

    -- Phase 2: Build TRUNCATE statement for all non-preserved tables
    FOR row IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('public', 'hr', 'crm', 'rental', 'inventory', 'commercial')
          AND NOT (tablename = ANY(preserved_tables))
    LOOP
        truncate_stmt := truncate_stmt || quote_ident(row.schemaname) || '.' || quote_ident(row.tablename) || ', ';
    END LOOP;

    IF length(truncate_stmt) > 0 THEN
        truncate_stmt := 'TRUNCATE ' || rtrim(truncate_stmt, ', ') || ' CASCADE;';
        EXECUTE truncate_stmt;
    END IF;

    -- Phase 3: Re-create dropped FK constraints
    FOR i IN 1..coalesce(array_length(dropped_fks, 1), 0) LOOP
        BEGIN
            EXECUTE format(
                'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) ON DELETE %s',
                dropped_fks[i][1], dropped_fks[i][2], dropped_fks[i][3],
                dropped_fks[i][4],
                dropped_fks[i][5], dropped_fks[i][6], dropped_fks[i][7],
                CASE dropped_fks[i][8]
                    WHEN 'CASCADE' THEN 'CASCADE'
                    WHEN 'SET NULL' THEN 'SET NULL'
                    WHEN 'SET DEFAULT' THEN 'SET DEFAULT'
                    WHEN 'NO ACTION' THEN 'NO ACTION'
                    ELSE 'RESTRICT'
                END
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not re-create FK constraint %: %', dropped_fks[i][3], SQLERRM;
        END;
    END LOOP;
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
